import unified from 'unified';
import md2mdast from 'remark-parse';
import slug from 'remark-slug';
import toc from 'mdast-util-toc';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

async function generate(text, footer, layout, info) {
  // Parse the markdown into mdast
  const textMdast = unified().use(md2mdast).parse(text); // TODO: add footnotes
  // Add IDs to the headings in the mdast
  const textMdastWithIds = await unified().use(slug).run(textMdast);

  // Generate the body text
  const bodyHast = await unified().use(remark2rehype).run(textMdastWithIds);
  const bodyHtml = unified().use(rehype2html).stringify(bodyHast);

  // Generate a table of contents to be used in the sidebar
  const tocMdast = toc(textMdastWithIds).map;
  const tocHast = await unified().use(remark2rehype).run(tocMdast);
  const tocHtml = unified().use(rehype2html).stringify(tocHast);

  // get the current date in ISO format to stamp the generated file
  const generatedDate = new Date().toISOString();

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, toc: tocHtml, body: bodyHtml, footer, generatedDate});

  return page;
}

export default generate;
