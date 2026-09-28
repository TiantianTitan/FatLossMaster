import type { DailyRecord } from '../types/record'

export interface MergePlan {
  records: DailyRecord[]
  added: number
  skipped: number
}

export const planRecordMerge = (existing: DailyRecord[], incoming: DailyRecord[]): MergePlan => {
  const existingDates = new Set(existing.map(record => record.date))
  const records = incoming.filter(record => !existingDates.has(record.date))
  return { records, added: records.length, skipped: incoming.length - records.length }
}
