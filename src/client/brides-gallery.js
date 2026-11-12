/** Five intentional six-row / four-column compositions, with six ivory shade tiles. */
export const BRIDES_PATTERNS = Object.freeze([
  [3, 6, 9, 14, 17, 22],
  [1, 7, 10, 12, 18, 21],
  [0, 5, 11, 13, 16, 23],
  [2, 4, 8, 15, 19, 20],
  [1, 6, 11, 12, 18, 22],
].map(slots=>Object.freeze(slots)));

function randomIndex(max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array=new Uint32Array(1); crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random()*max);
}
/** Progressive enhancement: static images work even if this module cannot run. */
export function initializeBridesGallery() {
  const grid=document.querySelector('[data-brides-gallery]');
  if (!grid) return;
  const photos=[...grid.querySelectorAll('[data-bride-card]')];
  if(photos.length<16) throw new Error('Expected at least 16 bridal inspiration photos');
  let previous=-1;
  try {
    const stored=sessionStorage.getItem('redcarpert-last-gallery-pattern');
    if(stored!==null && /^[0-4]$/.test(stored)) previous=Number(stored);
  } catch {}
  const chosen=previous<0?randomIndex(BRIDES_PATTERNS.length)
    :(previous+1+randomIndex(BRIDES_PATTERNS.length-1))%BRIDES_PATTERNS.length;
  try {sessionStorage.setItem('redcarpert-last-gallery-pattern',String(chosen));}catch{}
  const accents=[
    ['THE BRIDAL EDIT','Moments in ivory'],
    ['REDCARPERT','A little romance'],
    ['YOUR MOMENT','A beautiful beginning'],
    ['BRIDAL STORIES','Made for memories'],
    ['THE BRIDAL EDIT','A timeless feeling'],
    ['REDCARPERT','Love in every detail'],
  ];
  const shadeSlots=new Set(BRIDES_PATTERNS[chosen]);
  // Preserve the supplied gallery order on every visit. Only the six shade
  // positions vary between the five curated arrangements.
  const images=photos;
  const arranged=[];
  let pi=0,si=0;
  for(let i=0;i<images.length+shadeSlots.size;i++){
    if(shadeSlots.has(i)){
      const shade=document.createElement('div');
      shade.className='redcarpert-bride-accent accent-'+(si%3+1);
      shade.setAttribute('aria-hidden','true');
      const picture=document.createElement('div');
      picture.className='redcarpert-bride-accent-art';
      const star=document.createElement('span');
      star.className='redcarpert-bride-accent-mark fa-solid fa-star';star.setAttribute('aria-hidden','true');
      const eyebrow=document.createElement('span');
      eyebrow.className='redcarpert-bride-accent-eyebrow';eyebrow.textContent=accents[si][0];
      const title=document.createElement('span');
      title.className='redcarpert-bride-accent-title';title.textContent=accents[si][1];
      const line=document.createElement('span');
      line.className='redcarpert-bride-accent-rule';
      picture.append(star,eyebrow,title,line);
      const foot=document.createElement('div');
      foot.className='redcarpert-bride-accent-caption';foot.textContent='\u00a0';
      shade.append(picture,foot);
      arranged.push(shade);si++;
    } else arranged.push(images[pi++]);
  }
  grid.replaceChildren(...arranged);
  grid.dataset.galleryPattern=String(chosen+1);

  const dialog=document.querySelector('#redcarpert-bride-preview');
  if(!(dialog instanceof HTMLDialogElement))return;
  const preview=dialog.querySelector('[data-bride-preview-image]');

  let opener=null;
  grid.addEventListener('click',event=>{
    const button=event.target.closest('button[data-bride-preview]');
    if(!button || !grid.contains(button))return;
    const img=button.querySelector('img');if(!img)return;
    opener=button;
    // Use the original remote image, not a cropped canvas or thumbnail.
    // The dialog preserves its natural aspect ratio with object-fit: contain.
    preview.src=img.currentSrc||img.src;
    preview.alt=img.alt;
    dialog.showModal();
  });
  dialog.querySelector('[data-bride-preview-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{
    preview.removeAttribute('src');
    if(opener?.isConnected)opener.focus({preventScroll:true});
    opener=null;
  });
}
