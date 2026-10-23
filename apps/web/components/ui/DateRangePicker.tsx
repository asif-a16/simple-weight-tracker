'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { isISODate, getDateRangeError } from '@simple-wt/shared'

interface Props {
  from: string
  to: string
  max?: string
  onChange: (from: string, to: string) => void
}

function parse(s: string | undefined): Date | undefined {
  return s && isISODate(s) ? parseISO(s) : undefined
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-gray-400">
      <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function DateRangePicker({ from, to, max, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const error = from || to ? getDateRangeError(from, to, max) : null
  const [month, setMonth] = useState(parse(from) ?? parse(max) ?? new Date())

  const fromDate = parse(from)
  const toDate = parse(to)
  const maxDate = parse(max)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected: DateRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined

  return (
    <div ref={ref} className="relative w-full sm:w-auto" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
      <div className="flex flex-wrap gap-2">
        {(['from', 'to'] as const).map(endpoint => {
          const value = endpoint === 'from' ? from : to
          const label = endpoint === 'from' ? 'Start date' : 'End date'
          return (
            <div key={endpoint} className="flex-1 min-w-[130px] sm:flex-none">
              <label htmlFor={`${id}-${endpoint}`} className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1B1D1E] focus-within:ring-2 focus-within:ring-blue-600">
                <input
                  id={`${id}-${endpoint}`}
                  type="text"
                  value={value}
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={error ? `${id}-error` : undefined}
                  onChange={e => {
                    const next = e.target.value
                    onChange(endpoint === 'from' ? next : from, endpoint === 'to' ? next : to)
                    const date = parse(next)
                    if (date && (!maxDate || date <= maxDate)) setMonth(date)
                  }}
                  className="w-full sm:w-28 min-w-0 px-3 py-2 bg-transparent rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={`Open ${label.toLowerCase()} calendar`}
                  aria-expanded={open}
                  onClick={() => {
                    const date = parse(value) ?? fromDate
                    setMonth(date && (!maxDate || date <= maxDate) ? date : maxDate ?? new Date())
                    setOpen(o => !o)
                  }}
                  className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-blue-600"
                >
                  <CalendarIcon />
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {error && <p id={`${id}-error`} role="status" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-[#1B1D1E] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-[280px]">
          <DayPicker
            mode="range"
            selected={selected}
            toDate={maxDate}
            disabled={maxDate ? { after: maxDate } : undefined}
            month={month}
            onMonthChange={setMonth}
            onSelect={(range) => {
              const f = range?.from ? format(range.from, 'yyyy-MM-dd') : ''
              const t = range?.to ? format(range.to, 'yyyy-MM-dd') : ''
              onChange(f, t)
              if (range?.from && range?.to) setOpen(false)
            }}
            classNames={{
              months: 'flex flex-col',
              month: 'space-y-3',
              caption: 'flex justify-center relative items-center h-8',
              caption_label: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
              nav: 'flex items-center gap-1',
              nav_button:
                'absolute flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1B1D1E] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base leading-none',
              nav_button_previous: 'left-0',
              nav_button_next: 'right-0',
              table: 'w-full border-collapse',
              head_row: 'flex',
              head_cell:
                'text-gray-400 dark:text-gray-500 w-9 font-normal text-[0.75rem] text-center py-1',
              row: 'flex w-full mt-1',
              cell: 'relative p-0 text-center',
              day: 'h-9 w-9 p-0 font-normal text-sm rounded-md text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mx-auto flex items-center justify-center',
              day_selected:
                'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-600 rounded-md',
              day_range_start: 'rounded-l-md rounded-r-none bg-blue-600 text-white',
              day_range_end: 'rounded-r-md rounded-l-none bg-blue-600 text-white',
              day_range_middle:
                'rounded-none bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50',
              day_today: 'font-bold underline underline-offset-2',
              day_outside: 'opacity-30',
              day_disabled: 'opacity-25 cursor-not-allowed',
            }}
          />
        </div>
      )}
    </div>
  )
}
