'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { toCSV, parseImportCSV } from '@simple-wt/shared'

interface Props {
  userId: string
  initialName: string
  email: string
}

interface ImportPreview {
  rows: { logged_at: string; weight_kg: number }[]
  skipped: number
}

export default function SettingsClient({ userId, initialName, email }: Props) {
  const router = useRouter()
  const { dark, toggle } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(initialName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [exporting, setExporting] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  function startEditName() {
    setNameInput(name)
    setNameError(null)
    setEditingName(true)
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) { setNameError('Name is required'); return }
    if (trimmed.length > 100) { setNameError('Name too long'); return }
    setNameSaving(true)
    setNameError(null)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', userId)
    setNameSaving(false)
    if (error) { setNameError('Failed to save. Try again.'); return }
    setName(trimmed)
    setEditingName(false)
    router.refresh()
  }

  async function handleExport() {
    setExporting(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
    setExporting(false)
    if (!data?.length) { alert('No weight entries found.'); return }
    const csv = toCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weight-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseImportCSV(text)
      const totalLines = text.split(/\r?\n/).filter(l => l.trim()).length
      setImportPreview({ rows, skipped: totalLines - rows.length })
      setImportResult(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImportConfirm() {
    if (!importPreview?.rows.length) return
    setImporting(true)
    const supabase = createClient()
    const payload = importPreview.rows.map(r => ({
      user_id: userId,
      logged_at: r.logged_at,
      weight_kg: r.weight_kg,
    }))
    const { error } = await supabase
      .from('weight_logs')
      .upsert(payload, { onConflict: 'user_id,logged_at' })
    setImporting(false)
    if (error) {
      setImportResult('Import failed. Please try again.')
    } else {
      setImportResult(`Imported ${importPreview.rows.length} entries successfully.`)
      setImportPreview(null)
      router.refresh()
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <section className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account</p>

        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
            {!editingName && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{name}</span>
                <button onClick={startEditName} className="text-sm text-blue-600 hover:underline font-medium">
                  Edit
                </button>
              </div>
            )}
          </div>
          {editingName && (
            <div className="mt-2 space-y-2">
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {nameError && <p className="text-xs text-red-600">{nameError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  disabled={nameSaving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {nameSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[55%] text-right">{email}</span>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
          <button onClick={handleSignOut} className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
            Sign out
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Appearance</p>
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark mode</span>
          <button
            onClick={toggle}
            className="text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {dark ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-[#1B1D1E] rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Data</p>

        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">›</span>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Import CSV
          </button>
          <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">›</span>
          <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileChange} />
        </div>

        {importResult && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
            <p className="text-sm text-green-600 dark:text-green-400">{importResult}</p>
          </div>
        )}
      </section>

      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1B1D1E] rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import CSV</h2>
            {importPreview.rows.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No valid entries found. Make sure the file has dates and weights.</p>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Found <span className="font-semibold text-gray-900 dark:text-gray-100">{importPreview.rows.length}</span> entries to import.
                  {importPreview.skipped > 0 && (
                    <span className="text-gray-500 dark:text-gray-400"> ({importPreview.skipped} rows skipped — no weight.)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Existing entries for the same date will be overwritten.</p>
              </>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setImportPreview(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#181A1B] border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              {importPreview.rows.length > 0 && (
                <button
                  onClick={handleImportConfirm}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
                >
                  {importing ? 'Importing…' : 'Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
