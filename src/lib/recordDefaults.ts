import type { ActivityLevel, BodyProfile, DailyRecord } from '../types/record'
import { estimateDailyActivityCalories, estimateRestingCalories } from './calculations'

export const DEFAULT_ACTIVITY_LEVEL: ActivityLevel = 'sedentary'
export const DEFAULT_RESTING_CALORIES = 1600

const positive = (value?: number) => value != null && value > 0 ? value : undefined
type MetabolicProfile = Pick<DailyRecord, 'heightCm' | 'weightKg' | 'ageYears' | 'sex'>

const latestProfile = (records: DailyRecord[]): MetabolicProfile => {
  const latest = [...records].sort((a, b) => b.date.localeCompare(a.date))
  return {
    heightCm: latest.find(record => positive(record.heightCm))?.heightCm,
    weightKg: latest.find(record => positive(record.weightKg))?.weightKg,
    ageYears: latest.find(record => positive(record.ageYears))?.ageYears,
    sex: latest.find(record => record.sex)?.sex,
  }
}

const currentProfile = (records: DailyRecord[], profile?: BodyProfile): MetabolicProfile => {
  if(profile!==undefined)return {heightCm:positive(profile.heightCm),weightKg:positive(profile.weightKg),ageYears:positive(profile.ageYears),sex:profile.sex}
  const latest = latestProfile(records)
  return latest
}

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

// Apply calculated energy fields without copying inherited body measurements into storage.
export const hydrateDailyRecord = (record: DailyRecord, defaults?: Partial<DailyRecord>): DailyRecord => {
  const manualResting = record.restingMode === 'manual' ? positive(record.restingCalories) : undefined
  const restingCalories = manualResting ?? positive(defaults?.restingCalories) ?? positive(record.restingCalories) ?? DEFAULT_RESTING_CALORIES
  const activityLevel = record.activityLevel ?? defaults?.activityLevel ?? DEFAULT_ACTIVITY_LEVEL
  const dailyCalories = estimateDailyActivityCalories(restingCalories, activityLevel) ?? defaults?.dailyCalories ?? record.dailyCalories
  return { ...record, restingCalories, restingMode: manualResting ? 'manual' : 'auto', activityLevel, dailyCalories }
}

export const resolveEnergyDefaults = (records: DailyRecord[], profile?: BodyProfile) => {
  const fallback = currentProfile(records, profile)
  let previous:MetabolicProfile={}
  return [...records].sort((a, b) => a.date.localeCompare(b.date)).map(record => {
    const reference:MetabolicProfile={
      heightCm:positive(record.heightCm)??previous.heightCm??fallback.heightCm,
      weightKg:positive(record.weightKg)??previous.weightKg??fallback.weightKg,
      ageYears:positive(record.ageYears)??previous.ageYears??fallback.ageYears,
      sex:record.sex??previous.sex??fallback.sex,
    }
    const resolved = deriveEnergyDefaults({ ...record,...reference })
    previous=reference
    return { ...resolved, heightCm: record.heightCm,weightKg:record.weightKg, ageYears: record.ageYears, sex: record.sex }
  })
}

export const defaultsForDate = (records: DailyRecord[], date: string, profile?: BodyProfile): Partial<DailyRecord> => {
  const previous = [...records].filter(record => record.date <= date).sort((a, b) => b.date.localeCompare(a.date))
  const current = previous.find(record => record.date === date)
  const global = currentProfile(records, profile)
  const heightCm = positive(current?.heightCm) ?? previous.find(record => positive(record.heightCm))?.heightCm ?? global.heightCm
  const weightKg = positive(current?.weightKg) ?? previous.find(record => positive(record.weightKg))?.weightKg ?? global.weightKg
  const ageYears = positive(current?.ageYears) ?? previous.find(record=>positive(record.ageYears))?.ageYears ?? global.ageYears
  const sex = current?.sex ?? previous.find(record=>record.sex)?.sex ?? global.sex
  const now = new Date().toISOString()
  const base = current ?? { id: '', date, createdAt: now, updatedAt: now }
  return deriveEnergyDefaults({ ...base, heightCm, weightKg, ageYears, sex })
}
