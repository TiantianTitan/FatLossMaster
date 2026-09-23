import { useEffect, useRef, useState } from 'react'
import { getRecordByDate, saveRecord } from '../db/records'
import type { DailyRecord } from '../types/record'

const emptyRecord = (date: string, defaults?: Partial<DailyRecord>): DailyRecord => { const now = new Date().toISOString(); return { ...defaults, id: crypto.randomUUID(), date, createdAt: now, updatedAt: now } }

export function useDailyRecord(date: string, onSaved: () => void, defaults?: Partial<DailyRecord>) {
  const [record, setRecord] = useState<DailyRecord>(() => emptyRecord(date, defaults))
  const defaultHeight = defaults?.heightCm, defaultWeight = defaults?.weightKg,defaultAge=defaults?.ageYears,defaultSex=defaults?.sex
  const defaultResting=defaults?.restingCalories,defaultLevel=defaults?.activityLevel,defaultDaily=defaults?.dailyCalories
  const [loadedDate, setLoadedDate] = useState<string>()
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number>(undefined)
  useEffect(() => { let active = true; const dailyDefaults={heightCm:defaultHeight,weightKg:defaultWeight,ageYears:defaultAge,sex:defaultSex,restingCalories:defaultResting,activityLevel:defaultLevel,dailyCalories:defaultDaily,restingMode:'auto' as const}; getRecordByDate(date).then(found => { if (active) { const manualResting=found?.restingMode==='manual'&&found.restingCalories!=null&&found.restingCalories>0;setRecord(found ? { ...found, heightCm: found.heightCm ?? defaultHeight, weightKg: found.weightKg ?? defaultWeight,ageYears:found.ageYears??defaultAge,sex:found.sex??defaultSex,restingCalories:manualResting?found.restingCalories:defaultResting,restingMode:manualResting?'manual':'auto',activityLevel:found.activityLevel??defaultLevel,dailyCalories:defaultDaily??found.dailyCalories } : emptyRecord(date, dailyDefaults)); setLoadedDate(date) } }); return () => { active = false } }, [date, defaultHeight, defaultWeight,defaultAge,defaultSex,defaultResting,defaultLevel,defaultDaily])
  const update = async (patch: Partial<DailyRecord>) => {
    const next = { ...record, ...patch, updatedAt: new Date().toISOString() }
    setRecord(next); await saveRecord(next); onSaved(); setSaved(true)
    clearTimeout(savedTimer.current); savedTimer.current = window.setTimeout(() => setSaved(false), 1500)
  }
  return { record, update, ready: loadedDate === date, saved }
}
