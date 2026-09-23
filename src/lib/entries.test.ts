import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch } from './entries'

const legacy: DailyRecord = { id: '1', date: '2026-09-23', foodCalories: 2100, proteinGrams: 150, exerciseCalories: 350, createdAt: 'now', updatedAt: 'now' }

describe('entry migration and totals', () => {
  it('exposes legacy totals as editable entries', () => {
    expect(foodEntriesFor(legacy)).toEqual([{ id: 'legacy-food', name: '历史膳食记录', calories: 2100, proteinGrams: 150 }])
    expect(activityEntriesFor(legacy)).toEqual([{ id: 'legacy-activity', name: '历史运动记录', calories: 350 }])
  })
  it('keeps compatibility totals in sync with item lists', () => {
    expect(foodEntryPatch([{ id: 'a', name: '午餐', calories: 800.5, proteinGrams: 50.25 }, { id: 'b', name: '加餐', calories: 200.25, proteinGrams: 10.5 }])).toMatchObject({ foodCalories: 1000.75, proteinGrams: 60.75 })
    expect(activityEntryPatch([{ id: 'a', name: '力量训练', calories: 300.5 }])).toMatchObject({ exerciseCalories: 300.5 })
  })
})
