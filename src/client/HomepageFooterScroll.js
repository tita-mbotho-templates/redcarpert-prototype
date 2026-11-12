/**
 * Native homepage scrolling: no fullpage.js snap engine and no wheel/keyboard
 * interception. The three editorial photographs and footer flow as one page.
 */
export function HomepageFooterScroll() {
  const footer = document.querySelector('footer[data-homepage-footer]');
  const sections = [...document.querySelectorAll('.fullpage-wrapper > .section')];
  if (!footer || sections.length !== 3) return;

  const arrow = sections[0].querySelector('.fullpage-scroll-arrow');
  const moveDown = () => sections[1].scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  });

  // The original down-arrow is a visual span; give it keyboard semantics.
  if (arrow) {
    arrow.setAttribute('role', 'button');
    arrow.tabIndex = 0;
    arrow.setAttribute('aria-label', 'Scroll to the next bridal photograph');
    arrow.addEventListener('click', moveDown);
  }
  const onArrowKey = event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    moveDown();
  };
  arrow?.addEventListener('keydown', onArrowKey);

  const onHome = event => {
    if (!(event.target instanceof Element)) return;
    const homeLink = event.target.closest(
      '#header #logo-container > a, #header #menu-item-15418 > a, #header .mob-nav-menu #menu-item-15418 > a'
    );
    if (!homeLink || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const href = new URL(homeLink.href, location.href);
    if (href.origin !== location.origin || href.pathname !== location.pathname) return;
    event.preventDefault();
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    window.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
    const mobileMenu = document.querySelector('#header .mobile-nav');
    if (mobileMenu?.getAttribute('aria-expanded') === 'true') mobileMenu.click();
  };
  document.addEventListener('click', onHome, true);
  return () => {
    arrow?.removeEventListener('click', moveDown);
    arrow?.removeEventListener('keydown', onArrowKey);
    document.removeEventListener('click', onHome, true);
  };
}
