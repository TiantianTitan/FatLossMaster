import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { ActivityEntry, BodyProfile, DailyRecord, FoodEntry, Page } from './types/record'
import { getAllRecords, saveRecord } from './db/records'
import { todayKey } from './lib/date'
import { useTheme } from './hooks/useTheme'
import { TabBar } from './components/ui/TabBar'
import { TodayPage } from './pages/Today/TodayPage'
import { estimateDailyActivityCalories, estimateRestingCalories } from './lib/calculations'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch } from './lib/entries'
const RecordsPage = lazy(() => import('./pages/Records/RecordsPage').then(module => ({ default: module.RecordsPage })))
const TrendsPage = lazy(() => import('./pages/Trends/TrendsPage').then(module => ({ default: module.TrendsPage })))
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(module => ({ default: module.SettingsPage })))

export default function App() {
  const [page,setPage]=useState<Page>('today'),[records,setRecords]=useState<DailyRecord[]>([]),[loaded,setLoaded]=useState(false)
  const [recordDate,setRecordDate]=useState(todayKey()); const {theme,setTheme}=useTheme()
  const reload=useCallback(()=>{getAllRecords().then(items=>{setRecords(items.sort((a,b)=>a.date.localeCompare(b.date)));setLoaded(true)})},[])
  useEffect(reload,[reload])
  const openToday=()=>{setRecordDate(todayKey());setPage('records')}
  const today=records.find(r=>r.date===todayKey())
  const descending=[...records].reverse()
  const bodyDefaults:BodyProfile={heightCm:today?.heightCm??descending.find(r=>r.heightCm!=null)?.heightCm,weightKg:today?.weightKg??descending.find(r=>r.weightKg!=null)?.weightKg,waistCm:today?.waistCm??descending.find(r=>r.waistCm!=null)?.waistCm}
  const latestActivity=descending.find(r=>r.activityLevel!=null),defaultResting=estimateRestingCalories(bodyDefaults.weightKg),defaultLevel=today?.activityLevel??latestActivity?.activityLevel
  const dailyDefaults:Partial<DailyRecord>={heightCm:bodyDefaults.heightCm,weightKg:bodyDefaults.weightKg,restingCalories:today?.restingCalories??defaultResting,restingMode:today?.restingMode??'auto',activityLevel:defaultLevel,dailyCalories:today?.dailyCalories??estimateDailyActivityCalories(today?.restingCalories??defaultResting,defaultLevel)}
  const updateTodayBody=async(body:BodyProfile)=>{const now=new Date().toISOString();const resting=today?.restingMode==='manual'?today.restingCalories:estimateRestingCalories(body.weightKg);const next:DailyRecord={...(today??{...dailyDefaults,id:crypto.randomUUID(),date:todayKey(),createdAt:now,updatedAt:now}),...body,restingCalories:resting,restingMode:today?.restingMode??'auto',updatedAt:now};if(next.activityLevel)next.dailyCalories=estimateDailyActivityCalories(resting,next.activityLevel);await saveRecord(next);reload()}
  const baseTodayRecord=()=>{const now=new Date().toISOString();return today??{...dailyDefaults,id:crypto.randomUUID(),date:todayKey(),createdAt:now,updatedAt:now} as DailyRecord}
  const quickAddFood=async(entry:FoodEntry)=>{const base=baseTodayRecord();await saveRecord({...base,...foodEntryPatch([...foodEntriesFor(base),entry]),updatedAt:new Date().toISOString()});reload()}
  const quickAddActivity=async(entry:ActivityEntry)=>{const base=baseTodayRecord();await saveRecord({...base,...activityEntryPatch([...activityEntriesFor(base),entry]),updatedAt:new Date().toISOString()});reload()}
  return <div className="app-shell"><div className="ambient ambient-one"/><div className="ambient ambient-two"/>{!loaded?<div className="app-loader"><img src="/icon.svg"/><span>轻衡</span></div>:<><Suspense fallback={<div className="app-loader compact-loader"><img src="/icon.svg"/><span>正在打开…</span></div>}>{page==='today'&&<TodayPage record={today} bodyDefaults={bodyDefaults} onQuickAddFood={quickAddFood} onQuickAddActivity={quickAddActivity} onEdit={openToday}/>} {page==='records'&&<RecordsPage key={recordDate} initialDate={recordDate} records={records} dailyDefaults={dailyDefaults} onRecordsChange={reload}/>} {page==='trends'&&<TrendsPage records={records}/>} {page==='settings'&&<SettingsPage records={records} bodyDefaults={bodyDefaults} onUpdateBody={updateTodayBody} theme={theme} setTheme={setTheme} onRecordsChange={reload}/>}</Suspense><TabBar page={page} onChange={setPage}/></>}</div>
}
