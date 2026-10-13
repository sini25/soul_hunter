const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const resourceFile = resource => resource.startsWith('shared/')
  ? path.join(workspaceRoot, resource)
  : path.join(root, resource);
let server;
let base;

before(async () => {
  const { createAppServer } = await import(pathToFileURL(path.join(root, 'server.js')).href);
  server = createAppServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('the home page, index, and legacy URL serve the relocated game', async () => {
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  for (const route of ['/', '/index.html', '/reapers_fortune_3_gems.html']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.equal(await response.text(), html);
  }
  const response = await fetch(base, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(html));
  assert.equal(await response.text(), '');
});

test('all HTML, CSS, and configured symbol assets resolve on disk and over HTTP', async () => {
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const resources = new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]));
  for (const resource of [...resources].filter(value => value.endsWith('.css'))) {
    const css = await fs.readFile(resourceFile(resource), 'utf8');
    for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
      if (!match[1].startsWith('data:') && !match[1].startsWith('#')) {
        resources.add(path.posix.join(path.posix.dirname(resource), match[1]));
      }
    }
  }
  const config = await fs.readFile(path.join(root, 'src/js/config.js'), 'utf8');
  for (const match of config.matchAll(/(?:image|baseImage):'([^']+)'/g)) resources.add(match[1]);
  for (const resource of resources) {
    const file = await fs.readFile(resourceFile(resource));
    const response = await fetch(`${base}/${resource}`);
    assert.equal(response.status, 200, resource);
    assert.notEqual(response.headers.get('content-type'), 'application/octet-stream', resource);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), file, resource);
  }
});

test('the reel cabinet and counters cannot share a horizontal stage row', async () => {
  const css = await fs.readFile(path.join(root, 'src/css/ruby-frame.css'), 'utf8');
  assert.match(css, /\.slotStage\{flex-direction:column\}/);
  assert.match(css, /\.slotStage>\.cabinet,\.slotStage>\.slotReadouts\{grid-column:1 \/ -1\}/);
});

test('the responsive menu control remains circular at every size', async () => {
  const css = await fs.readFile(path.join(root, 'src/css/ruby-frame.css'), 'utf8');
  assert.match(css, /\.glassMenuBtn\{height:var\(--glass-side-size\)\}/);
  assert.match(css, /@media \(max-width:1366px\)\{[\s\S]*?\.glassMenuBtn\{[\s\S]*?left:8%;right:auto;top:-8px;bottom:auto;/);
  assert.match(css, /\.glassUtilityMenu\{[\s\S]*?grid-auto-flow:column;grid-auto-columns:44px;align-items:end/);
  assert.match(css, /\.glassUtilityMenu\.open\{transform:translateY\(-100%\)\}/);
  assert.match(css, /\.glassUtilityBtn\{width:44px;height:44px;min-width:44px;min-height:44px\}/);
  assert.match(css, /@media \(min-width:721px\) and \(max-width:1366px\)\{[\s\S]*?\.glassUtilityMenu\{grid-auto-columns:48px\}/);
});

test('ordinary spin results appear in the viewport bottom-right corner', async () => {
  const css = await fs.readFile(path.join(root, 'src/css/ruby-frame.css'), 'utf8');
  assert.match(css, /\.resultPopup:not\(\.freeSpins\)\{[^}]*position:fixed;left:auto;right:[^;]+;top:auto;[^}]*bottom:/);
  assert.match(css, /\.resultPopup:not\(\.freeSpins\)\.show\{animation:resultPopupCornerLife/);
});

test('the local server handles invalid requests and keeps development files private', async () => {
  for (const route of ['/missing.png', '/package.json', '/server.js', '/scripts/tests/controls.test.cjs',
    '/public/%2e%2e%2fpackage.json', '/src/%2e%2e%5cpackage.json', '/public/%00']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404, route);
    await response.text();
  }
  const invalid = await fetch(base + '/%ZZ');
  assert.equal(invalid.status, 400);
  await invalid.text();
  const post = await fetch(base, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
  await post.text();
});
