/** Client-approved Redcarpert WhatsApp number supplied on 1 November 2026.
 * South Africa: local 0680458811 -> international digits 27680458811.
 * Never insert a plus sign or leading zero in wa.me paths. */
export const WHATSAPP_DISPLAY_NUMBER = "+27 68 045 8811";
export const WHATSAPP_NUMBER = "27680458811" as const;

/** Opens WhatsApp with a prepared message; the visitor still chooses Send in WhatsApp. */
export function buildWhatsAppUrl(message: string): string {
  if (!message.trim()) throw new Error("Cannot prepare an empty WhatsApp message");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
