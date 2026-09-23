import { differenceInCalendarDays, endOfMonth, endOfWeek, isWithinInterval, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import type { DailyRecord } from '../types/record'
import { calculateCalorieDeficit, getFoodCalories, getProteinGrams } from './calculations'

const mean = (values: Array<number | undefined>) => {
  const valid = values.filter((value): value is number => value != null)
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : undefined
}

export interface PeriodStats {
  averageWeight?: number
  weightChange?: number
  averageWaist?: number
  averageIntake?: number
  averageDeficit?: number
  averageProtein?: number
  averageSleep?: number
  startWeight?: number
  currentWeight?: number
  recordedDays: number
  totalDays: number
}

const periodStats = (records: DailyRecord[], start: Date, end: Date): PeriodStats => {
  const filtered = records.filter(r => isWithinInterval(parseISO(r.date), { start, end })).sort((a, b) => a.date.localeCompare(b.date))
  const weights = filtered.filter(r => r.weightKg != null)
  const startWeight = weights[0]?.weightKg
  const currentWeight = weights.at(-1)?.weightKg
  return {
    averageWeight: mean(filtered.map(r => r.weightKg)), weightChange: startWeight != null && currentWeight != null ? currentWeight - startWeight : undefined,
    averageWaist: mean(filtered.map(r => r.waistCm)), averageIntake: mean(filtered.map(getFoodCalories)),
    averageDeficit: mean(filtered.map(calculateCalorieDeficit)), averageProtein: mean(filtered.map(getProteinGrams)), averageSleep: mean(filtered.map(r => r.sleepHours)),
    startWeight, currentWeight, recordedDays: filtered.length, totalDays: differenceInCalendarDays(end, start) + 1
  }
}

export const calculateWeeklyStats = (records: DailyRecord[], date = new Date()) => periodStats(records, startOfWeek(date, { weekStartsOn: 1 }), endOfWeek(date, { weekStartsOn: 1 }))
export const calculateMonthlyStats = (records: DailyRecord[], date = new Date()) => periodStats(records, startOfMonth(date), endOfMonth(date))
