import { useEffect, useRef, useState } from 'react'
import { getRecordByDate, saveRecord } from '../db/records'
import type { BodyProfile, DailyRecord } from '../types/record'

const emptyRecord = (date: string, defaults?: BodyProfile): DailyRecord => { const now = new Date().toISOString(); return { id: crypto.randomUUID(), date, ...defaults, createdAt: now, updatedAt: now } }

export function useDailyRecord(date: string, onSaved: () => void, defaults?: BodyProfile) {
  const [record, setRecord] = useState<DailyRecord>(() => emptyRecord(date, defaults))
  const defaultHeight = defaults?.heightCm, defaultWeight = defaults?.weightKg
  const [loadedDate, setLoadedDate] = useState<string>()
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number>(undefined)
  useEffect(() => { let active = true; const bodyDefaults={heightCm:defaultHeight,weightKg:defaultWeight}; getRecordByDate(date).then(found => { if (active) { setRecord(found ? { ...found, heightCm: found.heightCm ?? defaultHeight, weightKg: found.weightKg ?? defaultWeight } : emptyRecord(date, bodyDefaults)); setLoadedDate(date) } }); return () => { active = false } }, [date, defaultHeight, defaultWeight])
  const update = async (patch: Partial<DailyRecord>) => {
    const next = { ...record, ...patch, updatedAt: new Date().toISOString() }
    setRecord(next); await saveRecord(next); onSaved(); setSaved(true)
    clearTimeout(savedTimer.current); savedTimer.current = window.setTimeout(() => setSaved(false), 1500)
  }
  return { record, update, ready: loadedDate === date, saved }
}
