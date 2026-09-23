import type { DailyRecord } from '../types/record'
import { calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from './calculations'

const download = (content: string, type: string, name: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click()
  URL.revokeObjectURL(url)
}
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

export const exportCSV = (records: DailyRecord[]) => {
  const keys = ['date','heightCm','weightKg','waistCm','sleepHours','restingCalories','dailyCalories','exerciseCalories','totalCalories','foodCalories','proteinGrams','calorieDeficit','notes'] as const
  const rows = records.map(r => ({ ...r, exerciseCalories: getExerciseCalories(r), foodCalories: getFoodCalories(r), proteinGrams: getProteinGrams(r), totalCalories: calculateTotalCalories(r), calorieDeficit: calculateCalorieDeficit(r) }))
  download('\ufeff' + [keys.join(','), ...rows.map(row => keys.map(k => csvCell(row[k])).join(','))].join('\n'), 'text/csv;charset=utf-8', `轻衡备份-${new Date().toISOString().slice(0,10)}.csv`)
}
export const exportJSON = (records: DailyRecord[]) => download(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), records }, null, 2), 'application/json', `轻衡备份-${new Date().toISOString().slice(0,10)}.json`)
