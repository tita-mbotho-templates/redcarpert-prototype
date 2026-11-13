/**
 * Progressive enhancement for client-approved wedding photos and films.
 * Images remain visible without JavaScript; videos request data only after
 * someone explicitly opens their card.
 */
export function initializeWeddingMomentsGallery() {
  const galleries = [...document.querySelectorAll('[data-wedding-moments-grid]')];
  if (!galleries.length) return;
  const dialog = document.querySelector('#redcarpert-wedding-preview');
  if (!(dialog instanceof HTMLDialogElement)) return;
  const photo = dialog.querySelector('[data-wedding-preview-photo]');
  const video = dialog.querySelector('[data-wedding-preview-video]');
  const close = dialog.querySelector('[data-wedding-preview-close]');
  if (!(photo instanceof HTMLImageElement) || !(video instanceof HTMLVideoElement) || !close) return;

  let opener = null;
  const open = button => {
    const url = button.dataset.weddingSrc;
    const type = button.dataset.weddingMedia;
    if (!url || (type !== 'photo' && type !== 'video')) return;
    opener = button;
    photo.hidden = type !== 'photo';
    video.hidden = type !== 'video';
    if (type === 'photo') {
      photo.src = url;
      photo.alt = button.querySelector('img')?.alt || button.getAttribute('aria-label') || 'Wedding photograph';
    } else {
      video.src = url;
    }
    dialog.showModal();
  };

  for (const grid of galleries) {
    grid.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button[data-wedding-media][data-wedding-src]');
      if (button && grid.contains(button)) open(button);
    });
  }
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    photo.removeAttribute('src');
    photo.alt = '';
    photo.hidden = true;
    video.hidden = true;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
}
