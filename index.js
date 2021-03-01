import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { readFile } from 'fs/promises';

import generate from './lib/generate.js';
import { read } from 'fs';

async function init() {

  const indexTemplate = await readFile(path.join(__dirname, 'layout/index.hbs'));
  const srcText = await readFile(path.join(__dirname, 'src/text.md'));
  const infoJson = await readFile(path.join(__dirname, 'src/info.json'));
  const indexPage = await generate(srcText.toString(), indexTemplate.toString(), JSON.parse(infoJson.toString()));

  console.log(indexPage);
}

init().catch(function(ex) {
  console.error(ex);
});
