import directive from 'remark-directive';
import footnotes from 'remark-footnotes';
import h from 'hastscript';
import md2mdast from 'remark-parse';
import rehype2html from 'rehype-stringify';
import remark2rehype from 'remark-rehype';
import slug from 'remark-slug';
import smartypants from '@silvenon/remark-smartypants';
import toc from 'mdast-util-toc';
import unified from 'unified';
import visit from 'unist-util-visit';

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

function reindexFootnoteMarkersUnderNode(node, footnoteMap = new Map()) {
  // the footnote marker structure we're looking for is:
  // <sup id="fnref-${index}"><a class="footnote-ref" href="fn-${index}">${index}</a></sup>
  // and we need to normalize $index (if we find it) to whatever number is next

  // is this a footnote marker?
  if(node.type === 'element' && node.tagName === 'sup' && node.properties.id && node.properties.id.startsWith('fnref-')) {
    // yes! perform surgery
    const formerlyKnownAs = node.properties.id.replace('fnref-', '');
    const nextIndex = `${footnoteMap.size + 1}`; // we're only ever going to need this as a string

    node.properties.id = `fnref-${nextIndex}`;
    node.children[0].properties.href = `#fn-${nextIndex}`;
    node.children[0].children[0].value = nextIndex;

    footnoteMap.set(formerlyKnownAs, nextIndex);
  } else {
    // nope, recurse through the children that are elements
    footnoteMap = node.children
      .filter(child => child.type === 'element')
      .reduce((fnMap, child) => reindexFootnoteMarkersUnderNode(child, fnMap), footnoteMap);
  }

  return footnoteMap;
}

function reindexFootnoteListing(footnotesDiv, footnoteMap) {
  // we need to change all the linkbacks under the footnotes div to match the new mapping
  // we'll be looking for div.footnotes > ol > li[id=^fn-] > ...p > a[href=^fnref-]
  // and we will have to change those to match the ones we've collected

  const footnotes = footnotesDiv
    .children.filter(child => child.tagName === 'ol')[0]
    .children.filter(child => child.tagName === 'li');

  footnotes.forEach(function(footnote) {
    const formerlyKnownAs = footnote.properties.id.replace('fn-', '');
    const remappedIndex = footnoteMap.get(formerlyKnownAs);
    if(!remappedIndex) {
      throw new Error(`No footnote remapping found for ${formerlyKnownAs}! Something hinky is happening.`);
    };

    // surgery time
    footnote.properties.id = `fn-${remappedIndex}`;
    const linkback = footnote
      .children.filter(child => child.tagName === 'p')
      .flatMap(p => p.children).filter(child => child.tagName === 'a' && child.properties.href.startsWith('#fnref-'))[0];
    linkback.properties.href = `#fnref-${remappedIndex}`;
  });
}

function reindexFootnotes(bodyHast) {
  const footnotesDiv = bodyHast.children.filter(child => child.tagName === 'div' && child.properties.className && child.properties.className.includes('footnotes'))[0];
  if(!footnotesDiv) {
    throw new Error(`No footnotes div found. Did you call unified.use(footnotes)?`);
  };

  const footnoteMap = reindexFootnoteMarkersUnderNode(bodyHast);
  reindexFootnoteListing(footnotesDiv, footnoteMap);
}

function htmlDirectives() {
  return (tree) => {
    visit(tree, ['image'], configureImage);
  };

  function configureImage(node) {
    const hast = h('image', {
      ...node,
      align: 'right',
      // style: 'width: 256px;',
    });
    
    const data = node.data || (node.data = {});

    data.hName = hast.tagName;
    data.hProperties = hast.properties;
  }
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
    .use(directive)
    .use(htmlDirectives)
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

  // fill in the template with the html and the toc
  const template = Handlebars.compile(layout);
  const page = template({...info, toc: tocHtml, body: bodyHtml});

  return page;
}

export default generate;
