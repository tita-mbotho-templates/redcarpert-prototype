import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--no-sandbox']});
try{
  for(const width of [1440,768,390]){
    const page=await browser.newPage({viewport:{width,height:900}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    // Deterministic remote-image stand-ins let us verify *actual* image
    // containment for both portrait and landscape aspect ratios without
    // depending on third-party CDN connectivity in CI.
    await page.route('https://images.pexels.com/**',route=>{
      const landscape=route.request().url().includes('/39980506/');
      const w=landscape?900:600;
      const h=landscape?600:900;
      return route.fulfill({
        status:200,contentType:'image/svg+xml',
        body:'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+
          '" viewBox="0 0 '+w+' '+h+'"><rect width="100%" height="100%" fill="#e7dcd0"/></svg>',
      });
    });
    await page.goto('http://localhost:4173/redcarpert-prototype/product/',{waitUntil:'domcontentloaded'});
    const controls=page.locator('[data-catalogue-filter]');
    const samples=page.locator('[data-catalogue-id]');
    const visible=page.locator('[data-catalogue-id]:visible');
    await controls.waitFor();
    assert.equal(await samples.count(),8);assert.equal(await visible.count(),8);
    const getRect=async locator=>locator.first().evaluate(element=>{
      const rect=element.getBoundingClientRect();
      return {width:rect.width,height:rect.height};
    });
    const expectSquare=(rect,context)=>assert(Math.abs(rect.width-rect.height)<2,
      context+' must render a true square at '+width+'px: '+JSON.stringify(rect));
    const productRect=await getRect(page.locator('[data-catalogue-id] img'));
    expectSquare(productRect,'Wedding Dresses photograph');
    const productImageWidth=productRect.width;
    const productGridWidth=await page.locator('ul.products[data-catalogue-preview]').evaluate(
      element=>element.getBoundingClientRect().width);
    const buttons=controls.locator('button[data-filter-category]');
    assert.equal(await buttons.count(),3);
    await buttons.nth(1).click();
    assert.equal(await visible.count(),4);
    assert.equal(await page.locator('[data-catalogue-category="mermaid"]:visible').count(),4);
    assert.equal(await controls.getAttribute('data-active-category'),'mermaid');
    assert.equal(new URL(page.url()).searchParams.get('category'),'mermaid');
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await visible.count(),4,'filter reload preserved');
    await page.locator('button[data-filter-category="ball_gown"]').click();
    assert.equal(await visible.count(),4);
    assert.equal(await page.locator('[data-catalogue-category="ball_gown"]:visible').count(),4);
    await page.locator('button[data-filter-category="all"]').click();
    assert.equal(await visible.count(),8);
    assert.equal(new URL(page.url()).searchParams.has('category'),false);

    for(const category of ['mermaid','ball_gown']){
      await page.goto('http://localhost:4173/redcarpert-prototype/product-category/'+category+'/',{waitUntil:'domcontentloaded'});
      const categoryPhotos=page.locator('ul.products[data-catalogue-preview] [data-catalogue-id] img');
      assert.equal(await categoryPhotos.count(),4,category+' has four sample photos');
      for(const rectangle of await categoryPhotos.evaluateAll(nodes=>nodes.map(el=>{
        const r=el.getBoundingClientRect();return {width:r.width,height:r.height};
      })))expectSquare(rectangle,category+' category photograph');
    }

    await page.goto('http://localhost:4173/redcarpert-prototype/our-brides/',{waitUntil:'domcontentloaded'});
    const gallery=page.locator('[data-brides-gallery]');
    await gallery.waitFor();
    const cards=gallery.locator('[data-bride-card]');
    assert.equal(await cards.count(),18);
    assert.equal(await gallery.locator('.redcarpert-bride-accent').count(),6);
    for(const rect of await gallery.locator('.redcarpert-bride-accent-art').evaluateAll(nodes=>nodes.map(el=>{
      const r=el.getBoundingClientRect();return {width:r.width,height:r.height};
    }))){
      expectSquare(rect,'complementary shade tile');
    }
    assert.equal(await gallery.locator(':scope > *').count(),24);
    const id=Number(await gallery.getAttribute('data-gallery-pattern'));
    assert(id>=1&&id<=5,'selected one of five layouts');
    const geometry=await page.evaluate(()=>{
      const images=[...document.querySelectorAll('[data-brides-gallery] [data-bride-card] img')];
      const img=images[0].getBoundingClientRect();
      const container=document.querySelector('[data-brides-gallery]');
      return {ratio:img.width/img.height,columns:getComputedStyle(container).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert(Math.abs(geometry.ratio-1)<0.015,'Our Brides photographs must be square');
    assert.equal(geometry.columns,width===1440?4:2,'responsive column count');
    assert.equal(geometry.overflow,false,'gallery horizontal overflow');
    const align=await page.evaluate(()=>{
      const intro=document.querySelector('.redcarpert-brides-intro');
      const footer=document.querySelector('.redcarpert-brides-disclosure');
      const title=intro?.querySelector('h2');
      const para=intro?.querySelector('p');
      return {intro:getComputedStyle(intro).textAlign,
        title:getComputedStyle(title).textAlign,
        paragraph:getComputedStyle(para).textAlign,
        closing:getComputedStyle(footer).textAlign};
    });
    assert.deepEqual(align,{intro:'center',title:'center',paragraph:'center',closing:'center'},
      'intro, heading and closing disclaimer are centered');
    const brideRect=await getRect(page.locator('[data-bride-card] img'));
    const brideButtonRect=await getRect(page.locator('[data-bride-card] button[data-bride-preview]'));
    expectSquare(brideRect,'Our Brides photograph');
    expectSquare(brideButtonRect,'Our Brides complete clickable photo frame');
    assert(Math.abs(brideRect.width-brideButtonRect.width)<1,'image fills the square photo frame');
    assert.equal(await page.locator('[data-bride-card] button[data-bride-preview]').first().evaluate(
      element=>getComputedStyle(element).borderRadius),'0px','frame has catalogue-style square corners');
    const measured=brideRect.width;
    const galleryContainerWidth=await gallery.evaluate(element=>element.getBoundingClientRect().width);
    console.log('Gallery/catalogue dimensions',width,
      JSON.stringify({productImageWidth,measured,productGridWidth,galleryContainerWidth}));
    assert(Math.abs(productGridWidth-galleryContainerWidth)<=3,
      'gallery must use same full-width content container as Wedding Dresses');
    assert(Math.abs(productImageWidth-measured)<=3,
      'gallery image width must closely match Wedding Dresses card image width');
    assert(Math.abs(productRect.height-brideRect.height)<=3,
      'square gallery image height must match Wedding Dresses card image height');

    // Photographs must retain their authored order as shade tiles vary by pattern.
    const galleryOrder=await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.brideCard));
    assert.deepEqual(galleryOrder,Array.from({length:18},(_,i)=>'inspiration-'+String(i+1).padStart(2,'0')));
    const first=cards.first().locator('button[data-bride-preview]');
    await first.click();
    const dialog=page.locator('#redcarpert-bride-preview');
    assert(await dialog.evaluate(e=>e.open),'image card opens');
    assert.equal(await dialog.evaluate(e=>getComputedStyle(e,'::backdrop').backdropFilter.includes('blur')),true,'blurred overlay');
    const bounds=await dialog.boundingBox();
    assert(bounds && bounds.width<width && bounds.height<=900,'preview stays inside viewport');
    assert.equal(await dialog.locator('figcaption,.redcarpert-bride-preview-details').count(),0,
      'preview is image-only, without a copy panel');
    const preview=dialog.locator('img[data-bride-preview-image]');
    const ensureFullPreview=async (expected,format)=>{
      await page.waitForFunction(()=>{
        const image=document.querySelector('#redcarpert-bride-preview img[data-bride-preview-image]');
        return image?.complete && image.naturalWidth>0 && image.naturalHeight>0;
      });
      const details=await preview.evaluate(image=>{
        const rect=image.getBoundingClientRect();
        const card=image.closest('.redcarpert-bride-dialog-inner').getBoundingClientRect();
        const dialog=image.closest('dialog').getBoundingClientRect();
        return {naturalRatio:image.naturalWidth/image.naturalHeight,
          displayedRatio:rect.width/rect.height,objectFit:getComputedStyle(image).objectFit,
          width:rect.width,height:rect.height,
          cardWidth:card.width,cardHeight:card.height,
          dialogWidth:dialog.width,dialogHeight:dialog.height};
      });
      assert(Math.abs(details.naturalRatio-expected)<0.01,format+' test asset ratio');
      assert(Math.abs(details.displayedRatio-details.naturalRatio)<0.025,
        format+' uncropped image keeps its natural width-to-height ratio');
      assert.equal(details.objectFit,'contain',format+' uses object-fit contain');
      assert(details.width>0&&details.height>0&&details.cardWidth<=width&&details.dialogWidth<=width,
        format+' preview stays inside viewport width');
      assert(details.cardHeight<=900&&details.dialogHeight<=900,
        format+' preview stays inside viewport height');
    };
    await ensureFullPreview(600/900,'portrait');
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(e=>e.open),false,'Escape closes');
    await first.click();
    await page.locator('[data-bride-preview-close]').click();
    assert.equal(await dialog.evaluate(e=>e.open),false,'close button works');
    // Landscape photographs must also fit in full instead of cropping.
    await page.locator('[data-bride-card="inspiration-17"] button[data-bride-preview]').click();
    assert(await dialog.evaluate(e=>e.open),'landscape preview opens');
    await ensureFullPreview(900/600,'landscape');
    await page.locator('[data-bride-preview-close]').click();
    assert.equal(await dialog.evaluate(e=>e.open),false,'landscape close works');
    await page.reload({waitUntil:'domcontentloaded'});
    const next=Number(await gallery.getAttribute('data-gallery-pattern'));
    assert(next>=1&&next<=5&&next!==id,'refresh chooses different pattern');
    assert.equal(await cards.count(),18);
    assert.deepEqual(await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.brideCard)),galleryOrder,
      'photo order stays fixed when the shade-card arrangement changes');
    assert.deepEqual(errors,[],'no runtime JavaScript failures at '+width);
    await page.close();
    console.log('Catalogue filter and Our Brides PASS',width,'px; patterns',id,'→',next);
  }
}finally{await browser.close();}
