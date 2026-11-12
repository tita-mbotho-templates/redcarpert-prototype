/** Preserve the theme's menu DOM/classes, with native events and animations. */
export function installNavigation() {
  const prototype = window.PEXETO?.menuNav?.prototype;
  if (!prototype) return;
  prototype.init = function () {
    const menu = this.$menu[0];
    const mobile = document.createElement('div');
    mobile.className = 'mob-nav-menu';
    mobile.innerHTML = menu.innerHTML;
    document.querySelector('#header .section-header')?.after(mobile);
    const button = document.querySelector('#header .mobile-nav');
    if (!button) return;
    button.setAttribute('role','button'); button.tabIndex = 0;
    button.setAttribute('aria-expanded','false');
    const reveal = (element, show, slide = false) => {
      element.getAnimations().forEach(animation => animation.cancel());
      if (show) element.style.display = 'block';
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animation = element.animate(slide ? [{height:show?'0px':element.scrollHeight+'px',overflow:'hidden'},{height:show?element.scrollHeight+'px':'0px',overflow:'hidden'}] : [{opacity:show?0:1},{opacity:show?1:0}], {duration:reduced?0:slide?400:300,easing:'ease'});
      animation.onfinish = () => { if (!show) element.style.display = 'none'; };
    };
    const toggle = () => {
      const show = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded',String(show)); reveal(mobile,show,true);
    };
    button.addEventListener('click',toggle);
    button.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();toggle();}});
    window.addEventListener('resize',()=>{if(getComputedStyle(button).display==='none'){mobile.style.display='none';button.setAttribute('aria-expanded','false');}});
    for(const li of mobile.querySelectorAll('li')) {
      const ul = li.querySelector(':scope > ul'); if(!ul) continue;
      const arrow = document.createElement('div'); arrow.className='mob-nav-arrow'; arrow.innerHTML='<span></span>';
      arrow.setAttribute('role','button'); arrow.tabIndex=0; arrow.setAttribute('aria-label','Toggle dress categories'); arrow.setAttribute('aria-expanded','false');
      const toggleSub = () => {const show = arrow.getAttribute('aria-expanded') !== 'true';arrow.setAttribute('aria-expanded',String(show));arrow.classList.toggle('mob-sub-opened',show);reveal(ul,show,true);};
      arrow.addEventListener('click',toggleSub); arrow.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();toggleSub();}});li.append(arrow);
    }
    for(const li of menu.querySelectorAll('li')) {
      const ul = li.querySelector(':scope > ul'); if(!ul) continue;
      li.querySelector(':scope > a')?.insertAdjacentHTML('beforeend','<span class="drop-arrow"></span>');
      const show = () => {li.classList.add('hovered'); ul.style.left='0px';const overflow=li.getBoundingClientRect().left+ul.getBoundingClientRect().width-innerWidth;if(overflow>0)ul.style.left=-overflow-3+'px';reveal(ul,true);};
      const hide = () => {li.classList.remove('hovered');reveal(ul,false);};
      li.addEventListener('mouseenter',show);li.addEventListener('mouseleave',hide);li.addEventListener('focusin',show);li.addEventListener('focusout',event=>{if(!li.contains(event.relatedTarget))hide();});
    }
  };
}
