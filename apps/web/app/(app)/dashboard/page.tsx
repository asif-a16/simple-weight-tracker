import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

async function fetchAllLogs(supabase: ReturnType<typeof createClient>, userId: string) {
  const PAGE = 1000
  const results: { id: string; weight_kg: number; logged_at: string }[] = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: true })
      .range(from, from + PAGE - 1)
    if (!data?.length) break
    results.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return results
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [logs, profileResult] = await Promise.all([
    fetchAllLogs(supabase, user!.id),
    supabase.from('profiles').select('name').eq('id', user!.id).single(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {profileResult.data?.name ?? 'there'}
      </h1>
      <DashboardClient logs={logs} />
    </div>
  )
}
