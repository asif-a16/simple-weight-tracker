'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot
} from 'recharts'
import { getDateRange, formatDate, type DateFilter } from '@simple-wt/shared'

interface LogEntry {
  id: string
  weight_kg: number
  logged_at: string
  notes: string | null
}

const FILTERS: { label: string; value: DateFilter }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
  { label: 'Custom', value: 'custom' },
]

export default function DashboardClient({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<DateFilter>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    let from: string, to: string
    if (filter === 'custom') {
      if (!customFrom || !customTo || customFrom > customTo) return []
      from = customFrom
      to = customTo
    } else {
      const range = getDateRange(filter)
      from = range.from
      to = range.to
    }
    return logs.filter((l) => l.logged_at >= from && l.logged_at <= to)
  }, [logs, filter, customFrom, customTo])

  const chartData = filtered.map((l) => ({
    date: l.logged_at,
    weight: l.weight_kg,
    label: formatDate(l.logged_at),
  }))

  const weights = filtered.map((l) => l.weight_kg)
  const minW = weights.length ? Math.min(...weights) : 0
  const maxW = weights.length ? Math.max(...weights) : 100
  const padding = (maxW - minW) * 0.1 || 5

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}

        {filter === 'custom' && (
          <div className="flex items-center gap-2 mt-2 w-full sm:w-auto sm:mt-0">
            <input
              type="date"
              value={customFrom}
              max={customTo || today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const [, m, day] = d.split('-')
                  return `${day}/${m}`
                }}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[Math.floor(minW - padding), Math.ceil(maxW + padding)]}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}`}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium text-gray-900">{d.label}</p>
                      <p className="text-blue-600 font-semibold">{d.weight} kg</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={2}
                dot={<Dot r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} />}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Entries', value: filtered.length },
            { label: 'Min', value: `${Math.min(...weights).toFixed(1)} kg` },
            { label: 'Max', value: `${Math.max(...weights).toFixed(1)} kg` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
