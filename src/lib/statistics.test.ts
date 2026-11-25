import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { calculateTrendPeriod } from './statistics'

const record = (date: string, patch: Partial<DailyRecord> = {}): DailyRecord => ({ id: date, date, weightKg: 75, foodCalories: 2000, sleepHours: 8, restingCalories: 1600, dailyCalories: 500, exerciseCalories: 200, proteinGrams: 140, createdAt: date, updatedAt: date, ...patch })
const referenceDate = new Date(2026, 10, 25, 15)

describe('trend period statistics', () => {
  it.each([
    [7, '2026-11-18', '2026-11-17', '2026-11-11', '2026-11-10'],
    [30, '2026-10-26', '2026-10-25', '2026-09-26', '2026-09-25'],
    [90, '2026-08-27', '2026-08-26', '2026-05-29', '2026-05-28'],
  ] as const)('uses adjacent periods of %d completed calendar days', (range, start, previousEnd, previousStart, older) => {
    const records = [
      record('2026-11-25', { weightKg: 55, foodCalories: 500 }),
      record(previousEnd, { weightKg: 84 }),
      record('2026-11-24', { weightKg: 74 }),
      record(older, { weightKg: 95 }),
      record(start, { weightKg: 76 }),
      record('2026-11-26'),
      record('2026-11-23', { weightKg: undefined }),
      record(previousStart, { weightKg: 82 }),
    ]
    const period = calculateTrendPeriod(records, range, referenceDate)

    expect(period.records.map(item => item.date)).toEqual([start, '2026-11-23', '2026-11-24'])
    expect(period.stats).toMatchObject({
      recordedDays: 3,
      totalDays: range,
      averageWeight: 75,
      weightChange: -8,
      averageDeficit: 300,
      totalDeficit: 900,
      averageExercise: 200,
      totalExercise: 600,
    })
  })

  it('counts missing exercise as zero on completed recorded days', () => {
    const { stats } = calculateTrendPeriod([
      record('2026-11-23', { exerciseCalories: undefined, foodCalories: undefined, proteinGrams: undefined }),
      record('2026-11-24', { exerciseCalories: 300, foodCalories: 1800, proteinGrams: 120 }),
    ], 7, referenceDate)
    expect(stats.averageExercise).toBe(150)
    expect(stats.totalExercise).toBe(300)
    expect(stats.averageIntake).toBe(1800)
    expect(stats.averageProtein).toBe(120)
  })

  it('sums net calorie balance and training types for the selected completed days', () => {
    const records = [
      record('2026-11-17', {
        foodCalories: 1500,
        activityEntries: [{ id: 'ride', name: '骑行', calories: 220, trainingType: 'aerobic' }],
      }),
      record('2026-11-22', { foodCalories: undefined, exerciseCalories: undefined }),
      record('2026-11-23', { foodCalories: 2500, exerciseCalories: 300 }),
      record('2026-11-24', {
        foodCalories: 2600,
        exerciseCalories: 800,
        activityEntries: [
          { id: 'run', name: '跑步', calories: 120.5, trainingType: 'aerobic' },
          { id: 'lift', name: '力量训练', calories: 70.5, trainingType: 'anaerobic' },
          { id: 'old', name: '历史运动', calories: 10 },
        ],
      }),
      record('2026-11-25', { foodCalories: 4000, exerciseCalories: 500 }),
    ]

    expect(calculateTrendPeriod(records, 7, referenceDate).stats).toMatchObject({
      averageDeficit: -199.5,
      totalDeficit: -399,
      averageExercise: 167,
      totalExercise: 501,
      totalAerobic: 120.5,
      totalAnaerobic: 70.5,
    })
    expect(calculateTrendPeriod(records, 30, referenceDate).stats).toMatchObject({
      totalDeficit: 421,
      totalExercise: 721,
      totalAerobic: 340.5,
      totalAnaerobic: 70.5,
    })
  })

  it('requires weight measurements in both periods for a comparison', () => {
    const currentOnly = calculateTrendPeriod([
      record('2026-11-24', { weightKg: 74 }),
      record('2026-11-17', { weightKg: undefined }),
      record('2026-11-10', { weightKg: 80 }),
    ], 7, referenceDate)
    expect(currentOnly.stats.averageWeight).toBe(74)
    expect(currentOnly.stats.weightChange).toBeUndefined()

    const previousOnly = calculateTrendPeriod([
      record('2026-11-24', { weightKg: undefined }),
      record('2026-11-17', { weightKg: 80 }),
    ], 7, referenceDate)
    expect(previousOnly.stats.averageWeight).toBeUndefined()
    expect(previousOnly.stats.weightChange).toBeUndefined()
  })

  it('compares the first and last completed weight measurements for all time', () => {
    const { stats } = calculateTrendPeriod([
      record('2026-11-24', { weightKg: undefined }),
      record('2026-11-23', { weightKg: 74 }),
      record('2026-11-18', { weightKg: undefined }),
      record('2026-11-19', { weightKg: 80 }),
      record('2026-11-20', { weightKg: 70 }),
      record('2026-11-25', { weightKg: 55 }),
    ], 'all', referenceDate)
    expect(stats).toMatchObject({ recordedDays: 5, totalDays: 7, weightChange: -6 })
    expect(stats.averageWeight).toBeCloseTo(74.67)
  })

  it('handles all-time history with fewer than two completed weight measurements', () => {
    const today = record('2026-11-25', { weightKg: 55 })
    const empty = calculateTrendPeriod([today], 'all', referenceDate)
    expect(empty.records).toEqual([])
    expect(empty.stats).toMatchObject({ recordedDays: 0, totalDays: 0, totalDeficit: undefined, totalExercise: undefined, totalAerobic: undefined, totalAnaerobic: undefined })

    const single = calculateTrendPeriod([today, record('2026-11-24')], 'all', referenceDate)
    expect(single.stats.averageWeight).toBe(75)
    expect(single.stats.weightChange).toBeUndefined()
  })

  it('distinguishes a missing calorie balance from zero exercise totals', () => {
    const { stats } = calculateTrendPeriod([
      record('2026-11-24', { foodCalories: undefined, exerciseCalories: undefined }),
    ], 7, referenceDate)
    expect(stats).toMatchObject({ totalDeficit: undefined, totalExercise: 0, totalAerobic: 0, totalAnaerobic: 0 })
  })
})
