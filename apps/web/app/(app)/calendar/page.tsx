import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const PAGE = 1000
  const results: { id: string; weight_kg: number; logged_at: string }[] = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (!data?.length) break
    results.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', user!.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>
      <CalendarClient
        logs={results}
        accountCreatedAt={profile?.created_at.slice(0, 10) ?? '2020-01-01'}
      />
    </div>
  )
}
