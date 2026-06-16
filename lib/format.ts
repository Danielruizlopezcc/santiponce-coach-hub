export function formatEuro(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatSpanishDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatSpanishDateTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function maskDocument(value: string) {
  if (value.length <= 4) return value
  return `${value.slice(0, 2)}****${value.slice(-2)}`
}

export function formatSpanishPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  const withoutPrefix =
    digits.length === 11 && digits.startsWith('34') ? digits.slice(2) : digits

  if (withoutPrefix.length !== 9) return value
  return `${withoutPrefix.slice(0, 3)} ${withoutPrefix.slice(3, 5)} ${withoutPrefix.slice(5, 7)} ${withoutPrefix.slice(7)}`
}
