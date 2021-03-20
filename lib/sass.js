import path from 'path';
import { readdir, writeFile } from 'fs/promises';

import sass from 'sass';

async function compileStyles(src, dst) {
  const styleFiles = await readdir(src);
  const promises = styleFiles
    .filter(filename => filename.endsWith('.scss') && !filename.startsWith('_'))
    .map(async function(filename) {
      const styleFileName = filename.slice(0, filename.length - '.scss'.length);
      // weirdly, renderSync is faster than render with Dart sass: https://sass-lang.com/documentation/js-api#fiber
      const styles = sass.renderSync({ file: path.join(src, filename) });
      await writeFile(path.join(dst, styleFileName + '.css'), styles.css.toString(), 'utf8');
      return filename;
  });

  return Promise.all(promises);
}

export default compileStyles;
