import type { ActivityEntry, DailyRecord, FoodEntry } from '../types/record'

export const foodEntriesFor = (record: DailyRecord): FoodEntry[] => record.foodEntries ?? (record.foodCalories != null || record.proteinGrams != null ? [{ id: 'legacy-food', name: '原有膳食记录', calories: record.foodCalories ?? 0, proteinGrams: record.proteinGrams }] : [])

export const activityEntriesFor = (record: DailyRecord): ActivityEntry[] => record.activityEntries ?? (record.exerciseCalories != null ? [{ id: 'legacy-activity', name: '原有活动记录', calories: record.exerciseCalories }] : [])

export const foodEntryPatch = (entries: FoodEntry[]): Partial<DailyRecord> => ({
  foodEntries: entries,
  foodCalories: entries.reduce((sum, item) => sum + item.calories, 0),
  proteinGrams: entries.reduce((sum, item) => sum + (item.proteinGrams ?? 0), 0),
})

export const activityEntryPatch = (entries: ActivityEntry[]): Partial<DailyRecord> => ({
  activityEntries: entries,
  exerciseCalories: entries.reduce((sum, item) => sum + item.calories, 0),
})
