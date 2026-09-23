import { openDB, type DBSchema } from 'idb'
import type { DailyRecord } from '../types/record'

interface HealthDB extends DBSchema {
  records: { key: string; value: DailyRecord; indexes: { 'by-date': string } }
}

export const dbPromise = openDB<HealthDB>('qingheng-health', 1, {
  upgrade(db) {
    const store = db.createObjectStore('records', { keyPath: 'id' })
    store.createIndex('by-date', 'date', { unique: true })
  }
})
