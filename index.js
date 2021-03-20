import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { readFile, writeFile, mkdir } from 'fs/promises';

import setupHandlebars from './lib/handlebars.js';
import compileStyles from './lib/sass.js';

import generateGuide from './lib/pages/guide.js';
import generateChecklist from './lib/pages/checklist.js';

import { promisify } from 'util';
import copy from 'copy';

async function buildGuide(infoJSON) {
  const indexTemplate = await readFile(path.join(__dirname, 'layouts/index.hbs'));
  const srcText = await readFile(path.join(__dirname, 'src/text.md'));
  const indexPage = await generateGuide(srcText.toString(), indexTemplate.toString(), infoJSON);

  await writeFile(path.join(__dirname, 'dist/index.html'), indexPage, 'utf8');
}

async function buildChecklist(infoJSON) {
  const checklistTemplate = await readFile(path.join(__dirname, 'layouts/checklist.hbs'));
  const srcText = await readFile(path.join(__dirname, 'src/checklist.md'));
  const checklistPage = await generateChecklist(srcText.toString(), checklistTemplate.toString(), infoJSON);

  await writeFile(path.join(__dirname, 'dist/checklist.html'), checklistPage, 'utf8');

  return {
    title: 'Checklist',
    file: 'checklist.html',
  };
}

async function init() {
  try {
    await mkdir(path.join(__dirname, 'dist'));
  } catch(ex) {
    // it's fine if the directory exists - but throw on anything else
    if(ex.code !== 'EEXIST' /* directory already exists */) { throw ex; }
  }

  // pull in info about the site
  const infoFile = await readFile(path.join(__dirname, 'src/info.json'));
  const infoJSON = {
    ...JSON.parse(infoFile.toString()),
    generatedDate: new Date().toISOString(),
    resources: [],
  };

  setupHandlebars({
    partialsDir: path.join(__dirname, 'layouts/partials'),
  });

  // build a checklist page
  const checklistInfo = await buildChecklist(infoJSON);
  infoJSON.resources.push(checklistInfo);

  // build the main page (do this last so it can use the resources list)
  await buildGuide(infoJSON);

  // compile scss into css
  await mkdir(path.join(__dirname, 'dist/css'));
  await compileStyles(path.join(__dirname, 'src/styles'), path.join(__dirname, 'dist/css'));

  // copy static files
  await promisify(copy)(path.join(__dirname, 'static', '**'), path.join(__dirname, 'dist'));
}

init().catch(function(ex) {
  console.error(ex);
});
