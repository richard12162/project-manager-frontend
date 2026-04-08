export function formatDateTime(value?: string) {
  if (!value) {
    return 'Unbekannt'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unbekannt'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
