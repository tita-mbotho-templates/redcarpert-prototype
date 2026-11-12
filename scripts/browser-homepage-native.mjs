import { chromium } from 'playwright';
import assert from 'node:assert/strict';

/** Native homepage geometry and real user input at responsive viewports. */
const url='http://localhost:4173/redcarpert-prototype/';
const viewports=[
  {width:1440,height:900},
  {width:1024,height:768},
  {width:1000,height:800},
  {width:768,height:1024},
  {width:640,height:800},
  {width:390,height:844},
  {width:375,height:667},
  {width:320,height:568},
];
const images=[
  'home-page-1.webp',
  'home-page-2.webp',
  'home-page-3.webp',
];
const browser=await chromium.launch({args:['--no-sandbox']});
try {
  for (const {width,height} of viewports) {
    const page=await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.classList.contains('redcarpert-home-native'));
    await page.waitForTimeout(250);
    const m=await page.evaluate(()=>{
      const sections=[...document.querySelectorAll('.fullpage-wrapper > .section')];
      const box=e=>{
        const r=e.getBoundingClientRect();
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
      };
      return {
        sections:sections.map(s=>({
          box:box(s),
          bg:getComputedStyle(s).backgroundImage,
          photo:getComputedStyle(s).getPropertyValue('--redcarpert-home-photo').trim(),
          softBackground:getComputedStyle(s,'::before').backgroundImage,
          softDisplay:getComputedStyle(s,'::before').display,
          blur:getComputedStyle(s,'::before').filter,
          foreground:getComputedStyle(s,'::after').backgroundImage,
          foregroundSize:getComputedStyle(s,'::after').backgroundSize,
          sharpWidth:parseFloat(getComputedStyle(s,'::after').width),
          sharpMask:getComputedStyle(s,'::after').maskImage,
          foregroundPosition:getComputedStyle(s,'::after').backgroundPosition,
          title:s.querySelector('.section-title') ? box(s.querySelector('.section-title')) : null,
          subtitle:s.querySelector('.section-desc') ? box(s.querySelector('.section-desc')) : null,
          button:s.querySelector('.section-content > a.button') ? box(s.querySelector('.section-content > a.button')) : null,
          titleFont:s.querySelector('.section-title') ? parseFloat(getComputedStyle(s.querySelector('.section-title')).fontSize) : null,
          subtitleFont:s.querySelector('.section-desc') ? parseFloat(getComputedStyle(s.querySelector('.section-desc')).fontSize) : null,
          buttonFont:s.querySelector('.section-content > a.button') ? parseFloat(getComputedStyle(s.querySelector('.section-content > a.button')).fontSize) : null,
          buttonLabel:s.querySelector('.section-content > a.button')?.textContent.trim()??null,
        })),
        footer:box(document.querySelector('footer[data-homepage-footer]')),
        horizontalOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        scrollHeight:document.documentElement.scrollHeight,
        native:document.body.classList.contains('redcarpert-home-native'),
        fullpagePluginMounted:Boolean(document.querySelector('#superContainer')),
        loading:document.querySelector('.fullpage-wrapper')?.classList.contains('loading'),
        arrowLabel:sections[0]?.querySelector('.fullpage-scroll-arrow')?.getAttribute('aria-label'),
        header:box(document.querySelector('#header')),
      };
    });
    // The hero collection years must follow the visitor's calendar year
    // with no annual source-code edits or redeployments.
    const collection = await page.locator('.fullpage-wrapper > .section:first-child .section-title').textContent();
    const year = await page.evaluate(() => new Date().getFullYear());
    assert.equal(collection.trim(),`${year} - ${year + 1} Collectıon`,
      width+'px collection years are stale');
    assert.equal(await page.locator('[data-collection-year="start"]').count(),1);
    assert.equal(await page.locator('[data-collection-year="end"]').count(),1);
    if(width===1440) {
      // Simulate the browser crossing into the next calendar year and the user
      // returning to the existing tab, without rebuilding the site.
      await page.evaluate(() => {
        const NativeDate=window.Date;
        window.Date=class FutureDate extends NativeDate {
          getFullYear() { return super.getFullYear()+1; }
        };
        document.dispatchEvent(new Event('visibilitychange'));
        window.Date=NativeDate;
      });
      const refreshed=await page.locator('.fullpage-wrapper > .section:first-child .section-title').textContent();
      assert.equal(refreshed.trim(),`${year+1} - ${year+2} Collectıon`,
        'collection title should refresh after New Year without navigation');
    }
    assert.equal(m.native,true,'native scroll should be enabled');
    assert.equal(m.fullpagePluginMounted,false,width+'px legacy fullpage plugin must not wrap document');
    assert.equal(m.loading,false,'remove legacy loading screen');
    assert.equal(m.sections.length,3,'exactly the original three photos');
    assert(m.sections.every((section,i)=>
      section.photo.includes('ik.imagekit.io/kw8awoqvwi/red-carpet-wedding-dresses/home-page/')
      && section.photo.includes(images[i])),width+'px ImageKit photo order changed or missing');
    // Image one must occupy the entire initial viewport, hiding image two
    // until the visitor actually scrolls. Keep the later panels unchanged.
    assert(Math.abs(m.sections[0].box.y)<=2,width+'px first image must start at the viewport top');
    assert(m.sections[0].box.height>=height-1,width+'px first image must fill the visible screen');
    assert(m.sections[0].box.height<=height+3,width+'px first image should not become an oversized slide');
    assert(m.sections[1].box.y>=height-1,width+'px second image should start below the initial fold');
    const expectedTitle=width<=640
      ? Math.max(20,Math.min(25,width*.03636+8.36))
      : width<=1000 ? Math.max(26,Math.min(32,width*.0390625))
      : Math.max(32,Math.min(40,width*.028));
    const expectedSecondary=width<=640
      ? Math.max(10,Math.min(12,width*.01818+4.18))
      : width<=1000 ? Math.max(12,Math.min(13,width*.00431+8.69))
      : 14;
    for(const [i,s] of m.sections.entries()) {
      assert.equal(s.bg,'none',width+'px old direct cover background should not crop the portrait');
      if(width<=640) {
        assert.equal(s.softDisplay,'none',width+'px photo '+i+' must not render a second blurred image');
        assert.equal(s.softBackground,'none',width+'px photo '+i+' must not load a blurred background');
        assert.equal(s.blur,'none',width+'px photo '+i+' should have no blur');
        assert(!s.foreground.includes('linear-gradient('),
          width+'px phone photo '+i+' must remain the approved untinted image');
        assert.equal(s.foregroundSize,'cover',width+'px phone photo '+i+' must remain full-bleed cover');
        assert(!/(?:^|[\s,])(?:0%|top)(?:$|[\s,])/.test(s.foregroundPosition),width+'px phone photo '+i+' must keep its approved centred crop');
        assert.equal(s.sharpMask,'none',width+'px phone photo '+i+' must have no faded edges');
        assert(Math.abs(s.sharpWidth-width)<=2,width+'px phone photo '+i+' must fill the viewport width');
      } else {
        assert(s.softBackground.includes(images[i]),width+'px photo '+i+' missing blurred-side backdrop');
        assert(s.blur.includes('blur('),width+'px photo '+i+' missing blurred sides');
        assert.equal(s.sharpMask,'none',width+'px photo '+i+' must have completely sharp edges without blur bleeding');
        assert(s.blur.includes('32px'),width+'px photo '+i+' must use the approved 32px blurred background');
        assert(/(?:^|[\s,])(?:0%|top)(?:$|[\s,])/.test(s.foregroundPosition.split(',').at(-1).trim()),
          width+'px photo '+i+' must show the face via top-aligned portrait framing');
        assert(s.foregroundSize.split(',').some(part=>part.trim()==='cover'),
          width+'px photo '+i+' must cover the entire sharp central panel');
        const expectedSharpWidth=width*.60;
        assert(Math.abs(s.sharpWidth-expectedSharpWidth)<=3,
          width+'px photo '+i+' sharp-panel width must be 60%: '+s.sharpWidth);
      }
      assert(s.foreground.includes(images[i]),width+'px photo '+i+' missing sharp foreground');
      assert(s.box.width>=width-2,width+'px photo '+i+' should fill viewport width');
      assert(s.box.height>=height-2,width+'px photo '+i+' must occupy the full screen height');
      if(i>0)assert(Math.abs(s.box.y-m.sections[i-1].box.bottom)<3,
        width+'px photo '+i+' should follow previous photo without gaps or overlap');
      if(s.title) {
        assert(s.title.x>=0&&s.title.right<=width+1,width+'px title '+i+' horizontal overflow');
        assert(s.title.y>=s.box.y&&s.title.bottom<=s.box.bottom,width+'px title '+i+' must fit in photo');
        assert(Math.abs(s.titleFont-expectedTitle)<=.11,
          width+'px title '+i+' must scale responsively: '+s.titleFont+' != '+expectedTitle);
      }
      if(s.button) {
        assert(s.button.x>=0&&s.button.right<=width+1,width+'px button '+i+' clips');
        assert(s.button.height>=43,width+'px button '+i+' lacks touch target');
        assert(s.button.y>=s.box.y&&s.button.bottom<=s.box.bottom,width+'px button '+i+' not inside photo');
        assert(Math.abs(s.buttonFont-expectedSecondary)<=.11,
          width+'px button '+i+' must match responsive font size: '+s.buttonFont+' != '+expectedSecondary);
      }
      if(s.subtitle&&s.title){
        assert(s.subtitle.y>=s.title.bottom-1,width+'px subtitle should follow title');
        assert(s.subtitle.x>=0&&s.subtitle.right<=width+1,width+'px subtitle overflow');
        assert(Math.abs(s.subtitleFont-expectedSecondary)<=.11,
          width+'px subtitle '+i+' must scale responsively: '+s.subtitleFont+' != '+expectedSecondary);
      }
    }
    assert.equal(m.sections[1].title,null,'middle photograph must remain text-free');
    assert(m.sections[0].buttonLabel?.length>0&&m.sections[2].buttonLabel?.length>0,'preserve CTAs');
    assert(Math.abs(m.footer.y-m.sections[2].box.bottom)<4,width+'px footer should follow image three naturally');
    assert(m.scrollHeight>height*2.2,width+'px homepage must scroll vertically');
    assert(m.horizontalOverflow<=1.5,width+'px horizontal overflow: '+m.horizontalOverflow);
    assert.equal(m.arrowLabel,'Scroll to the next bridal photograph');

    await page.mouse.wheel(0,400);
    await page.waitForTimeout(600);
    let scroll=await page.evaluate(()=>scrollY);
    assert(scroll>20,width+'px wheel must scroll continuously rather than snap/lock');
    assert(scroll<650,width+'px wheel should not jump a full slide on one tick: '+scroll);
    await page.evaluate(()=>window.scrollTo({top: document.documentElement.scrollHeight,behavior:'instant'}));
    await page.waitForTimeout(130);
    const before=await page.evaluate(()=>scrollY);
    await page.mouse.wheel(0,-320);
    await page.waitForTimeout(700);
    const after=await page.evaluate(()=>scrollY);
    assert(after<before-15,width+'px should reverse smoothly from footer');
    assert(before-after<650,width+'px reverse wheel should not skip photo three');

    await page.locator('#header #logo-container > a').click();
    await page.waitForFunction(()=>scrollY<5,{},{timeout:5000});
    await page.locator('.fullpage-scroll-arrow').click();
    await page.waitForFunction(()=>scrollY>window.innerHeight*.5,{},{timeout:5000});
    const link=page.locator('.fullpage-wrapper > .section').first().locator('a.button');
    assert((await link.getAttribute('href')).includes('/product/'));
    assert.deepEqual(errors,[],width+'px browser errors');
    console.log('Native homepage PASS',width,height,m.sections.map(s=>Math.round(s.box.height)),
      'fonts',m.sections.filter(s=>s.title).map(s=>[s.titleFont,s.subtitleFont,s.buttonFont]),
      'photo sizing',m.sections.map(s=>s.foregroundSize));
    await page.close();
  }
} finally { await browser.close(); }
