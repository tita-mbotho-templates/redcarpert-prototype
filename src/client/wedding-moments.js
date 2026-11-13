/**
 * Wedding Moments gallery: one mixed photo/film stream.
 * The first 16 cards are server-rendered. Later cards remain inert in a
 * <template> and are inserted only when someone selects Load More.
 */
export function initializeWeddingMomentsGallery() {
  const grid = document.querySelector('[data-wedding-moments-grid]');
  if (!grid) return;

  const template = document.querySelector('template[data-wedding-moments-remaining]');
  const loadMore = document.querySelector('[data-wedding-load-more]');
  const batchSize = 16;

  if (template instanceof HTMLTemplateElement && loadMore instanceof HTMLButtonElement) {
    loadMore.addEventListener('click', () => {
      const next = [...template.content.children].slice(0, batchSize);
      if (!next.length) return;
      const fragment = document.createDocumentFragment();
      fragment.append(...next);
      grid.append(fragment);
      if (!template.content.firstElementChild) {
        loadMore.closest('.redcarpert-moments-more').hidden = true;
      }
    });
  }

  const dialog = document.querySelector('#redcarpert-wedding-preview');
  if (!(dialog instanceof HTMLDialogElement)) return;
  const photo = dialog.querySelector('[data-wedding-preview-photo]');
  const video = dialog.querySelector('[data-wedding-preview-video]');
  const close = dialog.querySelector('[data-wedding-preview-close]');
  if (!(photo instanceof HTMLImageElement) || !(video instanceof HTMLVideoElement) || !close) return;

  let opener = null;
  grid.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button[data-wedding-media][data-wedding-src]');
    if (!button || !grid.contains(button)) return;
    const url = button.dataset.weddingSrc;
    const type = button.dataset.weddingMedia;
    if (!url || (type !== 'photo' && type !== 'video')) return;

    opener = button;
    photo.hidden = type !== 'photo';
    video.hidden = type !== 'video';
    if (type === 'photo') {
      photo.src = url;
      photo.alt = button.querySelector('img')?.alt ||
        button.getAttribute('aria-label') || 'Wedding photograph';
    } else {
      video.src = url;
    }
    dialog.showModal();
  });

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
