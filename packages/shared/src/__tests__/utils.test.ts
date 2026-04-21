import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatWeight,
  sanitizeNotes,
  getDateRange,
  parseImportCSV,
  toCSV,
  getWeekStart,
  getWeekEnd,
  formatWeekLabel,
  groupByWeek,
  calcTrend,
} from '../utils'

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats a known date correctly', () => {
    expect(formatDate('2026-04-21')).toBe('21 Apr 2026')
  })

  it('formats January correctly', () => {
    expect(formatDate('2024-01-01')).toBe('1 Jan 2024')
  })

  it('formats December correctly', () => {
    expect(formatDate('2023-12-31')).toBe('31 Dec 2023')
  })
})

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------
describe('formatWeight', () => {
  it('formats whole number with 2 decimals', () => {
    expect(formatWeight(75)).toBe('75.00 kg')
  })

  it('formats decimal weight', () => {
    expect(formatWeight(82.5)).toBe('82.50 kg')
  })

  it('formats 2-decimal weight unchanged', () => {
    expect(formatWeight(68.75)).toBe('68.75 kg')
  })
})

// ---------------------------------------------------------------------------
// sanitizeNotes
// ---------------------------------------------------------------------------
describe('sanitizeNotes', () => {
  it('returns null for null input', () => {
    expect(sanitizeNotes(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(sanitizeNotes('')).toBeNull()
  })

  it('returns null for whitespace only', () => {
    expect(sanitizeNotes('   ')).toBeNull()
  })

  it('strips HTML tags leaving inner text', () => {
    expect(sanitizeNotes('<script>alert(1)</script>')).toBe('alert(1)')
  })

  it('strips tags and keeps text content', () => {
    expect(sanitizeNotes('hello <b>world</b>')).toBe('hello world')
  })

  it('passes plain text through', () => {
    expect(sanitizeNotes('felt great today')).toBe('felt great today')
  })
})

// ---------------------------------------------------------------------------
// getDateRange
// ---------------------------------------------------------------------------
describe('getDateRange', () => {
  const today = new Date().toISOString().slice(0, 10)

  it('7d range ends today', () => {
    const { to } = getDateRange('7d')
    expect(to).toBe(today)
  })

  it('7d range starts 7 days ago', () => {
    const { from } = getDateRange('7d')
    const expected = new Date()
    expected.setDate(expected.getDate() - 7)
    expect(from).toBe(expected.toISOString().slice(0, 10))
  })

  it('30d range starts 30 days ago', () => {
    const { from } = getDateRange('30d')
    const expected = new Date()
    expected.setDate(expected.getDate() - 30)
    expect(from).toBe(expected.toISOString().slice(0, 10))
  })

  it('1y range starts one year ago', () => {
    const { from } = getDateRange('1y')
    const expected = new Date()
    expected.setFullYear(expected.getFullYear() - 1)
    expect(from).toBe(expected.toISOString().slice(0, 10))
  })

  it('from is before or equal to to', () => {
    for (const filter of ['7d', '30d', '90d', '1y'] as const) {
      const { from, to } = getDateRange(filter)
      expect(from <= to).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// parseImportCSV
// ---------------------------------------------------------------------------
describe('parseImportCSV', () => {
  it('parses valid ISO date rows', () => {
    const csv = '2024-01-15,75.5\n2024-01-16,76.0'
    const result = parseImportCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ logged_at: '2024-01-15', weight_kg: 75.5 })
    expect(result[1]).toEqual({ logged_at: '2024-01-16', weight_kg: 76 })
  })

  it('parses MM/DD/YYYY format', () => {
    const result = parseImportCSV('01/15/2024,80')
    expect(result[0].logged_at).toBe('2024-01-15')
  })

  it('parses 2-digit year', () => {
    const result = parseImportCSV('01/15/24,80')
    expect(result[0].logged_at).toBe('2024-01-15')
  })

  it('skips rows with missing weight', () => {
    const csv = '2024-01-01,\n2024-01-02,75'
    const result = parseImportCSV(csv)
    expect(result).toHaveLength(1)
  })

  it('skips rows with invalid weight', () => {
    const csv = '2024-01-01,abc\n2024-01-02,75'
    const result = parseImportCSV(csv)
    expect(result).toHaveLength(1)
  })

  it('skips rows where weight is 0 or negative', () => {
    const csv = '2024-01-01,0\n2024-01-02,-5\n2024-01-03,70'
    const result = parseImportCSV(csv)
    expect(result).toHaveLength(1)
  })

  it('skips rows where weight is >= 1000', () => {
    const result = parseImportCSV('2024-01-01,1000')
    expect(result).toHaveLength(0)
  })

  it('skips rows with unparseable date', () => {
    const result = parseImportCSV('not-a-date,75')
    expect(result).toHaveLength(0)
  })

  it('handles tab-separated values', () => {
    const result = parseImportCSV('2024-01-15\t82.3')
    expect(result).toHaveLength(1)
    expect(result[0].weight_kg).toBe(82.3)
  })

  it('rounds weight to 2 decimal places', () => {
    const result = parseImportCSV('2024-01-01,75.555')
    expect(result[0].weight_kg).toBe(75.56)
  })

  it('returns empty array for empty input', () => {
    expect(parseImportCSV('')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// toCSV
// ---------------------------------------------------------------------------
describe('toCSV', () => {
  it('includes header row', () => {
    const csv = toCSV([])
    expect(csv.split('\n')[0]).toBe('Date,Weight (kg),Notes')
  })

  it('sorts rows by date ascending', () => {
    const logs = [
      { logged_at: '2024-01-03', weight_kg: 77, notes: null },
      { logged_at: '2024-01-01', weight_kg: 75, notes: null },
      { logged_at: '2024-01-02', weight_kg: 76, notes: null },
    ]
    const rows = toCSV(logs).split('\n').slice(1)
    expect(rows[0]).toMatch(/^2024-01-01/)
    expect(rows[1]).toMatch(/^2024-01-02/)
    expect(rows[2]).toMatch(/^2024-01-03/)
  })

  it('escapes notes with commas', () => {
    const logs = [{ logged_at: '2024-01-01', weight_kg: 75, notes: 'a,b' }]
    const csv = toCSV(logs)
    expect(csv).toContain('"a,b"')
  })

  it('escapes notes with double quotes', () => {
    const logs = [{ logged_at: '2024-01-01', weight_kg: 75, notes: 'say "hi"' }]
    const csv = toCSV(logs)
    expect(csv).toContain('"say ""hi"""')
  })

  it('leaves notes column empty when null', () => {
    const logs = [{ logged_at: '2024-01-01', weight_kg: 75, notes: null }]
    const row = toCSV(logs).split('\n')[1]
    expect(row).toBe('2024-01-01,75,')
  })
})

// ---------------------------------------------------------------------------
// getWeekStart / getWeekEnd
// ---------------------------------------------------------------------------
describe('getWeekStart', () => {
  it('Monday stays on Monday', () => {
    expect(getWeekStart('2026-04-20')).toBe('2026-04-20') // Monday
  })

  it('Wednesday goes back to Monday', () => {
    expect(getWeekStart('2026-04-22')).toBe('2026-04-20')
  })

  it('Sunday goes back to previous Monday', () => {
    expect(getWeekStart('2026-04-19')).toBe('2026-04-13')
  })

  it('Friday goes back to Monday', () => {
    expect(getWeekStart('2026-04-24')).toBe('2026-04-20')
  })
})

describe('getWeekEnd', () => {
  it('week end is 6 days after week start', () => {
    expect(getWeekEnd('2026-04-20')).toBe('2026-04-26')
  })

  it('handles month boundary', () => {
    expect(getWeekEnd('2026-04-27')).toBe('2026-05-03')
  })

  it('handles year boundary', () => {
    expect(getWeekEnd('2025-12-29')).toBe('2026-01-04')
  })
})

// ---------------------------------------------------------------------------
// formatWeekLabel
// ---------------------------------------------------------------------------
describe('formatWeekLabel', () => {
  it('formats week label correctly', () => {
    expect(formatWeekLabel('2026-04-20')).toBe('20 Apr – 26 Apr')
  })

  it('handles cross-month week', () => {
    expect(formatWeekLabel('2026-04-27')).toBe('27 Apr – 3 May')
  })
})

// ---------------------------------------------------------------------------
// groupByWeek
// ---------------------------------------------------------------------------
describe('groupByWeek', () => {
  const logs = [
    { logged_at: '2026-04-21', weight_kg: 75 },
    { logged_at: '2026-04-22', weight_kg: 75.5 },
    { logged_at: '2026-04-14', weight_kg: 74 },
  ]

  it('groups entries into correct weeks', () => {
    const groups = groupByWeek(logs)
    expect(groups).toHaveLength(2)
  })

  it('sorts newest week first', () => {
    const groups = groupByWeek(logs)
    expect(groups[0].weekStart > groups[1].weekStart).toBe(true)
  })

  it('puts Apr 21 and Apr 22 in same week', () => {
    const groups = groupByWeek(logs)
    const newestWeek = groups[0]
    expect(newestWeek.entries).toHaveLength(2)
  })

  it('puts Apr 14 in its own week', () => {
    const groups = groupByWeek(logs)
    const olderWeek = groups[1]
    expect(olderWeek.entries).toHaveLength(1)
    expect(olderWeek.entries[0].logged_at).toBe('2026-04-14')
  })

  it('returns empty array for empty input', () => {
    expect(groupByWeek([])).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// calcTrend
// ---------------------------------------------------------------------------
describe('calcTrend', () => {
  it('returns null for empty array', () => {
    expect(calcTrend([])).toBeNull()
  })

  it('returns null for single entry', () => {
    expect(calcTrend([{ weight_kg: 80 }])).toBeNull()
  })

  it('calculates weight loss correctly', () => {
    const result = calcTrend([{ weight_kg: 80 }, { weight_kg: 75 }])
    expect(result?.diff).toBeCloseTo(-5)
    expect(result?.pct).toBeCloseTo(-6.25)
  })

  it('calculates weight gain correctly', () => {
    const result = calcTrend([{ weight_kg: 70 }, { weight_kg: 77 }])
    expect(result?.diff).toBeCloseTo(7)
    expect(result?.pct).toBeCloseTo(10)
  })

  it('uses first and last entry only (not min/max)', () => {
    const result = calcTrend([
      { weight_kg: 80 },
      { weight_kg: 60 },
      { weight_kg: 78 },
    ])
    expect(result?.diff).toBeCloseTo(-2)
  })

  it('returns zero diff when weight unchanged', () => {
    const result = calcTrend([{ weight_kg: 75 }, { weight_kg: 75 }])
    expect(result?.diff).toBe(0)
    expect(result?.pct).toBe(0)
  })
})
