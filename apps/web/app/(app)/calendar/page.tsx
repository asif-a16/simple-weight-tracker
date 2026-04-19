import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', user!.id)
    .single()

  const { data: logs } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, logged_at, notes')
    .eq('user_id', user!.id)
    .order('logged_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>
      <CalendarClient
        logs={logs ?? []}
        accountCreatedAt={profile?.created_at.slice(0, 10) ?? '2020-01-01'}
      />
    </div>
  )
}
