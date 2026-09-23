import { useEffect, useRef, useState } from 'react'
import { getRecordByDate, saveRecord } from '../db/records'
import type { DailyRecord } from '../types/record'

const emptyRecord = (date: string): DailyRecord => { const now = new Date().toISOString(); return { id: crypto.randomUUID(), date, createdAt: now, updatedAt: now } }

export function useDailyRecord(date: string, onSaved: () => void) {
  const [record, setRecord] = useState<DailyRecord>(() => emptyRecord(date))
  const [loadedDate, setLoadedDate] = useState<string>()
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number>(undefined)
  useEffect(() => { let active = true; getRecordByDate(date).then(found => { if (active) { setRecord(found ?? emptyRecord(date)); setLoadedDate(date) } }); return () => { active = false } }, [date])
  const update = async (patch: Partial<DailyRecord>) => {
    const next = { ...record, ...patch, updatedAt: new Date().toISOString() }
    setRecord(next); await saveRecord(next); onSaved(); setSaved(true)
    clearTimeout(savedTimer.current); savedTimer.current = window.setTimeout(() => setSaved(false), 1500)
  }
  return { record, update, ready: loadedDate === date, saved }
}
