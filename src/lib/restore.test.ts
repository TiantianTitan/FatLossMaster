import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { planRecordMerge } from './restore'

const record = (date: string, id = date): DailyRecord => ({ id, date, createdAt: date, updatedAt: date })

describe('backup merge planning', () => {
  it('adds new dates and preserves every same-date local record', () => {
    const plan = planRecordMerge(
      [record('2026-09-14', 'local-14'), record('2026-09-15', 'local-15')],
      [record('2026-09-14', 'backup-14'), record('2026-09-16', 'backup-16')],
    )
    expect(plan).toMatchObject({ added: 1, skipped: 1 })
    expect(plan.records.map(item => item.id)).toEqual(['backup-16'])
  })

  it('keeps all incoming records when there are no date conflicts', () => {
    const incoming = [record('2026-09-16'), record('2026-09-17')]
    expect(planRecordMerge([record('2026-09-15')], incoming)).toEqual({ records: incoming, added: 2, skipped: 0 })
  })
})
