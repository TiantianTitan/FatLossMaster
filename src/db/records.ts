import type { DailyRecord } from '../types/record'
import { dbPromise } from './database'

export const getRecordByDate = async (date: string) => (await dbPromise).getFromIndex('records', 'by-date', date)
export const getAllRecords = async () => (await dbPromise).getAll('records')
export const saveRecord = async (record: DailyRecord) => (await dbPromise).put('records', record)
export const deleteRecord = async (id: string) => (await dbPromise).delete('records', id)
export const clearRecords = async () => (await dbPromise).clear('records')
export const replaceRecords = async (records: DailyRecord[]) => {
  const db = await dbPromise
  const tx = db.transaction('records', 'readwrite')
  await tx.store.clear()
  for (const record of records) await tx.store.put(record)
  await tx.done
}
export const mergeRecords = async (records: DailyRecord[]) => {
  const db = await dbPromise
  const tx = db.transaction('records', 'readwrite')
  let added = 0
  let skipped = 0
  for (const record of records) {
    const existing = await tx.store.index('by-date').get(record.date)
    if (existing) {
      skipped += 1
      continue
    }
    const idCollision = await tx.store.get(record.id)
    await tx.store.put({ ...record, id: idCollision ? crypto.randomUUID() : record.id })
    added += 1
  }
  await tx.done
  return { added, skipped }
}
