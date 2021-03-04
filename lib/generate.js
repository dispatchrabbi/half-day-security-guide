import unified from 'unified';
import md2mdast from 'remark-parse';
import slug from 'remark-slug';
import footnotes from 'remark-footnotes';
import toc from 'mdast-util-toc';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

async function generate(text, layout, info) {
  // Parse the markdown into mdast
  const textMdast = unified()
                        .use(footnotes, {inlineNotes: true})
                        .use(md2mdast)
                        .parse(text);
  
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
  // check the modification date of text.md?
  const guideDate = "27 February 2021";

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, toc: tocHtml, body: bodyHtml, generatedDate, guideDate});

  return page;
}

export default generate;
