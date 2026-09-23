export interface DailyRecord {
  id: string
  date: string
  heightCm?: number
  weightKg?: number
  waistCm?: number
  restingCalories?: number
  dailyCalories?: number
  exerciseCalories?: number
  foodCalories?: number
  proteinGrams?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type NumericRecordKey = Exclude<keyof DailyRecord, 'id' | 'date' | 'notes' | 'createdAt' | 'updatedAt'>
export type ThemeMode = 'system' | 'light' | 'dark'
export type Page = 'today' | 'records' | 'trends' | 'settings'
