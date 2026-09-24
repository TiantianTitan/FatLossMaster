import { describe, expect, it } from 'vitest'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, estimateStepCaloriesAdjustment, getDailyActivityCalories, getExerciseCalories, getFoodCalories } from './calculations'

describe('health calculations', () => {
  it('calculates BMI from metric values', () => expect(calculateBMI(75, 175)).toBeCloseTo(24.49, 2))
  it('returns no BMI when measurements are incomplete', () => expect(calculateBMI(75, undefined)).toBeUndefined())
  it('sums all expenditure components', () => expect(calculateTotalCalories({ restingCalories: 1650, dailyCalories: 500, exerciseCalories: 350 })).toBe(2500))
  it('uses positive numbers for deficits', () => expect(calculateCalorieDeficit({ restingCalories: 1650, dailyCalories: 500, exerciseCalories: 350, foodCalories: 2100 })).toBe(400))
  it('uses negative numbers for surpluses', () => expect(calculateCalorieDeficit({ restingCalories: 1600, dailyCalories: 300, exerciseCalories: 0, foodCalories: 2100 })).toBe(-200))
  it('uses the Mifflin–St Jeor formula for men and women', () => { expect(estimateRestingCalories(75,175,30,'male')).toBe(1698.8); expect(estimateRestingCalories(75,175,30,'female')).toBe(1532.8) })
  it('requires a complete metabolic profile', () => expect(estimateRestingCalories(75,175,30)).toBeUndefined())
  it('estimates daily activity energy without discarding decimals', () => expect(estimateDailyActivityCalories(1698.8, 'walking')).toBe(764.5))
  it('prefers item totals while preserving legacy totals', () => {
    expect(getFoodCalories({ foodCalories: 500 })).toBe(500)
    expect(getFoodCalories({ foodCalories: 500, foodEntries: [{ id: '1', name: '午餐', calories: 650 }] })).toBe(650)
  })
  it('treats an explicitly empty food list as not yet logged', () => expect(getFoodCalories({ foodCalories: 500, foodEntries: [] })).toBeUndefined())
  it('keeps the activity level estimate unchanged without steps', () => expect(getDailyActivityCalories({ restingCalories: 1600, activityLevel: 'sedentary', weightKg: 70 })).toBe(320))
  it('only adjusts the step difference from the level baseline', () => {
    const record = { restingCalories: 1600, activityLevel: 'sedentary' as const, weightKg: 70, stepCount: 8500 }
    expect(estimateStepCaloriesAdjustment(record)).toBe(128)
    expect(getDailyActivityCalories(record)).toBe(448)
  })
  it('caps unusually high and low step adjustments', () => {
    expect(estimateStepCaloriesAdjustment({ restingCalories: 1600, activityLevel: 'sedentary', weightKg: 70, stepCount: 100000 })).toBe(128)
    expect(estimateStepCaloriesAdjustment({ restingCalories: 1600, activityLevel: 'sedentary', weightKg: 70, stepCount: 0 })).toBe(-80)
  })
  it('does not double count step-based exercise when steps are present', () => {
    const activityEntries = [{ id: 'walk', name: '跑步', calories: 300, includedInSteps: true }, { id: 'lift', name: '力量训练', calories: 200 }]
    expect(getExerciseCalories({ activityEntries })).toBe(500)
    expect(getExerciseCalories({ activityEntries, stepCount: 10000 })).toBe(200)
  })
  it('closes the loop across resting, adjusted daily activity, and exercise', () => {
    expect(calculateTotalCalories({
      restingCalories: 1600,
      activityLevel: 'sedentary',
      weightKg: 70,
      stepCount: 8500,
      activityEntries: [
        { id: 'run', name: '跑步', calories: 300, includedInSteps: true },
        { id: 'lift', name: '力量训练', calories: 200 },
      ],
    })).toBe(2248)
  })
})
