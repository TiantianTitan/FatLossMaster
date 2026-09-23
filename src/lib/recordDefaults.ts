import type { ActivityLevel, DailyRecord } from '../types/record'
import { estimateDailyActivityCalories, estimateRestingCalories } from './calculations'

export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'sedentary'
export const DEFAULT_RESTING_CALORIES = 1600

const positive = (value?: number) => value != null && value > 0 ? value : undefined
type MetabolicProfile = Pick<DailyRecord, 'heightCm' | 'weightKg' | 'ageYears' | 'sex'>

export const deriveEnergyDefaults = (record: DailyRecord, previous?: MetabolicProfile): DailyRecord => {
  const referenceWeight = positive(record.weightKg) ?? positive(previous?.weightKg)
  const referenceHeight = positive(record.heightCm) ?? positive(previous?.heightCm)
  const referenceAge = positive(record.ageYears) ?? positive(previous?.ageYears)
  const referenceSex = record.sex ?? previous?.sex
  const manualResting = record.restingMode === 'manual' ? positive(record.restingCalories) : undefined
  const restingCalories = manualResting ?? estimateRestingCalories(referenceWeight, referenceHeight, referenceAge, referenceSex) ?? positive(record.restingCalories) ?? DEFAULT_RESTING_CALORIES
  const activityLevel = record.activityLevel ?? DEFAULT_ACTIVITY_LEVEL
  const dailyCalories = estimateDailyActivityCalories(restingCalories, activityLevel)
  return { ...record, restingCalories, restingMode: manualResting ? 'manual' : 'auto', activityLevel, dailyCalories }
}

export const resolveEnergyDefaults = (records: DailyRecord[]) => {
  const latest=[...records].sort((a,b)=>b.date.localeCompare(a.date))
  let previous: MetabolicProfile = { heightCm:latest.find(record=>positive(record.heightCm))?.heightCm, ageYears:latest.find(record=>positive(record.ageYears))?.ageYears, sex:latest.find(record=>record.sex)?.sex }
  return [...records].sort((a, b) => a.date.localeCompare(b.date)).map(record => {
    const resolved = deriveEnergyDefaults(record, previous)
    previous = { heightCm: positive(record.heightCm) ?? previous.heightCm, weightKg: positive(record.weightKg) ?? previous.weightKg, ageYears:positive(record.ageYears)??previous.ageYears, sex:record.sex??previous.sex }
    return resolved
  })
}

export const defaultsForDate = (records: DailyRecord[], date: string): Partial<DailyRecord> => {
  const previous = [...records].filter(record => record.date <= date).sort((a, b) => b.date.localeCompare(a.date))
  const current = previous.find(record => record.date === date)
  const latest=[...records].sort((a,b)=>b.date.localeCompare(a.date))
  const heightCm = positive(current?.heightCm) ?? previous.find(record => positive(record.heightCm))?.heightCm ?? latest.find(record=>positive(record.heightCm))?.heightCm
  const weightKg = positive(current?.weightKg) ?? previous.find(record => positive(record.weightKg))?.weightKg
  const ageYears = positive(current?.ageYears) ?? previous.find(record=>positive(record.ageYears))?.ageYears ?? latest.find(record=>positive(record.ageYears))?.ageYears
  const sex = current?.sex ?? previous.find(record=>record.sex)?.sex ?? latest.find(record=>record.sex)?.sex
  const now = new Date().toISOString()
  return { ...deriveEnergyDefaults(current ?? { id: '', date, createdAt: now, updatedAt: now }, { heightCm, weightKg, ageYears, sex }), heightCm, weightKg, ageYears, sex }
}
