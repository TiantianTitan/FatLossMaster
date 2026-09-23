import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import type { DailyRecord, Page } from './types/record'
import { getAllRecords } from './db/records'
import { todayKey } from './lib/date'
import { useTheme } from './hooks/useTheme'
import { TabBar } from './components/ui/TabBar'
import { TodayPage } from './pages/Today/TodayPage'
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
  return <div className="app-shell"><div className="ambient ambient-one"/><div className="ambient ambient-two"/>{!loaded?<div className="app-loader"><img src="/icon.svg"/><span>轻衡</span></div>:<><Suspense fallback={<div className="app-loader"><img src="/icon.svg"/><span>正在打开…</span></div>}>{page==='today'&&<TodayPage record={today} onEdit={openToday}/>} {page==='records'&&<RecordsPage key={recordDate} initialDate={recordDate} records={records} onRecordsChange={reload}/>} {page==='trends'&&<TrendsPage records={records}/>} {page==='settings'&&<SettingsPage records={records} theme={theme} setTheme={setTheme} onRecordsChange={reload}/>}</Suspense><TabBar page={page} onChange={setPage}/></>}</div>
}
