import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { calculateWeeklyStats } from './statistics'

const record = (date: string, weightKg: number, foodCalories: number, sleepHours: number): DailyRecord => ({ id: date, date, weightKg, foodCalories, sleepHours, restingCalories: 1600, dailyCalories: 500, exerciseCalories: 200, proteinGrams: 140, createdAt: date, updatedAt: date })
describe('period statistics', () => {
  it('averages values and calculates weight change without inventing missing days', () => {
    const stats = calculateWeeklyStats([record('2026-09-21',76,2200,7.5),record('2026-09-23',75,2000,8)], new Date(2026,8,23))
    expect(stats.recordedDays).toBe(2); expect(stats.totalDays).toBe(7); expect(stats.averageWeight).toBe(75.5); expect(stats.weightChange).toBe(-1); expect(stats.averageDeficit).toBe(200); expect(stats.averageSleep).toBe(7.75)
  })
})
