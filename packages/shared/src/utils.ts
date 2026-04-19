import type { DateFilter, DateRange } from './types'

export function getDateRange(filter: DateFilter): DateRange {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)

  const from = new Date(today)
  if (filter === '7d') from.setDate(today.getDate() - 7)
  else if (filter === '30d') from.setDate(today.getDate() - 30)
  else if (filter === '90d') from.setDate(today.getDate() - 90)
  else if (filter === '1y') from.setFullYear(today.getFullYear() - 1)

  return { from: from.toISOString().slice(0, 10), to }
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} kg`
}

export function sanitizeNotes(notes: string | null | undefined): string | null {
  if (!notes) return null
  // Strip any HTML tags to prevent XSS in contexts that render raw HTML
  return notes.replace(/<[^>]*>/g, '').trim() || null
}

export function toCSV(logs: { logged_at: string; weight_kg: number; notes: string | null }[]): string {
  const header = 'Date,Weight (kg),Notes'
  const rows = [...logs]
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    .map((l) => {
      const notes = l.notes ? `"${l.notes.replace(/"/g, '""')}"` : ''
      return `${l.logged_at},${l.weight_kg},${notes}`
    })
  return [header, ...rows].join('\n')
}
