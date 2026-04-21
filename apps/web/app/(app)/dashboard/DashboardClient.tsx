'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot
} from 'recharts'
import { getDateRange, formatDate, formatWeight, type DateFilter } from '@simple-wt/shared'
import DateRangePicker from '@/components/ui/DateRangePicker'

interface LogEntry {
  id: string
  weight_kg: number
  logged_at: string
}

type ChartFilter = DateFilter | 'year'

const FILTERS: { label: string; value: ChartFilter }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
  { label: 'Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DashboardClient({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<ChartFilter>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [showDots, setShowDots] = useState(false)

  const earliestYear = logs.length > 0
    ? Math.min(...logs.map(l => parseInt(l.logged_at.slice(0, 4))))
    : currentYear

  const filtered = useMemo(() => {
    if (filter === 'year') {
      return logs.filter(l => l.logged_at.startsWith(`${selectedYear}`))
    }
    if (filter === 'custom') {
      if (!customFrom || !customTo || customFrom > customTo) return []
      return logs.filter((l) => l.logged_at >= customFrom && l.logged_at <= customTo)
    }
    const range = getDateRange(filter as DateFilter)
    return logs.filter((l) => l.logged_at >= range.from && l.logged_at <= range.to)
  }, [logs, filter, customFrom, customTo, selectedYear])

  const trendData = useMemo(() => {
    if (filtered.length < 2) return null
    const diff = filtered[filtered.length - 1].weight_kg - filtered[0].weight_kg
    const pct = (diff / filtered[0].weight_kg) * 100
    return { diff, pct }
  }, [filtered])

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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#1B1D1E] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}

        {filter === 'year' && (
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              disabled={selectedYear <= earliestYear}
              className="text-2xl font-semibold text-blue-600 disabled:opacity-25 px-1 leading-none"
            >‹</button>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 w-14 text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= currentYear}
              className="text-2xl font-semibold text-blue-600 disabled:opacity-25 px-1 leading-none"
            >›</button>
          </div>
        )}

        <button
          onClick={() => setShowDots(v => !v)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            showDots
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-[#1B1D1E] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Dots
        </button>

        {filter === 'custom' && (
          <div className="mt-2 w-full sm:w-auto sm:mt-0">
            <DateRangePicker
              from={customFrom}
              to={customTo}
              max={today}
              onChange={(f, t) => { setCustomFrom(f); setCustomTo(t) }}
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const [, m, day] = d.split('-')
                  return filter === 'year' ? MONTHS[parseInt(m) - 1] : `${day}/${m}`
                }}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[Math.floor(minW - padding), Math.ceil(maxW + padding)]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
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
                    <div className="bg-white dark:bg-[#1B1D1E] border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{d.label}</p>
                      <p className="text-blue-600 font-semibold">{formatWeight(d.weight)}</p>
                    </div>
                  )
                }}
              />
              <Line
                type="linear"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={2}
                dot={showDots ? <Dot r={4} fill="#2563eb" stroke="#fff" strokeWidth={2} /> : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      {filtered.length > 0 && (
        <div className="space-y-4">
          {trendData && (() => {
            const isDown = trendData.diff < 0
            const isUp = trendData.diff > 0
            const colorClass = isDown ? 'text-green-600 dark:text-green-400' : isUp ? 'text-red-500 dark:text-red-400' : 'text-gray-500'
            const bgClass = isDown
              ? 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-800'
              : isUp
              ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-800'
              : 'bg-white dark:bg-[#1B1D1E] border-gray-100 dark:border-gray-700'
            return (
              <div className={`rounded-2xl border shadow-sm p-4 flex items-center justify-between ${bgClass}`}>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period change</p>
                  <p className={`text-2xl font-bold ${colorClass}`}>
                    {isUp ? '+' : ''}{trendData.diff.toFixed(1)} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-4xl leading-none ${colorClass}`}>{isDown ? '↓' : isUp ? '↑' : '→'}</p>
                  <p className={`text-sm font-semibold mt-1 ${colorClass}`}>{isUp ? '+' : ''}{trendData.pct.toFixed(1)}%</p>
                </div>
              </div>
            )
          })()}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Entries', value: filtered.length },
              { label: 'Min (kg)', value: Math.min(...weights).toFixed(1) },
              { label: 'Max (kg)', value: Math.max(...weights).toFixed(1) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
