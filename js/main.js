function findCurrentSection(htmlEl, mainEl) {
  const windowHeight = htmlEl.clientHeight;

  // Figure out which section we're in. We have to take into account both the size of the footnote section and
  // the position of the page after clicking a link in the sidebar. So we:
  // 1. Focus on the point 15% of the way down the window (a reasonable place for the reader to be looking at) and
  // in the middle of the main section
  
  // targetY is a position but windowHeight is a length, so -1 to avoid a fencepost error
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
    // above main; just highlight the first possibility
    targetEl = mainEl.firstElementChild;
  }

  // 3. walk back through siblings until we find an h1 or h2
  while(!['h1', 'h2'].includes(targetEl.nodeName.toLowerCase())) {
    targetEl = targetEl.previousElementSibling;
  }

  return targetEl.id;
}

function highlightNav(navEl, currentId) {
  // first remove any previously-selected highlights
  navEl.querySelectorAll('.currentSection').forEach(node => node.classList.remove('currentSection'));
  navEl.querySelectorAll('.currentGroup').forEach(node => node.classList.remove('currentGroup'));
  
  // find the current section's link in the toc
  const sectionNode = navEl.querySelector(`[href="#${currentId}"]`).closest('p, li');
  sectionNode.classList.add('currentSection');
  
  // find that section's group's li
  const groupNode = sectionNode.parentNode.closest('li');
  groupNode.classList.add('currentGroup');
  
  const navScroll = navEl.querySelector('#nav-scroll-container');
  // scroll the nav panel so the highlight is close to 250px below the top of the screen
  navScroll.scrollTop = sectionNode.offsetTop - 250;
}

function main() {
  const htmlEl = document.getElementsByTagName('html')[0];
  const navEl = document.getElementsByTagName('nav')[0];
  const mainEl = document.getElementsByTagName('main')[0];

  const onScroll = () => {
    const currentId = findCurrentSection(htmlEl, mainEl);
    if(currentId) {
      highlightNav(navEl, currentId);
    }
  }
  
  window.onscroll = onScroll;
  
  // also call the onScroll on page load to highlight the introduction
  onScroll();
}

main();
