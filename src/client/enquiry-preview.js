/** Accessible fitting enquiry review. External WhatsApp opens only on explicit user click. */
export function initializeEnquiryPreview() {
const dialog = document.querySelector('#enquiry-preview');
if (!dialog) return;
let trigger;
function open(control) { trigger = control; dialog.querySelector('[role=status]').textContent = ''; if (!dialog.open) dialog.showModal(); }
window.addEventListener('click', event => {
  const control = event.target.closest?.('[data-whatsapp-preview]');
  if (!control) return;
  event.preventDefault(); event.stopImmediatePropagation(); open(control);
}, true);
window.addEventListener('keydown', event => {
  if (dialog.open) {
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    // The real WhatsApp handoff is an anchor; include it in the dialog tab order.
    const controls = [...dialog.querySelectorAll('a[href], button')];
    if (event.key === 'Tab' && event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
    else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    return;
  }
  const control = event.target.closest?.('[data-whatsapp-preview]');
  if (control && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) open(control); }
}, true);
for (const type of ['wheel','touchmove']) window.addEventListener(type, event => { if (dialog.open) event.stopImmediatePropagation(); }, {capture:true,passive:true});
dialog.addEventListener('close', () => trigger?.focus({preventScroll:true}));
dialog.querySelector('[data-close]').onclick = () => dialog.close();
dialog.querySelector('[data-copy]').onclick = async () => {
  const message = dialog.querySelector('.message');
  try { await navigator.clipboard.writeText(message.textContent); dialog.querySelector('[role=status]').textContent = 'Message copied.'; }
  catch { const range = document.createRange(); range.selectNodeContents(message); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); dialog.querySelector('[role=status]').textContent = 'Automatic copying is unavailable. The message is selected; use your device’s Copy command.'; }
};
}
