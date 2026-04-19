'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDate, formatWeight, toCSV, getDateRange, type WeightLog, type DateFilter } from '@simple-wt/shared'
import { createClient } from '@/lib/supabase/client'
import LogWeightForm from '@/components/weight/LogWeightForm'

type HistoryFilter = DateFilter
const FILTERS: { label: string; value: HistoryFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '1y' },
]

export default function HistoryClient({ logs }: { logs: WeightLog[] }) {
  const router = useRouter()
  const [editEntry, setEditEntry] = useState<WeightLog | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<HistoryFilter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return logs
    const { from, to } = getDateRange(filter)
    return logs.filter((l) => l.logged_at >= from && l.logged_at <= to)
  }, [logs, filter])

  function downloadCSV() {
    const csv = toCSV(logs)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weight-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('weight_logs').delete().eq('id', deleteId)
    setDeleting(false)
    setDeleteId(null)
    if (error) {
      toast.error('Failed to delete entry.')
      return
    }
    toast.success('Entry deleted.')
    router.refresh()
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#1B1D1E] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No weight entries yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Log your first weight to see it here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No entries for this period.</p>
        </div>
      ) : null}

      {filtered.length > 0 && <>
      <div className="flex justify-end mb-4">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1B1D1E] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-[#181A1B] border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Weight</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Notes</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{formatDate(log.logged_at)}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{formatWeight(log.weight_kg)}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell max-w-xs truncate">
                  {log.notes ?? '—'}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => setEditEntry(log)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(log.id)}
                    className="text-red-500 hover:underline font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Entry</h2>
              <button onClick={() => setEditEntry(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>
            <div className="p-6">
              <LogWeightForm
                entryId={editEntry.id}
                initialDate={editEntry.logged_at}
                initialWeight={editEntry.weight_kg}
                initialNotes={editEntry.notes}
                onSuccess={() => {
                  setEditEntry(null)
                  router.refresh()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete entry?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181A1B] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </>
  )
}
