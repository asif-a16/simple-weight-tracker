import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: logs } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, logged_at')
    .eq('user_id', user!.id)
    .order('logged_at', { ascending: true })
    .limit(10000)

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
