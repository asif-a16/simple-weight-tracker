import { createClient } from '@/lib/supabase/server'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const PAGE = 1000
  const results: { id: string; weight_kg: number; logged_at: string; notes: string | null; user_id: string }[] = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (!data?.length) break
    results.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">History</h1>
      <HistoryClient logs={results} />
    </div>
  )
}
