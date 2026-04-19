import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch last 365 days by default — client filters from this cache
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)

  const { data: logs } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, logged_at, notes')
    .eq('user_id', user!.id)
    .gte('logged_at', yearAgo.toISOString().slice(0, 10))
    .order('logged_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {profile?.name ?? 'there'}
      </h1>
      <DashboardClient logs={logs ?? []} />
    </div>
  )
}
