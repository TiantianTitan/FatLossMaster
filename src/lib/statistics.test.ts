import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { calculateMonthlyStats, calculateWeeklyStats, recordsInDayRange } from './statistics'

const record = (date: string, patch: Partial<DailyRecord> = {}): DailyRecord => ({ id: date, date, weightKg: 75, foodCalories: 2000, sleepHours: 8, restingCalories: 1600, dailyCalories: 500, exerciseCalories: 200, proteinGrams: 140, createdAt: date, updatedAt: date, ...patch })
describe('period statistics', () => {
  it('uses only completed days for weekly averages and the denominator', () => {
    const stats = calculateWeeklyStats([record('2026-09-21',{weightKg:76}),record('2026-09-22',{weightKg:75}),record('2026-09-23',{weightKg:50,foodCalories:500})], new Date(2026,8,23,15))
    expect(stats.recordedDays).toBe(2); expect(stats.totalDays).toBe(2); expect(stats.averageWeight).toBe(75.5); expect(stats.weightChange).toBe(-1); expect(stats.averageDeficit).toBe(300)
  })

  it('counts missing exercise as zero on completed recorded days', () => {
    const stats = calculateWeeklyStats([record('2026-09-21',{exerciseCalories:undefined,foodCalories:undefined,proteinGrams:undefined}),record('2026-09-22',{exerciseCalories:300,foodCalories:1800,proteinGrams:120})], new Date(2026,8,23,15))
    expect(stats.averageExercise).toBe(150)
    expect(stats.averageIntake).toBe(1800)
    expect(stats.averageProtein).toBe(120)
  })

  it('uses only elapsed complete days for a month in progress', () => {
    const stats=calculateMonthlyStats([record('2026-09-01'),record('2026-09-23',{foodCalories:500})],new Date(2026,8,23,15))
    expect(stats.totalDays).toBe(22)
    expect(stats.recordedDays).toBe(1)
    expect(stats.averageIntake).toBe(2000)
  })

  it('returns no complete period on Monday or the first day of a month', () => {
    const records=[record('2026-06-01')]
    expect(calculateWeeklyStats(records,new Date(2026,5,1,12))).toMatchObject({recordedDays:0,totalDays:0})
    expect(calculateMonthlyStats(records,new Date(2026,5,1,12))).toMatchObject({recordedDays:0,totalDays:0})
  })

  it('uses inclusive calendar-day boundaries for trend ranges', () => {
    const records=Array.from({length:9},(_,index)=>record(`2026-09-${String(15+index).padStart(2,'0')}`))
    expect(recordsInDayRange(records,7,new Date(2026,8,23,18)).map(item=>item.date)).toEqual(['2026-09-17','2026-09-18','2026-09-19','2026-09-20','2026-09-21','2026-09-22','2026-09-23'])
  })
})
