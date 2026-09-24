import { describe, expect, it } from 'vitest'
import { parseBackup } from './import'

const base = { id: '1', date: '2026-09-23', createdAt: '2026-09-23T00:00:00Z', updatedAt: '2026-09-23T00:00:00Z' }

describe('backup import compatibility', () => {
  it('accepts legacy version 1 backups', () => expect(parseBackup(JSON.stringify({ version: 1, records: [{ ...base, foodCalories: 2000 }] }))).toHaveLength(1))
  it('accepts version 2 item lists', () => expect(parseBackup(JSON.stringify({ version: 2, records: [{ ...base, foodEntries: [{ id: 'f', name: '午餐', calories: 800 }] }] }))[0].foodEntries).toHaveLength(1))
  it('accepts valid metabolic profile fields', () => expect(parseBackup(JSON.stringify({ version: 2, records: [{ ...base, sex:'female',ageYears:30 }] }))[0]).toMatchObject({sex:'female',ageYears:30}))
  it('rejects invalid metabolic profile fields', () => expect(() => parseBackup(JSON.stringify({ version: 2, records: [{ ...base, sex:'other',ageYears:200 }] }))).toThrow('性别格式无效'))
  it('rejects malformed item lists', () => expect(() => parseBackup(JSON.stringify({ version: 2, records: [{ ...base, foodEntries: [{ name: '午餐' }] }] }))).toThrow('膳食单项格式无效'))
})
