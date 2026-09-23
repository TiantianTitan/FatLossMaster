import { useEffect, useRef, useState } from 'react'
import { getRecordByDate, saveRecord } from '../db/records'
import type { DailyRecord } from '../types/record'

const emptyRecord = (date: string, defaults?: Partial<DailyRecord>): DailyRecord => { const now = new Date().toISOString(); return { ...defaults, id: crypto.randomUUID(), date, createdAt: now, updatedAt: now } }

export function useDailyRecord(date: string, onSaved: () => void, defaults?: Partial<DailyRecord>) {
  const [record, setRecord] = useState<DailyRecord>(() => emptyRecord(date, defaults))
  const defaultHeight = defaults?.heightCm, defaultWeight = defaults?.weightKg
  const defaultResting=defaults?.restingCalories,defaultLevel=defaults?.activityLevel,defaultDaily=defaults?.dailyCalories
  const [loadedDate, setLoadedDate] = useState<string>()
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number>(undefined)
  useEffect(() => { let active = true; const dailyDefaults={heightCm:defaultHeight,weightKg:defaultWeight,restingCalories:defaultResting,activityLevel:defaultLevel,dailyCalories:defaultDaily,restingMode:'auto' as const}; getRecordByDate(date).then(found => { if (active) { setRecord(found ? { ...found, heightCm: found.heightCm ?? defaultHeight, weightKg: found.weightKg ?? defaultWeight, restingCalories:found.restingCalories??defaultResting,activityLevel:found.activityLevel??defaultLevel,dailyCalories:found.dailyCalories??defaultDaily } : emptyRecord(date, dailyDefaults)); setLoadedDate(date) } }); return () => { active = false } }, [date, defaultHeight, defaultWeight,defaultResting,defaultLevel,defaultDaily])
  const update = async (patch: Partial<DailyRecord>) => {
    const next = { ...record, ...patch, updatedAt: new Date().toISOString() }
    setRecord(next); await saveRecord(next); onSaved(); setSaved(true)
    clearTimeout(savedTimer.current); savedTimer.current = window.setTimeout(() => setSaved(false), 1500)
  }
  return { record, update, ready: loadedDate === date, saved }
}
