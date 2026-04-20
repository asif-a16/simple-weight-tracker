'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { weightLogSchema, type WeightLogInput } from '@simple-wt/shared'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialDate?: string
  initialWeight?: number
  entryId?: string
  onSuccess?: () => void
}

export default function LogWeightForm({ initialDate, initialWeight, entryId, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WeightLogInput>({
    resolver: zodResolver(weightLogSchema),
    defaultValues: {
      logged_at: initialDate ?? today,
      weight_kg: initialWeight ?? undefined,
    },
  })

  async function onSubmit(data: WeightLogInput) {
    setServerError(null)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setServerError('Not signed in.'); return }

    let error
    if (entryId) {
      ;({ error } = await supabase
        .from('weight_logs')
        .update({ weight_kg: data.weight_kg, logged_at: data.logged_at })
        .eq('id', entryId))
    } else {
      ;({ error } = await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight_kg: data.weight_kg,
        logged_at: data.logged_at,
      }))
    }

    if (error) {
      if (error.code === '23505') {
        setServerError('You already have an entry for this date. Edit it from History.')
      } else {
        setServerError('Something went wrong. Please try again.')
      }
      return
    }

    toast.success(entryId ? 'Entry updated' : 'Weight logged!')
    if (!entryId) reset({ logged_at: today, weight_kg: undefined })
    onSuccess?.()
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-[#181A1B] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-[#1B1D1E] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="logged_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date
        </label>
        <input
          {...register('logged_at')}
          id="logged_at"
          type="date"
          max={today}
          className={inputClass}
        />
        {errors.logged_at && (
          <p className="mt-1 text-sm text-red-600">{errors.logged_at.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Weight (kg)
        </label>
        <input
          {...register('weight_kg', { valueAsNumber: true })}
          id="weight_kg"
          type="number"
          step="0.01"
          min="1"
          max="999"
          className={inputClass}
          placeholder="e.g. 75.5"
        />
        {errors.weight_kg && (
          <p className="mt-1 text-sm text-red-600">{errors.weight_kg.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? 'Saving…' : entryId ? 'Update entry' : 'Log weight'}
      </button>
    </form>
  )
}
