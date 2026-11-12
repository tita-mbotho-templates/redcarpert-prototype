const STORAGE_KEY = 'redcarpert-floating-whatsapp-dismissed';

/**
 * Dismiss only the floating CTA; the fitting links in the footer, details and
 * editorial pages remain available. sessionStorage persists in this browser tab
 * across page navigation but not in a new tab/session.
 */
export function initializeFloatingWhatsApp() {
  const widget = document.querySelector('#redcarpert-floating-whatsapp.redcarpert-whatsapp-float');
  if (!widget) return;
  const open = widget.querySelector('[data-whatsapp-preview]');
  const dismiss = widget.querySelector('[data-dismiss-whatsapp]');
  if (!(open instanceof HTMLButtonElement) || !(dismiss instanceof HTMLButtonElement)) {
    throw new Error('Modern floating WhatsApp controls are incomplete');
  }
  let hidden = false;
  try { hidden = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch {}
  widget.hidden = hidden;
  if (!hidden) widget.dataset.ready = 'true';

  dismiss.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    widget.hidden = true;
    delete widget.dataset.ready;
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
  });
}
