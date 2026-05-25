export function getLocale(lang) {
  return lang === 'en' ? 'en-US' : 'fr-FR';
}

export function fmtTime(ts, lang) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString(getLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function fmtDate(ts, lang) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(getLocale(lang), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
