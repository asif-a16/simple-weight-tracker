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

export function parseImportCSV(text: string): { logged_at: string; weight_kg: number }[] {
  const results: { logged_at: string; weight_kg: number }[] = []
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(/[\t,]/)
    if (parts.length < 2) continue
    const dateStr = parts[0].trim()
    const weightStr = parts[1].trim()
    if (!weightStr) continue
    const weight = parseFloat(weightStr)
    if (isNaN(weight) || weight <= 0 || weight >= 1000) continue
    const date = parseImportDate(dateStr)
    if (!date) continue
    results.push({ logged_at: date, weight_kg: Math.round(weight * 100) / 100 })
  }
  return results
}

function parseImportDate(s: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    let year = parseInt(m[3])
    if (year < 100) year += 2000
    const month = parseInt(m[1])
    const day = parseInt(m[2])
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return null
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
