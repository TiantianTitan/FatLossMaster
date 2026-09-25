import type { ActivityLevel, DailyRecord, Sex } from '../types/record'

export const calculateBMI = (weightKg?: number, heightCm?: number) => {
  if (!weightKg || !heightCm) return undefined
  return weightKg / ((heightCm / 100) ** 2)
}

// Mifflin–St Jeor resting metabolic rate estimate for adults.
export const estimateRestingCalories = (weightKg?: number, heightCm?: number, ageYears?: number, sex?: Sex) => {
  if (!weightKg || !heightCm || !ageYears || !sex) return undefined
  const estimate = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === 'male' ? 5 : -161)
  return Math.round(estimate * 10) / 10
}

export const activityLevels: Array<{ id: ActivityLevel; name: string; description: string; factor: number }> = [
  { id: 'sedentary', name: '静坐办公', description: '办公桌为主，少量走动', factor: .2 },
  { id: 'standing', name: '站立工作', description: '经常站立，间歇走动', factor: .3 },
  { id: 'walking', name: '走动工作', description: '工作中频繁步行', factor: .45 },
  { id: 'physical', name: '体力工作', description: '搬抬、装卸或重体力劳动', factor: .6 },
]

export const estimateDailyActivityCalories = (restingCalories?: number, level?: ActivityLevel) => {
  const factor = activityLevels.find(item => item.id === level)?.factor
  return restingCalories && factor ? Math.round(restingCalories * factor * 10) / 10 : undefined
}

export const getDailyActivityCalories = (record?: Partial<DailyRecord>) => {
  const base = estimateDailyActivityCalories(record?.restingCalories, record?.activityLevel) ?? record?.dailyCalories
  if (base == null) return undefined
  return Math.round(base * 10) / 10
}

export const getFoodCalories = (record?: Partial<DailyRecord>) => record?.foodEntries != null
  ? record.foodEntries.length ? record.foodEntries.reduce((sum, item) => sum + item.calories, 0) : undefined
  : record?.foodCalories

export const getProteinGrams = (record?: Partial<DailyRecord>) => record?.foodEntries != null
  ? record.foodEntries.length ? record.foodEntries.reduce((sum, item) => sum + (item.proteinGrams ?? 0), 0) : undefined
  : record?.proteinGrams

export const getExerciseCalories = (record?: Partial<DailyRecord>) => record?.activityEntries != null
  ? record.activityEntries.reduce((sum, item) => sum + item.calories, 0)
  : record?.exerciseCalories

export const calculateTotalCalories = (record?: Partial<DailyRecord>) =>
  (record?.restingCalories ?? 0) + (getDailyActivityCalories(record) ?? 0) + (getExerciseCalories(record) ?? 0)

export const calculateCalorieDeficit = (record?: Partial<DailyRecord>) => {
  const intake = getFoodCalories(record)
  if (intake == null) return undefined
  return calculateTotalCalories(record) - intake
}

export const round = (value?: number, digits = 0) => value == null ? undefined : Number(value.toFixed(digits))
