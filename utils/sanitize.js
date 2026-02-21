export function sanitizeTranscript(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .slice(0, 100_000);
}

export function sanitizeString(str, maxLen = 500) {
  if (str == null) return '';
  return String(str).replace(/\0/g, '').slice(0, maxLen);
}
