'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDate, formatWeight, toCSV, type WeightLog } from '@simple-wt/shared'
import { createClient } from '@/lib/supabase/client'
import LogWeightForm from '@/components/weight/LogWeightForm'

export default function HistoryClient({ logs }: { logs: WeightLog[] }) {
  const router = useRouter()
  const [editEntry, setEditEntry] = useState<WeightLog | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-500">No weight entries yet.</p>
        <p className="text-sm text-gray-400 mt-1">Log your first weight to see it here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Weight</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Notes</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{formatDate(log.logged_at)}</td>
                <td className="px-4 py-3 text-gray-900">{formatWeight(log.weight_kg)}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Edit Entry</h2>
              <button onClick={() => setEditEntry(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Delete entry?</h2>
            <p className="text-sm text-gray-600">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
    </>
  )
}
