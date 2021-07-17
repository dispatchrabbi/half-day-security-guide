function findCurrentSection(htmlEl, mainEl) {
  const windowHeight = htmlEl.clientHeight;

  // targetY is a position but windowHeight is a length, -1 to avoid fencepost error
  // the footnotes are long enough that scrolling to the bottom would highlight the last section
  // so I picked a point after the header that is a reasonable place for a reader to be looking at
  // it's also sized such that a click on a section in the sidebar will result in that section being highlit
  const targetY = (windowHeight - 1) * .15;
  
  const targetX = (mainEl.offsetLeft + mainEl.scrollWidth) / 2;

  // 2. figure out what direct child of <main> that corresponds to
  let targetEl = document.elementFromPoint(targetX, targetY);
  const closest = targetEl.closest('main > *');

  if(closest) {
    targetEl = closest;
  } else if(targetEl.nodeName.toLowerCase() === 'main') {
    // caught in a margin, don't change the highlight
    return null;
  } else {
    // above or below main; this is unlikely with non-dynamic scroll percent
    targetEl = mainEl.firstElementChild;
  }

  // 3. walk back through siblings until we find an h1 or h2
  while(!['h1', 'h2'].includes(targetEl.nodeName.toLowerCase())) {
    targetEl = targetEl.previousElementSibling;
  }

  return targetEl.id;
}

function findLIParent(node) {
  const parent = node.parentNode;
  
  if(parent.nodeName === "LI") {
    return parent;
  }
  
  return findLIParent(parent);
}

function highlightNav(navEl, currentId) {
  // first remove any previously-selected highlights
  navEl.querySelectorAll('.currentSection').forEach(node => node.classList.remove('currentSection'));
  navEl.querySelectorAll('.currentGroup').forEach(node => node.classList.remove('currentGroup'));
  
  // find the current section's link in the toc
  const sectionNode = navEl.querySelector(`[href="#${currentId}"]`).closest('p, li');
  sectionNode.classList.add('currentSection');
  
  // find that section's group's li
  let groupNode = findLIParent(sectionNode);
  groupNode.classList.add('currentGroup');
  
  const navScroll = navEl.querySelector('#nav-scroll-container');
  // scroll the nav panel so the highlight is close to 250px below the top of the screen
  navScroll.scrollTop = sectionNode.offsetTop - 250;
}

function main() {
  const htmlEl = document.getElementsByTagName('html')[0];
  const navEl = document.getElementsByTagName('nav')[0];
  const mainEl = document.getElementsByTagName('main')[0];

  window.onscroll = function() {
    const currentId = findCurrentSection(htmlEl, mainEl);
    if(currentId) {
      highlightNav(navEl, currentId);
    }
  }
}

main();
