import unified from 'unified';
import md2mdast from 'remark-parse';
import slug from 'remark-slug';
import smartypants from '@silvenon/remark-smartypants';
import footnotes from 'remark-footnotes';
import toc from 'mdast-util-toc';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

async function buildChecklist(text, layout, info) {
  // Parse the markdown into mdast
  const rawTextMdast = unified()
                        .use(md2mdast)
                        .parse(text);

  // Generate the body text
  const bodyHast = await unified()
    .use(smartypants)
    .use(remark2rehype)
    .run(rawTextMdast);

  const bodyHtml = unified()
    .use(rehype2html)
    .stringify(bodyHast);

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, body: bodyHtml});

  return page;
}

export default buildChecklist;
