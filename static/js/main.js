function findCurrentSection(htmlEl, mainEl) {
  const windowHeight = htmlEl.clientHeight;
  const scrollHeight = htmlEl.scrollHeight;
  const scrollTop = htmlEl.scrollTop;

  // figure out which section we're in. basically, in order to make this work well for the first and last sections, we:
  // 1. pick a point as far down the window as we are down the scrollbar and in the middle of the main element
  const scrollPct = scrollTop / (scrollHeight - windowHeight);
  const targetY = (windowHeight - 1) * scrollPct; // targetY is a position but windowHeight is a length, -1 to avoid fencepost error
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
    // above or below main; clamp
    targetEl = scrollPct < 0.5 ? mainEl.firstElementChild : mainEl.lastElementChild;
  }

  // 3. walk back through siblings until we find an h1 or h2
  while(!['h1', 'h2'].includes(targetEl.nodeName.toLowerCase())) {
    targetEl = targetEl.previousElementSibling;
  }

  return targetEl.id;
}

function highlightNav(navEl, currentId) {
  navEl.querySelectorAll('.current').forEach(node => node.classList.remove('current'));
  
  const newCurrent = navEl.querySelector(`[href="#${currentId}"]`).closest('p, li');
  newCurrent.classList.add('current');
  
  const navScroll = navEl.querySelector('#nav-scroll-container');
  // scroll the nav panel so the highlight is close to 250px below the top of the screen
  navScroll.scrollTop = newCurrent.offsetTop - 250;
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
