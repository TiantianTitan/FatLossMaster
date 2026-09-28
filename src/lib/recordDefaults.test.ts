import { describe, expect, it } from 'vitest'
import type { BodyProfile, DailyRecord } from '../types/record'
import { defaultsForDate, deriveEnergyDefaults, hydrateDailyRecord, resolveEnergyDefaults } from './recordDefaults'

const record = (date: string, patch: Partial<DailyRecord> = {}): DailyRecord => ({ id: date, date, createdAt: date, updatedAt: date, ...patch })

describe('daily energy defaults', () => {
  it('uses the minimum activity level and a safe baseline without body data', () => {
    expect(deriveEnergyDefaults(record('2026-09-14'))).toMatchObject({ restingCalories: 1600, activityLevel: 'sedentary', dailyCalories: 320 })
  })

  it('carries the last measured weight forward for energy without inventing a measurement', () => {
    const resolved = resolveEnergyDefaults([record('2026-09-14', { weightKg: 72.2 }), record('2026-09-15',{heightCm:176,ageYears:30,sex:'male'})])
    expect(resolved[1]).toMatchObject({ restingCalories: 1677, activityLevel: 'sedentary', dailyCalories: 335.4 })
    expect(resolved[1].weightKg).toBeUndefined()
  })

  it('builds editable defaults from measurements on or before the selected date', () => {
    const defaults = defaultsForDate([record('2026-09-14', { heightCm: 176, weightKg: 72.2,ageYears:30,sex:'male' }), record('2026-09-16', { weightKg: 71.6 })], '2026-09-17')
    expect(defaults).toMatchObject({ heightCm: 176, weightKg: 71.6,ageYears:30,sex:'male',restingCalories: 1671, activityLevel: 'sedentary', dailyCalories: 334.2 })
  })

  it('uses the current profile when a historical date has no earlier body data', () => {
    const profile: BodyProfile = { heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male' }
    expect(defaultsForDate([], '2026-09-10', profile)).toMatchObject({ heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male', restingCalories: 1780, dailyCalories: 356 })
  })

  it('does not leak future measurements into a supplied current profile',()=>{
    const profile:BodyProfile={ageYears:30,sex:'male'}
    const defaults=defaultsForDate([record('2026-10-01',{heightCm:190,weightKg:90})],'2026-09-20',profile)
    expect(defaults.heightCm).toBeUndefined()
    expect(defaults.weightKg).toBeUndefined()
    expect(defaults.restingCalories).toBe(1600)
  })

  it('prefers the most recent weight on or before the selected date', () => {
    const profile: BodyProfile = { heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male' }
    const defaults = defaultsForDate([record('2026-09-14', { weightKg: 72.2 })], '2026-09-15', profile)
    expect(defaults).toMatchObject({ weightKg: 72.2, heightCm: 180, ageYears: 34, sex: 'male', restingCalories: 1682, dailyCalories: 336.4 })
  })

  it('keeps a manual resting value and the profile recorded on that date', () => {
    const profile: BodyProfile = { heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male' }
    const defaults = defaultsForDate([record('2026-09-14', { weightKg: 70, heightCm: 160, ageYears: 60, sex: 'female', restingCalories: 1500, restingMode: 'manual' })], '2026-09-14', profile)
    expect(defaults).toMatchObject({ heightCm: 160, weightKg: 70, ageYears: 60, sex: 'female', restingCalories: 1500, restingMode: 'manual', dailyCalories: 300 })
  })

  it('resolves old automatic records with the current profile without inventing measurements', () => {
    const profile: BodyProfile = { heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male' }
    const [resolved] = resolveEnergyDefaults([record('2026-09-10', { restingCalories: 1600, restingMode: 'auto' })], profile)
    expect(resolved).toMatchObject({ restingCalories: 1780, dailyCalories: 356 })
    expect(resolved.weightKg).toBeUndefined()
    expect(resolved.heightCm).toBeUndefined()
  })

  it('keeps historical profiles stable and inherits them only into later calculations', () => {
    const profile: BodyProfile = { heightCm: 180, weightKg: 82, ageYears: 34, sex: 'male' }
    const resolved=resolveEnergyDefaults([
      record('2025-09-10',{heightCm:175,weightKg:75,ageYears:29,sex:'male'}),
      record('2025-09-11',{foodCalories:2000}),
      record('2026-09-10',{heightCm:180,weightKg:82,ageYears:34,sex:'male'}),
    ],profile)
    expect(resolved[0].restingCalories).toBe(1703.8)
    expect(resolved[1].restingCalories).toBe(1703.8)
    expect(resolved[2].restingCalories).toBe(1780)
    expect(resolved[1].weightKg).toBeUndefined()
  })

  it('replaces explicit zero energy values with defaults', () => {
    expect(deriveEnergyDefaults(record('2026-09-14', { weightKg: 70,heightCm:175,ageYears:30,sex:'male',restingCalories: 0, dailyCalories: 0 }))).toMatchObject({ restingCalories: 1648.8, dailyCalories: 329.8 })
  })

  it('preserves a manually entered resting value', () => {
    expect(deriveEnergyDefaults(record('2026-09-14',{weightKg:70,heightCm:175,ageYears:30,sex:'male',restingCalories:1500,restingMode:'manual'}))).toMatchObject({restingCalories:1500,restingMode:'manual',dailyCalories:300})
  })

  it('recalculates a previous automatic estimate with Mifflin–St Jeor', () => {
    expect(deriveEnergyDefaults(record('2026-09-14',{weightKg:70,heightCm:175,ageYears:30,sex:'male',restingCalories:1540,restingMode:'auto'}))).toMatchObject({restingCalories:1648.8,restingMode:'auto',dailyCalories:329.8})
  })

  it('hydrates energy without turning inherited measurements into recorded measurements', () => {
    const hydrated=hydrateDailyRecord(record('2026-09-15',{foodCalories:1800}),{heightCm:180,weightKg:72.2,ageYears:30,sex:'male',restingCalories:1668,dailyCalories:333.6,activityLevel:'sedentary'})
    expect(hydrated).toMatchObject({restingCalories:1668,dailyCalories:333.6,activityLevel:'sedentary',foodCalories:1800})
    expect(hydrated.heightCm).toBeUndefined()
    expect(hydrated.weightKg).toBeUndefined()
    expect(hydrated.ageYears).toBeUndefined()
    expect(hydrated.sex).toBeUndefined()
  })

  it('preserves an explicitly manual resting value while hydrating', () => {
    expect(hydrateDailyRecord(record('2026-09-15',{restingCalories:1500,restingMode:'manual'}),{restingCalories:1700,activityLevel:'walking'})).toMatchObject({restingCalories:1500,restingMode:'manual',activityLevel:'walking',dailyCalories:675})
  })
})
