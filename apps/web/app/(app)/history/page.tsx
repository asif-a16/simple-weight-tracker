import { createClient } from '@/lib/supabase/server'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: logs } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', user!.id)
    .order('logged_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">History</h1>
      <HistoryClient logs={logs ?? []} />
    </div>
  )
}
