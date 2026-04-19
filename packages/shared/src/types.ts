export interface Profile {
  id: string
  name: string
  created_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string // ISO date string YYYY-MM-DD
  notes: string | null
  created_at: string
  updated_at: string
}

export type WeightLogInsert = Pick<WeightLog, 'weight_kg' | 'logged_at' | 'notes'>
export type WeightLogUpdate = Partial<Pick<WeightLog, 'weight_kg' | 'notes'>>

export type DateFilter = '7d' | '30d' | '90d' | '1y' | 'custom'

export interface DateRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}
