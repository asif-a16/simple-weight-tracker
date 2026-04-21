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

export interface TrendResult {
  diff: number
  pct: number
}

export function calcTrend(logs: { weight_kg: number }[]): TrendResult | null {
  if (logs.length < 2) return null
  const first = logs[0].weight_kg
  const last = logs[logs.length - 1].weight_kg
  const diff = last - first
  const pct = (diff / first) * 100
  return { diff, pct }
}

export function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dow = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (dow === 0 ? -6 : 1 - dow))
  return date.toISOString().slice(0, 10)
}

export function getWeekEnd(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 6)
  return date.toISOString().slice(0, 10)
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatWeekLabel(weekStart: string): string {
  const weekEnd = getWeekEnd(weekStart)
  const fmt = (s: string) => {
    const [, m, d] = s.split('-').map(Number)
    return `${d} ${SHORT_MONTHS[m - 1]}`
  }
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`
}

export function groupByWeek<T extends { logged_at: string }>(
  logs: T[]
): { label: string; weekStart: string; entries: T[] }[] {
  const map = new Map<string, T[]>()
  for (const log of logs) {
    const ws = getWeekStart(log.logged_at)
    if (!map.has(ws)) map.set(ws, [])
    map.get(ws)!.push(log)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([ws, entries]) => ({ weekStart: ws, label: formatWeekLabel(ws), entries }))
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
