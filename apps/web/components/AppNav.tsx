'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/log', label: 'Log Weight' },
  { href: '/app/history', label: 'History' },
  { href: '/app/calendar', label: 'Calendar' },
]

export default function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen p-4">
        <div className="mb-8 px-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Signed in as</p>
          <p className="font-semibold text-gray-900 truncate">{userName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
        >
          Sign out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${
              pathname === href ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
