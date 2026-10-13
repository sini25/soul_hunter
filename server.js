import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const {createThemeServer,startThemeServer}=require('../shared/server.js');

export function createAppServer(){return createThemeServer(root)}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  startThemeServer({themeRoot:root,themeName:'Soul Hunter',defaultPort:3009});
}
