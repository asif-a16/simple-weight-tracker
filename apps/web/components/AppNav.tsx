'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/log', label: 'Log Weight' },
  { href: '/history', label: 'History' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/settings', label: 'Settings' },
]

export default function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { dark, toggle } = useTheme()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-[#1B1D1E] border-r border-gray-200 dark:border-gray-700 min-h-screen p-4">
        <div className="mb-8 px-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Signed in as</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{userName}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1">
          <button
            onClick={toggle}
            className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            {dark ? '☀ Light mode' : '☾ Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1B1D1E] border-t border-gray-200 dark:border-gray-700 z-50 flex">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-3 text-xs font-medium text-center transition-colors ${
              pathname === href ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </Link>
        ))}
        <button
          onClick={toggle}
          className="px-3 py-3 text-gray-500 dark:text-gray-400 text-base"
          aria-label="Toggle dark mode"
        >
          {dark ? '☀' : '☾'}
        </button>
      </nav>
    </>
  )
}
