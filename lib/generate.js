import unified from 'unified';
import md2mdast from 'remark-parse';
import slug from 'remark-slug';
import smartypants from '@silvenon/remark-smartypants';
import footnotes from 'remark-footnotes';
import toc from 'mdast-util-toc';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

const SECTION_CLASSES = {
  'One Step Further': 'one-step-further',
  'Paranoia Alert!': 'paranoia-alert',
  'Did You Know?': 'did-you-know',
};
function getClassNameForSection(blockquote) {
  const headerText = blockquote.children
    .filter(node => node.type === 'heading')[0].children
    .filter(node => node.type === 'text')[0].value;

  return SECTION_CLASSES[headerText];
}

function tagCalloutSections(mdast) {
  const bqs = mdast.children
    .filter(node => node.type === 'blockquote')
    .forEach(bq => bq.data = { hProperties: { className: getClassNameForSection(bq) } });

  return mdast;
}

async function generate(text, layout, info) {
  // Parse the markdown into mdast
  const rawTextMdast = unified()
                        .use(footnotes, {inlineNotes: true})
                        .use(md2mdast)
                        .parse(text);

  // Add IDs to the headings in the mdast
  const textMdastWithIds = await unified()
    .use(slug)
    .run(rawTextMdast);

  // Add classes to the special sections in the mdast
  const taggedTextMdast = tagCalloutSections(textMdastWithIds);

  // Generate the body text
  const bodyHast = await unified()
    .use(smartypants)
    .use(remark2rehype)
    .run(textMdastWithIds);

  const bodyHtml = unified()
    .use(rehype2html)
    .stringify(bodyHast);

  // Generate a table of contents to be used in the sidebar
  const tocMdast = toc(textMdastWithIds).map;
  const tocHast = await unified()
    .use(remark2rehype)
    .run(tocMdast);
  const tocHtml = unified()
    .use(rehype2html)
    .stringify(tocHast);

  // get the current date in ISO format to stamp the generated file
  const generatedDate = new Date().toISOString();

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, toc: tocHtml, body: bodyHtml, generatedDate});

  return page;
}

export default generate;
