export interface FoodEntry {
  id: string
  name: string
  calories: number
  proteinGrams?: number
}

export interface ActivityEntry {
  id: string
  name: string
  calories: number
}

export type ActivityLevel = 'sedentary' | 'standing' | 'walking' | 'physical'

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
  foodEntries?: FoodEntry[]
  activityEntries?: ActivityEntry[]
  activityLevel?: ActivityLevel
  restingMode?: 'auto' | 'manual'
  notes?: string
  createdAt: string
  updatedAt: string
}

export type NumericRecordKey = 'heightCm' | 'weightKg' | 'waistCm' | 'restingCalories' | 'dailyCalories' | 'exerciseCalories' | 'foodCalories' | 'proteinGrams'
export type ThemeMode = 'system' | 'light' | 'dark'
export type Page = 'today' | 'records' | 'trends' | 'settings'
