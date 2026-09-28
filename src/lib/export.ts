import type { AppPreferences, DailyRecord } from '../types/record'
import { calculateCalorieDeficit, calculateTotalCalories, getDailyActivityCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from './calculations'
import { todayKey } from './date'

const download = (content: string, type: string, name: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.hidden = true; document.body.append(anchor); anchor.click(); anchor.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

export const exportCSV = (records: DailyRecord[]) => {
  const keys = ['date','sex','ageYears','heightCm','weightKg','waistCm','sleepHours','stepCount','restingCalories','dailyCalories','activityLevel','restingMode','exerciseCalories','totalCalories','foodCalories','proteinGrams','calorieDeficit','notes'] as const
  const rows = records.map(r => ({ ...r, dailyCalories: getDailyActivityCalories(r), exerciseCalories: getExerciseCalories(r), foodCalories: getFoodCalories(r), proteinGrams: getProteinGrams(r), totalCalories: calculateTotalCalories(r), calorieDeficit: calculateCalorieDeficit(r) }))
  download('\ufeff' + [keys.join(','), ...rows.map(row => keys.map(k => csvCell(row[k])).join(','))].join('\n'), 'text/csv;charset=utf-8', `轻衡备份-${todayKey()}.csv`)
}
export const buildBackupPayload = (records:DailyRecord[],preferences:AppPreferences={}) => ({ version:4 as const, exportedAt:new Date().toISOString(), preferences, records })
export const exportJSON = (records: DailyRecord[], name = '轻衡备份', preferences:AppPreferences={}) => download(JSON.stringify(buildBackupPayload(records,preferences), null, 2), 'application/json', `${name}-${todayKey()}.json`)
