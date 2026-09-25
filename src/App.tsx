import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { ActivityEntry, BodyProfile, DailyRecord, DetailMetric, FoodEntry, Page, RecordSection } from './types/record'
import { getAllRecords, saveRecord } from './db/records'
import { todayKey } from './lib/date'
import { useTheme } from './hooks/useTheme'
import { TabBar } from './components/ui/TabBar'
import { TodayPage } from './pages/Today/TodayPage'
import { estimateDailyActivityCalories, estimateRestingCalories } from './lib/calculations'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch } from './lib/entries'
import { DEFAULT_ACTIVITY_LEVEL, DEFAULT_RESTING_CALORIES, defaultsForDate, resolveEnergyDefaults } from './lib/recordDefaults'
import { DemographicSetup } from './components/forms/DemographicSetup'
import { MetricDetailPage } from './pages/Detail/MetricDetailPage'
const RecordsPage = lazy(() => import('./pages/Records/RecordsPage').then(module => ({ default: module.RecordsPage })))
const TrendsPage = lazy(() => import('./pages/Trends/TrendsPage').then(module => ({ default: module.TrendsPage })))
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(module => ({ default: module.SettingsPage })))

export default function App() {
  const [page,setPage]=useState<Page>('today'),[records,setRecords]=useState<DailyRecord[]>([]),[loaded,setLoaded]=useState(false)
  const [recordDate,setRecordDate]=useState(todayKey()),[recordSection,setRecordSection]=useState<RecordSection>(),[detailMetric,setDetailMetric]=useState<DetailMetric>(),[loadError,setLoadError]=useState(''); const {theme,setTheme}=useTheme()
  const reload=useCallback(()=>{getAllRecords().then(items=>{setLoadError('');setRecords(items.sort((a,b)=>a.date.localeCompare(b.date)));setLoaded(true)}).catch(()=>{setLoadError('无法读取本机数据');setLoaded(true)})},[])
  useEffect(reload,[reload])
  useEffect(()=>{if(!loaded||loadError)return;const frame=requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));return()=>cancelAnimationFrame(frame)},[page,detailMetric,loaded,loadError])
  const resolvedRecords=useMemo(()=>resolveEnergyDefaults(records),[records])
  const openToday=(section?:RecordSection)=>{setDetailMetric(undefined);setRecordDate(todayKey());setRecordSection(section);setPage('records')}
  const changePage=(next:Page)=>{setDetailMetric(undefined);setRecordSection(undefined);setPage(next)}
  const rawToday=records.find(r=>r.date===todayKey()),today=resolvedRecords.find(r=>r.date===todayKey())
  const descending=[...records].reverse()
  const bodyDefaults:BodyProfile={heightCm:rawToday?.heightCm??descending.find(r=>r.heightCm!=null)?.heightCm,weightKg:rawToday?.weightKg??descending.find(r=>r.weightKg!=null)?.weightKg,waistCm:rawToday?.waistCm??descending.find(r=>r.waistCm!=null)?.waistCm,ageYears:rawToday?.ageYears??descending.find(r=>r.ageYears!=null)?.ageYears,sex:rawToday?.sex??descending.find(r=>r.sex!=null)?.sex}
  const dailyDefaults:Partial<DailyRecord>={...defaultsForDate(records,todayKey()),...bodyDefaults}
  const todayView:DailyRecord=today??{...dailyDefaults,id:'today-preview',date:todayKey(),createdAt:'',updatedAt:''} as DailyRecord
  const updateTodayBody=async(body:BodyProfile)=>{const now=new Date().toISOString();const resting=rawToday?.restingMode==='manual'&&rawToday.restingCalories?rawToday.restingCalories:estimateRestingCalories(body.weightKg,body.heightCm,body.ageYears,body.sex)??DEFAULT_RESTING_CALORIES;const activityLevel=rawToday?.activityLevel??DEFAULT_ACTIVITY_LEVEL;const next:DailyRecord={...(rawToday??{...dailyDefaults,id:crypto.randomUUID(),date:todayKey(),createdAt:now,updatedAt:now}),...body,restingCalories:resting,restingMode:rawToday?.restingMode??'auto',activityLevel,dailyCalories:estimateDailyActivityCalories(resting,activityLevel),updatedAt:now};await saveRecord(next);reload()}
  const baseTodayRecord=()=>{const now=new Date().toISOString();return today??{...dailyDefaults,id:crypto.randomUUID(),date:todayKey(),createdAt:now,updatedAt:now} as DailyRecord}
  const quickAddFood=async(entry:FoodEntry)=>{const base=baseTodayRecord();await saveRecord({...base,...foodEntryPatch([...foodEntriesFor(base),entry]),updatedAt:new Date().toISOString()});reload()}
  const quickAddActivity=async(entry:ActivityEntry)=>{const base=baseTodayRecord();await saveRecord({...base,...activityEntryPatch([...activityEntriesFor(base),entry]),updatedAt:new Date().toISOString()});reload()}
  return <div className="app-shell"><div className="ambient ambient-one"/><div className="ambient ambient-two"/>{!loaded?<div className="app-loader"><img src="/icon.svg" alt=""/><span>轻衡</span></div>:loadError?<div className="app-loader app-error"><img src="/icon.svg" alt=""/><strong>{loadError}</strong><button type="button" onClick={()=>{setLoaded(false);reload()}}>重试</button></div>:<>{detailMetric?<MetricDetailPage metric={detailMetric} record={todayView} records={resolvedRecords} bodyDefaults={bodyDefaults} onBack={()=>setDetailMetric(undefined)} onEdit={openToday} onUpdateBody={updateTodayBody}/>:<><Suspense fallback={<div className="app-loader compact-loader"><img src="/icon.svg" alt=""/><span>正在打开…</span></div>}>{page==='today'&&<TodayPage record={todayView} records={records} hasRecord={Boolean(rawToday)} bodyDefaults={bodyDefaults} onQuickAddFood={quickAddFood} onQuickAddActivity={quickAddActivity} onOpenRecord={()=>openToday()} onOpenDetail={setDetailMetric}/>} {page==='records'&&<RecordsPage key={recordDate} initialDate={recordDate} focusTarget={recordSection} records={records} onRecordsChange={reload}/>} {page==='trends'&&<TrendsPage records={resolvedRecords}/>} {page==='settings'&&<SettingsPage records={resolvedRecords} bodyDefaults={bodyDefaults} onUpdateBody={updateTodayBody} theme={theme} setTheme={setTheme} onRecordsChange={reload}/>}</Suspense><TabBar page={page} onChange={changePage}/></>}{(!bodyDefaults.ageYears||!bodyDefaults.sex)&&<DemographicSetup initialAge={bodyDefaults.ageYears} initialSex={bodyDefaults.sex} onSave={({ageYears,sex})=>updateTodayBody({...bodyDefaults,ageYears,sex})}/>}</>}</div>
}
