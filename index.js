import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { readFile, writeFile, mkdir } from 'fs/promises';

import generateGuide from './lib/generate.js';

import { promisify } from 'util';
import copy from 'copy';

import sass from 'sass';

async function compileStyles(styleFile, destDir, styleDest) {
  // weirdly, renderSync is faster than render with Dart sass: https://sass-lang.com/documentation/js-api#fiber
  const styles = sass.renderSync({ file: styleFile });

  await mkdir(path.join(__dirname, destDir));

  await writeFile(path.join(__dirname, destDir, styleDest), styles.css.toString(), 'utf8');
}

async function buildGuide(infoJSON) {
  const indexTemplate = await readFile(path.join(__dirname, 'layout/index.hbs'));
  const srcText = await readFile(path.join(__dirname, 'src/text.md'));
  const indexPage = await generateGuide(srcText.toString(), indexTemplate.toString(), infoJSON);

  await writeFile(path.join(__dirname, 'dist/index.html'), indexPage, 'utf8');
}

async function init() {
  try {
    await mkdir(path.join(__dirname, 'dist'));
  } catch(ex) {
    // it's fine if the directory exists - but throw on anything else
    if(ex.code !== 'EEXIST' /* directory already exists */) { throw ex; }
  }

  const infoFile = await readFile(path.join(__dirname, 'src/info.json'));
  const infoJSON = JSON.parse(infoFile.toString());

  // build the main page
  await buildGuide(infoJSON);

  // compile scss into css
  await compileStyles('src/styles/styles.scss', 'dist/css', 'styles.css');

  // copy static files
  await promisify(copy)(path.join(__dirname, 'static', '**'), path.join(__dirname, 'dist'));
}

init().catch(function(ex) {
  console.error(ex);
});
