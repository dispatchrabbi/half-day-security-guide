import unified from 'unified';
import md2mdast from 'remark-parse';
import slug from 'remark-slug';
import footnotes from 'remark-footnotes';
import toc from 'mdast-util-toc';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';

import Handlebars from 'handlebars';

function findHeader(blockquote) {
  for(let j = 0; j < blockquote.children.length; j++) {
    const inblock = blockquote.children[j];
    
    if(inblock.tagName === "h3") {
      for(let k = 0; k < inblock.children.length; k++) {
        const header = inblock.children[k];
        
        if(header.value === "One Step Further" || 
           header.value === "Paranoia Alert!" || 
           header.value === "Did You Know?") {
          return header.value;
        }
      }
    }
  }
  
  return false;
}

function tagSpecialSections(bodyHast) {  
  // walk the ast to find blockquote sections to specially color them
  for(let i = 0; i < bodyHast.children.length; i++) {
    const child = bodyHast.children[i];
    
    // find all the blockquotes
    if(child.tagName === "blockquote") {      
      // find all the blockquotes matching the specified heading
      const header = findHeader(child);
      
      // will the switch handle this nicely?
      if(header) {
        switch(header) {
          case "One Step Further":
            // probably should spread existing if exists?
            child.properties.className = ["one-step-further"];
            break;
          case "Paranoia Alert!":
            child.properties.className = ["paranoia-alert"];
            break;
          case "Did You Know?":
            child.properties.className = ["did-you-know"];
            break;
        }
      }
    }
  }
}

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
  tagSpecialSections(bodyHast);
  
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
