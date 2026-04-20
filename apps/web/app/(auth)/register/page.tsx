'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { registerSchema, type RegisterInput } from '@simple-wt/shared'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    })
    if (error) {
      if (error.message.includes('already registered')) {
        setServerError('An account with this email already exists.')
      } else {
        setServerError(error.message)
      }
      return
    }
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#181A1B] px-4">
        <div className="w-full max-w-md text-center space-y-4 bg-white dark:bg-[#1B1D1E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Check your email</h2>
          <p className="text-gray-600 dark:text-gray-400">We sent a confirmation link to your email address. Click it to activate your account.</p>
          <Link href="/login" className="inline-block mt-4 text-blue-600 hover:underline font-medium text-sm">Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#181A1B] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Weight Tracker</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4 bg-white dark:bg-[#1B1D1E] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full name
            </label>
            <input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Alex Smith"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
