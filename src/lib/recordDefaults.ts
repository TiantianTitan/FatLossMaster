import type { ActivityLevel, DailyRecord } from '../types/record'
import { estimateDailyActivityCalories, estimateRestingCalories } from './calculations'

export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'sedentary'
export const DEFAULT_RESTING_CALORIES = 1600

const positive = (value?: number) => value != null && value > 0 ? value : undefined

export const deriveEnergyDefaults = (record: DailyRecord, previous?: Pick<DailyRecord, 'heightCm' | 'weightKg'>): DailyRecord => {
  const referenceWeight = positive(record.weightKg) ?? positive(previous?.weightKg)
  const restingCalories = positive(record.restingCalories) ?? estimateRestingCalories(referenceWeight) ?? DEFAULT_RESTING_CALORIES
  const activityLevel = record.activityLevel ?? DEFAULT_ACTIVITY_LEVEL
  const dailyCalories = positive(record.dailyCalories) ?? estimateDailyActivityCalories(restingCalories, activityLevel)
  return { ...record, restingCalories, restingMode: positive(record.restingCalories) ? record.restingMode ?? 'manual' : 'auto', activityLevel, dailyCalories }
}

export const resolveEnergyDefaults = (records: DailyRecord[]) => {
  let previous: Pick<DailyRecord, 'heightCm' | 'weightKg'> = {}
  return [...records].sort((a, b) => a.date.localeCompare(b.date)).map(record => {
    const resolved = deriveEnergyDefaults(record, previous)
    previous = { heightCm: positive(record.heightCm) ?? previous.heightCm, weightKg: positive(record.weightKg) ?? previous.weightKg }
    return resolved
  })
}

export const defaultsForDate = (records: DailyRecord[], date: string): Partial<DailyRecord> => {
  const previous = [...records].filter(record => record.date <= date).sort((a, b) => b.date.localeCompare(a.date))
  const current = previous.find(record => record.date === date)
  const heightCm = positive(current?.heightCm) ?? previous.find(record => positive(record.heightCm))?.heightCm
  const weightKg = positive(current?.weightKg) ?? previous.find(record => positive(record.weightKg))?.weightKg
  const now = new Date().toISOString()
  return { ...deriveEnergyDefaults(current ?? { id: '', date, createdAt: now, updatedAt: now }, { heightCm, weightKg }), heightCm, weightKg }
}
