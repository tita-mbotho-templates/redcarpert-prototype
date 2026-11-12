/**
 * Restore the shared compact header on the native-scroll homepage.
 * On downward travel the compact header tucks away; on upward travel it
 * returns. No wheel, touch or keyboard input is intercepted.
 */
export function initializeHomepageHeaderScroll() {
  if (!document.body.classList.contains('redcarpert-home-native')) return;
  const header = document.querySelector('#header');
  if (!header) return;
  const body = document.body;
  let last = Math.max(0,window.scrollY);
  let frame = 0;
  const update = () => {
    frame = 0;
    const current = Math.max(0,window.scrollY);
    const delta = current-last;
    if (current <= 20) {
      body.classList.remove('fixed-header-scroll','redcarpert-header-tucked');
    } else {
      body.classList.add('fixed-header-scroll');
      if (current > 115 && delta > 3) {
        body.classList.add('redcarpert-header-tucked');
      } else if (delta < -3) {
        body.classList.remove('redcarpert-header-tucked');
      }
    }
    last = current;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  update();
  return () => {
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('resize',onScroll);
    if (frame) cancelAnimationFrame(frame);
    body.classList.remove('redcarpert-header-tucked');
  };
}
