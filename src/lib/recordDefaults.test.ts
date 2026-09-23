import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { defaultsForDate, deriveEnergyDefaults, resolveEnergyDefaults } from './recordDefaults'

const record = (date: string, patch: Partial<DailyRecord> = {}): DailyRecord => ({ id: date, date, createdAt: date, updatedAt: date, ...patch })

describe('daily energy defaults', () => {
  it('uses the minimum activity level and a safe baseline without body data', () => {
    expect(deriveEnergyDefaults(record('2026-09-14'))).toMatchObject({ restingCalories: 1600, activityLevel: 'sedentary', dailyCalories: 320 })
  })

  it('carries the last measured weight forward for energy without inventing a measurement', () => {
    const resolved = resolveEnergyDefaults([record('2026-09-14', { weightKg: 72.2 }), record('2026-09-15')])
    expect(resolved[1]).toMatchObject({ restingCalories: 1588.4, activityLevel: 'sedentary', dailyCalories: 317.7 })
    expect(resolved[1].weightKg).toBeUndefined()
  })

  it('builds editable defaults from measurements on or before the selected date', () => {
    const defaults = defaultsForDate([record('2026-09-14', { heightCm: 176, weightKg: 72.2 }), record('2026-09-16', { weightKg: 71.6 })], '2026-09-17')
    expect(defaults).toMatchObject({ heightCm: 176, weightKg: 71.6, restingCalories: 1575.2, activityLevel: 'sedentary', dailyCalories: 315 })
  })

  it('replaces explicit zero energy values with defaults', () => {
    expect(deriveEnergyDefaults(record('2026-09-14', { weightKg: 70, restingCalories: 0, dailyCalories: 0 }))).toMatchObject({ restingCalories: 1540, dailyCalories: 308 })
  })
})
