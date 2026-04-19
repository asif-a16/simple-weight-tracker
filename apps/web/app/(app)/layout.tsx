import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181A1B] flex">
      <AppNav userName={profile?.name ?? 'User'} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
        {children}
      </main>
    </div>
  )
}
