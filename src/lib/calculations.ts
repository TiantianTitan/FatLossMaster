import type { DailyRecord } from '../types/record'

export const calculateBMI = (weightKg?: number, heightCm?: number) => {
  if (!weightKg || !heightCm) return undefined
  return weightKg / ((heightCm / 100) ** 2)
}

export const calculateTotalCalories = (record?: Partial<DailyRecord>) =>
  (record?.restingCalories ?? 0) + (record?.dailyCalories ?? 0) + (record?.exerciseCalories ?? 0)

export const calculateCalorieDeficit = (record?: Partial<DailyRecord>) => {
  if (record?.foodCalories == null) return undefined
  return calculateTotalCalories(record) - record.foodCalories
}

export const round = (value?: number, digits = 0) => value == null ? undefined : Number(value.toFixed(digits))
