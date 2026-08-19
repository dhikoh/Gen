/**
 * Utility for formatting WhatsApp links and handling CS contact formatting safely.
 */

export function formatWaLink(
  phone: string | null | undefined,
  message?: string
): string | null {
  if (!phone || typeof phone !== 'string') return null

  // Clean raw input: remove whitespace, dashes, parens
  let cleanNumber = phone.replace(/[^0-9+]/g, '')

  // Convert leading 0 to 62 (Indonesian standard)
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1)
  } else if (cleanNumber.startsWith('+')) {
    cleanNumber = cleanNumber.slice(1)
  }

  if (cleanNumber.length < 7) {
    return null
  }

  let url = `https://wa.me/${cleanNumber}`
  if (message && message.trim().length > 0) {
    url += `?text=${encodeURIComponent(message.trim())}`
  }

  return url
}
