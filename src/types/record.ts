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
  includedInSteps?: boolean
}

export type ActivityLevel = 'sedentary' | 'standing' | 'walking' | 'physical'
export type Sex = 'male' | 'female'
export type BodyProfile = Pick<DailyRecord, 'heightCm' | 'weightKg' | 'waistCm' | 'ageYears' | 'sex'>

export interface DailyRecord {
  id: string
  date: string
  heightCm?: number
  weightKg?: number
  waistCm?: number
  ageYears?: number
  sex?: Sex
  sleepHours?: number
  stepCount?: number
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

export type NumericRecordKey = 'heightCm' | 'weightKg' | 'waistCm' | 'ageYears' | 'sleepHours' | 'stepCount' | 'restingCalories' | 'dailyCalories' | 'exerciseCalories' | 'foodCalories' | 'proteinGrams'
export type ThemeMode = 'system' | 'light' | 'dark'
export type Page = 'today' | 'records' | 'trends' | 'settings'
export type RecordSection = 'summary' | 'activity' | 'food' | 'resting' | 'daily' | 'sleep' | 'notes'
export type DetailMetric = 'deficit' | 'protein' | 'weight' | 'exercise' | 'sleep' | 'steps' | 'daily'
