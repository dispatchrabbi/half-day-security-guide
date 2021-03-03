import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { readFile, writeFile, mkdir } from 'fs/promises';

import generate from './lib/generate.js';

import { promisify } from 'util';
import copy from 'copy';

async function init() {
  try {
    await mkdir(path.join(__dirname, 'dist'));
  } catch(ex) {
    // it's fine if the directory exists - but throw on anything else
    if(ex.code !== 'EEXIST' /* directory already exists */) { throw ex; }
  }

  const indexTemplate = await readFile(path.join(__dirname, 'layout/index.hbs'));
  const srcText = await readFile(path.join(__dirname, 'src/text.md'));
  const footerHTML = await readFile(path.join(__dirname, 'src/footer.html'));
  const infoJson = await readFile(path.join(__dirname, 'src/info.json'));
  const indexPage = await generate(srcText.toString(), footerHTML.toString(), indexTemplate.toString(), JSON.parse(infoJson.toString()));

  await writeFile(path.join(__dirname, 'dist/index.html'), indexPage, 'utf8');

  // copy static files
  await promisify(copy)(path.join(__dirname, 'static', '**'), path.join(__dirname, 'dist'));
}

init().catch(function(ex) {
  console.error(ex);
});
