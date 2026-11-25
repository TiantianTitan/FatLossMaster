import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import type { DailyRecord } from '../types/record'
import { calculateCalorieDeficit, getExerciseCalories, getFoodCalories, getProteinGrams } from './calculations'
import { trainingBreakdown } from './entries'

const summarize = (values: Array<number | undefined>) => {
  const recorded = values.filter(value => value != null)
  if (recorded.length === 0) return { total: undefined, average: undefined }
  const total = recorded.reduce((sum, value) => sum + value, 0)
  return { total, average: total / recorded.length }
}

export type TrendRange = 7 | 30 | 90 | 'all'

export interface PeriodStats {
  averageWeight?: number
  weightChange?: number
  averageIntake?: number
  averageDeficit?: number
  totalDeficit?: number
  averageExercise?: number
  totalExercise?: number
  totalAerobic?: number
  totalAnaerobic?: number
  averageProtein?: number
  recordedDays: number
  totalDays: number
}

export function calculateTrendPeriod(records: DailyRecord[], range: TrendRange, referenceDate: Date) {
  // Today is the exclusive end of the selected period. Its start is the exclusive end of the previous period.
  const end = format(referenceDate, 'yyyy-MM-dd')
  const period = range === 'all' ? undefined : {
    days: range,
    start: format(subDays(referenceDate, range), 'yyyy-MM-dd'),
    previousStart: format(subDays(referenceDate, range * 2), 'yyyy-MM-dd'),
  }
  const selected = records
    .filter(record => record.date < end && (!period || record.date >= period.start))
    .sort((a, b) => a.date.localeCompare(b.date))
  const weights = selected.map(record => record.weightKg).filter(weight => weight != null)
  const averageWeight = summarize(weights).average

  let weightChange: number | undefined
  if (period) {
    const previousAverage = summarize(records
      .filter(record => record.date >= period.previousStart && record.date < period.start)
      .map(record => record.weightKg)).average
    if (averageWeight != null && previousAverage != null) weightChange = averageWeight - previousAverage
  } else if (weights.length > 1) {
    weightChange = weights[weights.length - 1] - weights[0]
  }

  const firstDate = selected[0]?.date
  const deficit = summarize(selected.map(calculateCalorieDeficit))
  const exercise = summarize(selected.map(record => getExerciseCalories(record) ?? 0))
  const training = selected.map(record => trainingBreakdown(record))
  const stats: PeriodStats = {
    averageWeight,
    weightChange,
    averageIntake: summarize(selected.map(getFoodCalories)).average,
    averageDeficit: deficit.average,
    totalDeficit: deficit.total,
    averageExercise: exercise.average,
    totalExercise: exercise.total,
    totalAerobic: summarize(training.map(day => day.aerobic)).total,
    totalAnaerobic: summarize(training.map(day => day.anaerobic)).total,
    averageProtein: summarize(selected.map(getProteinGrams)).average,
    recordedDays: selected.length,
    totalDays: period?.days ?? (firstDate ? differenceInCalendarDays(referenceDate, parseISO(firstDate)) : 0),
  }

  return { records: selected, stats }
}
