import unified from 'unified';
import md2remark from 'remark-parse';
import smartypants from '@silvenon/remark-smartypants';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

async function buildChecklist(text, layout, info) {
  // process the markdown into HTML
  const bodyHtml = await unified()
    .use(md2remark)
    .use(smartypants)
    .use(remark2rehype)
    .use(rehype2html)
    .process(text);

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, body: bodyHtml});

  return page;
}

export default buildChecklist;
