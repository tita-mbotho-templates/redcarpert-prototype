import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/**
 * Footer regression: preserve header/footer logo geometry, three columns and
 * navigation type; keep both footer headings on one line at every viewport.
 * Measure painted text, not just element boxes, to prevent column collisions.
 * Includes 375 × 667 and the narrow 320px two-row layout.
 */
const viewports = [
  {width:1440,height:900},
  {width:1024,height:768},
  {width:768,height:900},
  {width:390,height:844},
  {width:375,height:667},
  {width:360,height:740},
  {width:320,height:568},
];
const browser = await chromium.launch({args:['--no-sandbox']});
try {
  for (const {width,height} of viewports) {
    for (const route of ['/product/', '/about-us/']) {
      const page = await browser.newPage({viewport:{width,height}});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://localhost:4173/redcarpert-prototype'+route,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#header #logo-container img')
        && document.querySelector('#footer[data-redcarpert-footer] .wp-image-13926')
        && document.querySelectorAll('#footer[data-redcarpert-footer] .redcarpert-footer-columns > .col').length===3);
      await page.waitForTimeout(800);
      const metrics=await page.evaluate(()=>{
        const logo=document.querySelector('#header #logo-container img');
        const footer=document.querySelector('#footer[data-redcarpert-footer]');
        const footerLogo=footer.querySelector('.wp-image-13926');
        const nav=(innerWidth<=1000?document.querySelector('#header .mob-nav-menu a'):null)
          ?? document.querySelector('#header #menu-blog-layouts > li > a');
        const columns=[...footer.querySelectorAll('.redcarpert-footer-columns > .col')];
        const typeElements=[
          ...footer.querySelectorAll('.redcarpert-footer-heading, .redcarpert-footer-items, .redcarpert-footer-tagline, .copyrights')
        ];
        const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
        const textRects=column=>[...column.querySelectorAll('.redcarpert-footer-tagline, .redcarpert-footer-heading, .redcarpert-footer-items a, .redcarpert-footer-items button, .redcarpert-footer-items span')].flatMap(el=>{
          const range=document.createRange();
          range.selectNodeContents(el);
          return [...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width}));
        });
        const copyright=footer.querySelector('.copyrights');
        const copyrightStyle=getComputedStyle(copyright);
        const copyrightRange=document.createRange();
        copyrightRange.selectNodeContents(copyright);
        const copyrightBox=box(copyright);
        const bottomBox=footer.querySelector('.footer-bottom > .section-boxed');
        return {
          headerLogo:box(logo),footerLogo:box(footerLogo),
          headerFont:parseFloat(getComputedStyle(nav).fontSize),
          fontSizes:typeElements.map(e=>({className:e.className,size:parseFloat(getComputedStyle(e).fontSize)})),
          gridColumns:columns.map(box),
          textRectsByColumn:columns.map(textRects),
          taglineWhiteSpace:getComputedStyle(footer.querySelector('.redcarpert-footer-tagline')).whiteSpace,
          copyright:{
            text:copyright.textContent.trim().replace(/\s+/g,' '),
            year:copyright.querySelector('[data-copyright-year]')?.textContent,
            box:copyrightBox,
            fontSize:parseFloat(copyrightStyle.fontSize),
            lineHeight:parseFloat(copyrightStyle.lineHeight),
            letterSpacing:parseFloat(copyrightStyle.letterSpacing),
            whiteSpace:copyrightStyle.whiteSpace,
            wordBreak:copyrightStyle.wordBreak,
            leftPadding:parseFloat(getComputedStyle(bottomBox).paddingLeft),
            rightPadding:parseFloat(getComputedStyle(bottomBox).paddingRight),
            textRects:[...copyrightRange.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width})),
          },
          gridDisplay:getComputedStyle(columns[0].parentElement).display,
          headings:[...footer.querySelectorAll('.redcarpert-footer-heading')].map(heading=>({
            text:heading.textContent.trim().toUpperCase(),
            height:heading.getBoundingClientRect().height,
            lineHeight:parseFloat(getComputedStyle(heading).lineHeight),
            clientWidth:heading.clientWidth,
            scrollWidth:heading.scrollWidth,
            overflowWrap:getComputedStyle(heading).overflowWrap,
            whiteSpace:getComputedStyle(heading).whiteSpace,
          })),
          horizontalOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
          tagline:footer.querySelector('.redcarpert-footer-tagline')?.textContent?.trim(),
        };
      });
      assert.equal(metrics.gridDisplay,'grid',route+' footer must remain a grid');
      assert.equal(metrics.gridColumns.length,3,route+' must retain exactly three footer columns');
      assert(metrics.gridColumns.every(c=>c.width>0 && c.height>0),route+' collapsed footer column '+JSON.stringify(metrics));
      if (width<=359) {
        assert(metrics.gridColumns[0].bottom+8<=metrics.gridColumns[1].y,
          width+'px '+route+' brand must sit above navigation with row spacing');
        assert(Math.abs(metrics.gridColumns[1].y-metrics.gridColumns[2].y)<=1,
          width+'px '+route+' navigation columns must share a row');
        assert(metrics.gridColumns[1].right+8<=metrics.gridColumns[2].x,
          width+'px '+route+' navigation columns require a visible gutter');
      } else {
        assert(metrics.gridColumns[0].x<metrics.gridColumns[1].x
          && metrics.gridColumns[1].x<metrics.gridColumns[2].x,
          width+'px '+route+' must keep three side-by-side columns');
        for(let i=0;i<2;i++){
          assert(metrics.gridColumns[i].right+8<=metrics.gridColumns[i+1].x,
            width+'px '+route+' adjacent footer columns need >=8px gutter: '+JSON.stringify(metrics.gridColumns));
        }
      }
      for(const key of ['width','height']){
        assert(Math.abs(metrics.headerLogo[key]-metrics.footerLogo[key])<=1.5,
          width+'px '+route+' '+key+' must exactly track the header: '+JSON.stringify(metrics));
      }
      for(const type of metrics.fontSizes){
        if (String(type.className).includes('copyrights')) continue;
        assert(Math.abs(type.size-metrics.headerFont)<=0.1,
          width+'px '+route+' footer '+type.className+' must retain header font-size: '+JSON.stringify(metrics));
      }
      // Copyright shares the footer links' typography at every screen size.
      // Title case and normal spacing replace oversized all-capital tracking.
      const copyright=metrics.copyright;
      const linksFont=metrics.fontSizes.find(t=>t.className.includes('redcarpert-footer-items'))?.size;
      assert(Math.abs(copyright.fontSize-linksFont)<=0.1,
        width+'px '+route+' copyright must match footer links: '+JSON.stringify(copyright));
      assert.equal(copyright.year,String(new Date().getFullYear()),
        width+'px '+route+' runtime copyright year must be current');
      assert.equal(copyright.text,'© '+copyright.year+' Redcarpert Wedding Dresses',
        width+'px '+route+' copyright wording was unexpectedly changed');
      assert.equal(copyright.whiteSpace,'nowrap',
        width+'px '+route+' copyright should stay on one desktop-style line');
      assert.equal(copyright.wordBreak,'normal',
        width+'px '+route+' copyright must not split words');
      assert(Math.abs(copyright.leftPadding-copyright.rightPadding)<=0.1,
        width+'px '+route+' copyright parent has asymmetric padding');
      assert(copyright.textRects.length>0,
        width+'px '+route+' copyright text did not render');
      for (const rect of copyright.textRects) {
        assert(rect.x>=copyright.box.x-1 && rect.right<=copyright.box.right+1,
          width+'px '+route+' copyright extends outside its content area: '+JSON.stringify({copyright,rect}));
      }
      const top=Math.min(...copyright.textRects.map(r=>r.y));
      const bottom=Math.max(...copyright.textRects.map(r=>r.bottom));
      assert(bottom-top<=copyright.lineHeight+2,
        width+'px '+route+' copyright must remain one line');
      const left=Math.min(...copyright.textRects.map(r=>r.x));
      const right=Math.max(...copyright.textRects.map(r=>r.right));
      assert(Math.abs((left+right)/2-(copyright.box.x+copyright.box.right)/2)<=2,
        width+'px '+route+' copyright line must be centred in the footer');
      assert(metrics.horizontalOverflow<=1.5,width+'px '+route+' horizontal overflow: '+metrics.horizontalOverflow);
      assert.equal(metrics.tagline,'Elegant bridal collections');
      assert.equal(metrics.taglineWhiteSpace,'normal',
        width+'px '+route+' logo tagline must wrap inside its own column');
      // Element bounding boxes can look valid while no-wrap text paints outside them.
      // Use Range rectangles to catch overlap between the tagline and Ball Gown.
      for (const [index,rects] of metrics.textRectsByColumn.entries()) {
        const column=metrics.gridColumns[index];
        assert(rects.length>0,width+'px '+route+' empty footer text block '+index);
        for (const r of rects) {
          assert(r.x>=column.x-1 && r.right<=column.right+1,
            width+'px '+route+' painted footer text escapes column '+index+': '+JSON.stringify({column,r}));
        }
      }
      const headings=['COLLECTIONS','FITTINGS'];
      for (const label of headings) {
        const heading=metrics.headings.find(h=>h.text===label);
        assert(heading,width+'px '+route+' is missing '+label);
        assert.equal(heading.whiteSpace,'nowrap',width+'px '+route+' '+label+' should not wrap');
        assert(heading.height<=heading.lineHeight+1,
          width+'px '+route+' '+label+' must be one line: '+JSON.stringify(heading));
        assert(heading.scrollWidth<=heading.clientWidth+1,
          width+'px '+route+' '+label+' must fit within its column: '+JSON.stringify(heading));
        assert.equal(heading.overflowWrap,'normal',width+'px '+route+' '+label+' should not split mid-word');
      }
      if (width>359) {
        const totalWidth=metrics.gridColumns.reduce((sum,c)=>sum+c.width,0);
        const expectedFirst=width<=640?0.36:0.45;
        assert(Math.abs(metrics.gridColumns[0].width/totalWidth-expectedFirst)<0.01,
          width+'px '+route+' unexpected logo column ratio: '+JSON.stringify(metrics.gridColumns));
      } else {
        assert(metrics.gridColumns[0].width>metrics.gridColumns[1].width,
          width+'px '+route+' branding must span both lower navigation columns');
      }
      assert.deepEqual(errors,[],width+'px '+route+' page errors');
      console.log('Footer/header responsive parity PASS',width,route,
        'logo',Math.round(metrics.headerLogo.width)+'x'+Math.round(metrics.headerLogo.height),
        'font',metrics.headerFont+'px','columns',metrics.gridColumns.map(c=>Math.round(c.width)).join('/'),
        'tagline-lines',metrics.textRectsByColumn[0].length);
      await page.close();
    }
  }
  // Confirm year updates on the client without rebuilding or redeploying
  // the static page, even when the year changes after its HTML was generated.
  const future=await browser.newPage({viewport:{width:375,height:667}});
  try {
    await future.clock.setFixedTime(new Date('2035-02-01T12:00:00Z'));
    await future.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});
    await future.waitForFunction(()=>document.querySelector('[data-copyright-year]')?.textContent==='2035');
    assert.equal(await future.locator('#footer[data-redcarpert-footer] .copyrights').innerText(),
      '© 2035 Redcarpert Wedding Dresses');
  } finally {
    await future.close();
  }
} finally {
  await browser.close();
}
