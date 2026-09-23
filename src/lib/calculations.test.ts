import { describe, expect, it } from 'vitest'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, getFoodCalories } from './calculations'

describe('health calculations', () => {
  it('calculates BMI from metric values', () => expect(calculateBMI(75, 175)).toBeCloseTo(24.49, 2))
  it('returns no BMI when measurements are incomplete', () => expect(calculateBMI(75, undefined)).toBeUndefined())
  it('sums all expenditure components', () => expect(calculateTotalCalories({ restingCalories: 1650, dailyCalories: 500, exerciseCalories: 350 })).toBe(2500))
  it('uses positive numbers for deficits', () => expect(calculateCalorieDeficit({ restingCalories: 1650, dailyCalories: 500, exerciseCalories: 350, foodCalories: 2100 })).toBe(400))
  it('uses negative numbers for surpluses', () => expect(calculateCalorieDeficit({ restingCalories: 1600, dailyCalories: 300, exerciseCalories: 0, foodCalories: 2100 })).toBe(-200))
  it('estimates resting and daily activity energy without discarding decimals', () => { expect(estimateRestingCalories(75.25)).toBe(1655.5); expect(estimateDailyActivityCalories(1655.5, 'walking')).toBe(745) })
  it('prefers item totals while preserving legacy totals', () => {
    expect(getFoodCalories({ foodCalories: 500 })).toBe(500)
    expect(getFoodCalories({ foodCalories: 500, foodEntries: [{ id: '1', name: '午餐', calories: 650 }] })).toBe(650)
  })
  it('treats an explicitly empty food list as not yet logged', () => expect(getFoodCalories({ foodCalories: 500, foodEntries: [] })).toBeUndefined())
})
