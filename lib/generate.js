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
  mdast.children
    .filter(node => node.type === 'blockquote')
    .forEach(bq => bq.data = { hProperties: { className: getClassNameForSection(bq) } });
}

function walkNodes(node, mutableInt) {
  if(!node.children) {
    return;
  }
  
  node.children
    // look for elements
    .filter(child => child.type === 'element')
    // that are superscipts
    .filter(child => child.tagName === 'sup')
    // that are tagged as footnote references
    .filter(child => child.properties.id.startsWith('fnref'))
    .forEach(child => {
      // get the next index
      const index = ++mutableInt[0];
      
      child.children
        // skip a generation (this is the anchor node)
        .flatMap(gc => gc.children || [])
        // find the text element
        .filter(ggc => ggc.type === 'text')
        // and change its value to our computed index!
        .forEach(ggc => ggc.value = `${index}`);
    });
  
  node.children.forEach(child => walkNodes(child, mutableInt));
}

function reindexFootnotes(hast) {  
  walkNodes(hast, [0]);
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
  tagCalloutSections(textMdastWithIds);


  // Generate the body text
  const bodyHast = await unified()
    .use(smartypants)
    .use(remark2rehype)
    .run(textMdastWithIds);
  
  // Reindex the footnote link text to match the footer
  // this is done in the hast to support inline footnotes
  reindexFootnotes(bodyHast);

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
