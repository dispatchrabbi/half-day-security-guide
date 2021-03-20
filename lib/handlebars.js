import path from 'path';
import { readFile, readdir } from 'fs/promises';

import Handlebars from 'handlebars';

async function autoregisterPartials(partialsDir) {
  const partials = await readdir(partialsDir);
  const promises = partials.filter(filename => filename.endsWith('.hbs')).map(async function(filename) {
    const partialName = filename.slice(0, filename.length - '.hbs'.length);
    const contents = await readFile(path.join(partialsDir, filename), { encoding: 'utf-8' });
    Handlebars.registerPartial(partialName, contents);
    return partialName;
  });

  return Promise.all(promises);
}

async function setup({ partialsDir }) {
  await autoregisterPartials(partialsDir);
}

export default setup;
