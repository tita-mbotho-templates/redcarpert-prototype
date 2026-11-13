import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({args:['--no-sandbox']});
const base='http://localhost:4173/redcarpert-prototype';
try {
  for (const width of [320,375,390,768,1440]) {
    for (const route of ['/','/wedding-moments/','/about-us/']) {
      const page=await browser.newPage({viewport:{width,height:width===375?667:900}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+route,{waitUntil:'domcontentloaded'});
      const metrics=await page.evaluate(()=>{
        const footer=document.querySelector('footer[data-redcarpert-footer]');
        const brand=footer.querySelector('.redcarpert-footer-columns > .col:first-child');
        const socials=brand.querySelector('.social-icons');
        const float=document.querySelector('#redcarpert-floating-whatsapp');
        const text=n=>n?.textContent.trim().replace(/\s+/g,' ');
        const bounds=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};};
        const sample=footer.querySelector('.fa-brands.fa-whatsapp');
        const menu=document.querySelector('#header .mob-nav-btn');
        const menuStyle=getComputedStyle(menu);
        const menuIcon=menu.querySelector('.fa-solid.fa-bars');
        const menuBounds=bounds(menu);
        const iconBounds=menuIcon?bounds(menuIcon):null;
        return {
          menu:{
            backgroundImage:menuStyle.backgroundImage,
            paddingLeft:parseFloat(menuStyle.paddingLeft),
            visible:menuStyle.display!=='none' && bounds(menu).width>0,
            icons:menu.querySelectorAll('.fa-solid.fa-bars').length,
            text:menu.textContent.trim(),
            left:menuBounds.left,right:menuBounds.right,
            iconLeft:iconBounds?.left??null,
            iconRight:iconBounds?.right??null,
            iconGlyph:menuIcon?getComputedStyle(menuIcon,'::before').content:null,
          },
          fittingTitle:text(footer.querySelector('.redcarpert-footer-columns > .col:last-child .redcarpert-footer-heading')),
          fittingText:text(footer.querySelector('.redcarpert-footer-book')),
          socials:[...socials.querySelectorAll('li')].map(li=>li.querySelector('i')?.className),
          socialBox:bounds(socials),
          brandBox:bounds(brand),
          footerWhatsApp:!!footer.querySelector('.redcarpert-footer-social-whatsapp .fa-brands.fa-whatsapp'),
          floatHidden:getComputedStyle(float).display==='none',
          floatDismiss:!!float.querySelector('[data-dismiss-whatsapp] .fa-solid.fa-xmark'),
          faFamily:sample?getComputedStyle(sample).fontFamily:'',
          faGlyph:sample?getComputedStyle(sample,'::before').content:'',
          iconCount:document.querySelectorAll('i.fa-solid, i.fa-brands').length,
          width:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),
        };
      });
      if(width<=1000){
        assert.equal(metrics.menu.backgroundImage,'none',
          width+'px original hamburger PNG must be removed');
        assert.equal(metrics.menu.paddingLeft,0,
          width+'px reserved legacy hamburger padding must be removed');
        assert.equal(metrics.menu.icons,1,
          width+'px menu must have exactly one Font Awesome hamburger');
        assert.equal(metrics.menu.text.toLowerCase(),'menu');
        assert(metrics.menu.visible,width+'px mobile menu should be visible');
        assert(metrics.menu.iconLeft>=metrics.menu.left-1
          && metrics.menu.iconRight<=metrics.menu.right+1,
          width+'px modern hamburger must fit within Menu control');
        assert(!['none','normal','""'].includes(metrics.menu.iconGlyph),
          width+'px modern hamburger glyph missing');
      }
      assert.equal(metrics.fittingTitle,'FITTINGS');
      assert.equal(metrics.fittingText,'Book a fitting');
      assert.deepEqual(metrics.socials,[
        'fa-brands fa-instagram','fa-brands fa-youtube','fa-brands fa-x-twitter',
        'fa-brands fa-pinterest-p','fa-brands fa-tiktok','fa-brands fa-whatsapp',
      ]);
      assert(metrics.socialBox.left>=metrics.brandBox.left-1 && metrics.socialBox.right<=metrics.brandBox.right+1,
        width+'px social icons exceed branding column');
      assert(metrics.footerWhatsApp && metrics.floatDismiss);
      assert(metrics.faFamily.includes('Font Awesome'),width+'px brand icon font not loaded');
      assert(!['none','normal','""'].includes(metrics.faGlyph),width+'px Font Awesome glyph is missing: '+metrics.faGlyph);
      assert(metrics.iconCount>=10,width+'px too few modern icons');
      assert.equal(metrics.floatHidden,width<=640,width+'px floating widget visibility mismatch');
      assert(metrics.width<=width+1.5,width+'px horizontal overflow '+metrics.width);
      assert.deepEqual(errors,[],route+' JS errors at '+width+'px');
      await page.close();
      console.log('Modern icons PASS',width,route);
    }
  }
} finally {
  await browser.close();
}
