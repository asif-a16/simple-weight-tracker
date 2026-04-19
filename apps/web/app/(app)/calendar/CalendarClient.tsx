'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type WeightLog } from '@simple-wt/shared'
import LogWeightForm from '@/components/weight/LogWeightForm'

interface Props {
  logs: Pick<WeightLog, 'id' | 'weight_kg' | 'logged_at' | 'notes'>[]
  accountCreatedAt: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarClient({ logs, accountCreatedAt }: Props) {
  const router = useRouter()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modalDate, setModalDate] = useState<string | null>(null)

  const logMap = new Map(logs.map((l) => [l.logged_at, l]))
  const today = now.toISOString().slice(0, 10)
  const minDate = accountCreatedAt.slice(0, 7) // YYYY-MM

  const currentMonth = `${year}-${String(month + 1).padStart(2, '0')}`

  function prevMonth() {
    if (currentMonth <= minDate) return
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) return
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const modalEntry = modalDate ? logMap.get(modalDate) : undefined

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            onClick={prevMonth}
            disabled={currentMonth <= minDate}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          <button
            onClick={nextMonth}
            disabled={year === now.getFullYear() && month >= now.getMonth()}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square" />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isFuture = dateStr > today
            const isToday = dateStr === today
            const entry = logMap.get(dateStr)

            return (
              <button
                key={dateStr}
                onClick={() => !isFuture && setModalDate(dateStr)}
                disabled={isFuture}
                aria-label={`${dateStr}${entry ? `: ${entry.weight_kg} kg` : ''}`}
                className={`aspect-square flex flex-col items-center justify-center text-sm transition-colors ${
                  isFuture ? 'text-gray-200 cursor-default' :
                  entry ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' :
                  'hover:bg-gray-50 text-gray-700'
                } ${isToday ? 'ring-2 ring-inset ring-blue-400' : ''}`}
              >
                <span className="font-medium">{day}</span>
                {entry && (
                  <span className="text-xs text-blue-500 leading-tight">{entry.weight_kg}kg</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal: log or edit */}
      {modalDate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modalEntry ? `Edit — ${modalDate}` : `Log weight — ${modalDate}`}
              </h2>
              <button onClick={() => setModalDate(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6">
              <LogWeightForm
                entryId={modalEntry?.id}
                initialDate={modalDate}
                initialWeight={modalEntry?.weight_kg}
                initialNotes={modalEntry?.notes}
                onSuccess={() => {
                  setModalDate(null)
                  router.refresh()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
