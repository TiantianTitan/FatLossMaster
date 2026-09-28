import { useEffect, useRef, useState } from 'react'
import { getRecordByDate, saveRecord } from '../db/records'
import type { DailyRecord } from '../types/record'
import { hydrateDailyRecord } from '../lib/recordDefaults'

const emptyRecord = (date: string, defaults?: Partial<DailyRecord>): DailyRecord => { const now = new Date().toISOString(); return { ...defaults, id: crypto.randomUUID(), date, createdAt: now, updatedAt: now } }

export function useDailyRecord(date: string, onSaved: () => void, defaults?: Partial<DailyRecord>) {
  const [record, setRecord] = useState<DailyRecord>(() => emptyRecord(date, defaults))
  const recordRef = useRef(record)
  const defaultResting=defaults?.restingCalories,defaultLevel=defaults?.activityLevel,defaultDaily=defaults?.dailyCalories
  const [loadedDate, setLoadedDate] = useState<string>()
  const [saved, setSaved] = useState(false)
  const [saveError,setSaveError]=useState(''),[loadError,setLoadError]=useState(''),[loadVersion,setLoadVersion]=useState(0)
  const savedTimer = useRef<number>(undefined)
  const updateVersion=useRef(0)
  useEffect(()=>{recordRef.current=record},[record])
  useEffect(()=>()=>clearTimeout(savedTimer.current),[])
  useEffect(() => { let active = true;const energyDefaults={restingCalories:defaultResting,activityLevel:defaultLevel,dailyCalories:defaultDaily}; getRecordByDate(date).then(found => { if (active) { const next=hydrateDailyRecord(found??emptyRecord(date),energyDefaults);recordRef.current=next;setLoadError('');setRecord(next); setLoadedDate(date) } }).catch(()=>{if(active){setLoadError('无法读取这天的记录');setLoadedDate(undefined)}}); return () => { active = false } }, [date,defaultResting,defaultLevel,defaultDaily,loadVersion])
  const update = async (patch: Partial<DailyRecord>, options: {silent?:boolean} = {}) => {
    const previous=recordRef.current
    const next = { ...previous, ...patch, updatedAt: new Date().toISOString() }
    const version=++updateVersion.current
    recordRef.current=next;setRecord(next);setSaveError('');if(options.silent){clearTimeout(savedTimer.current);setSaved(false)}
    try{await saveRecord(next);onSaved();if(!options.silent){setSaved(true);clearTimeout(savedTimer.current);savedTimer.current=window.setTimeout(()=>setSaved(false),1500)}return true}
    catch{if(version===updateVersion.current){recordRef.current=previous;setRecord(previous);setSaved(false);setSaveError('保存失败，请重试')}return false}
  }
  return { record, update, ready: loadedDate === date, saved, saveError, loadError, retryLoad:()=>{setLoadError('');setLoadedDate(undefined);setLoadVersion(version=>version+1)} }
}
