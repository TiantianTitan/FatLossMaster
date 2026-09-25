import { ArrowUpRight, ChevronRight, Dumbbell, Footprints, Gauge, Moon, Pencil, Plus, Utensils } from 'lucide-react'
import { useState } from 'react'
import type { ActivityEntry, BodyProfile, DailyRecord, DetailMetric, FoodEntry } from '../../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, getDailyActivityCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { displayDate, todayKey } from '../../lib/date'
import { EntryEditor, type Entry, type EntryKind } from '../../components/forms/EntrySection'
import { Toast } from '../../components/ui/Toast'
import { recentActivityEntriesFor, recentFoodEntriesFor } from '../../lib/entries'

const Value = ({ value, unit }: { value?: number; unit: string }) => <strong>{value == null ? '—' : value.toLocaleString()} {value != null && <small>{unit}</small>}</strong>

export function TodayPage({ record, records, hasRecord, bodyDefaults, onQuickAddFood, onQuickAddActivity, onOpenRecord, onOpenDetail }: { record?: DailyRecord; records:DailyRecord[]; hasRecord:boolean; bodyDefaults: BodyProfile; onQuickAddFood: (entry:FoodEntry)=>Promise<void>; onQuickAddActivity:(entry:ActivityEntry)=>Promise<void>; onOpenRecord: () => void; onOpenDetail:(metric:DetailMetric)=>void }) {
  const [quickKind,setQuickKind]=useState<EntryKind>()
  const [message,setMessage]=useState('')
  const deficit = calculateCalorieDeficit(record), total = calculateTotalCalories(record), hasData = hasRecord
  const bodyIncomplete=bodyDefaults.heightCm==null||bodyDefaults.weightKg==null
  const saveQuick=async(entry:Entry)=>{if(quickKind==='food')await onQuickAddFood(entry as FoodEntry);else await onQuickAddActivity(entry as ActivityEntry);setMessage(quickKind==='food'?'进食已记入今天':'运动已记入今天');setQuickKind(undefined);window.setTimeout(()=>setMessage(''),1800)}
  return <main className="page today-page">
    <header className="page-header"><div><p className="eyebrow">{displayDate(todayKey())}</p><h1>今天</h1></div><div className="day-mark">{new Date().getDate()}</div></header>
    <section className={`hero-card ${deficit != null && deficit < 0 ? 'surplus' : ''}`}>
      <div className="hero-orbit"/><div className="hero-label-row"><p>{deficit == null ? '今日热量结余' : deficit >= 0 ? '今日热量缺口' : '今日热量盈余'}</p><span>进行中</span></div>
      <div className="hero-number">{deficit == null ? '—' : Math.abs(deficit).toLocaleString()}<span>kcal</span></div>
      <div className="energy-row"><div><span>摄入</span><Value value={getFoodCalories(record)} unit="kcal"/></div><ArrowUpRight size={20}/><div><span>消耗</span><Value value={total || undefined} unit="kcal"/></div></div>
      <button type="button" className="hero-open" aria-label="查看热量缺口详情" onClick={()=>onOpenDetail('deficit')}/>
    </section>
    <section className="quick-add-grid" aria-label="快速记录"><button onClick={()=>setQuickKind('food')}><span className="quick-icon food"><Utensils size={19}/></span><span><strong>记录进食</strong><small>热量与蛋白质</small></span><Plus size={18}/></button><button onClick={()=>setQuickKind('activity')}><span className="quick-icon exercise"><Dumbbell size={19}/></span><span><strong>记录运动</strong><small>额外活动消耗</small></span><Plus size={18}/></button></section>
    <section className="metric-grid">
      <button type="button" className="metric-card accent" onClick={()=>onOpenDetail('protein')}><span>蛋白质</span><Value value={getProteinGrams(record)} unit="g"/><i>PROTEIN</i><ChevronRight className="card-disclosure" size={16}/></button>
      <button type="button" className="metric-card body-card" onClick={()=>onOpenDetail('weight')}><span className="metric-card-title">当前体重{bodyIncomplete&&<em>待完善</em>}</span><Value value={bodyDefaults.weightKg} unit="kg"/><small>身高 {bodyDefaults.heightCm?.toLocaleString()??'—'} cm · BMI {calculateBMI(bodyDefaults.weightKg, bodyDefaults.heightCm)?.toFixed(1) ?? '—'}</small><ChevronRight className="card-disclosure" size={16}/></button>
      <button type="button" className="metric-card compact" onClick={()=>onOpenDetail('exercise')}><span className="metric-symbol"><Dumbbell size={17}/></span><span>运动</span><Value value={getExerciseCalories(record)} unit="kcal"/><ChevronRight className="card-disclosure" size={16}/></button>
      <button type="button" className="metric-card compact sleep-card" onClick={()=>onOpenDetail('sleep')}><span className="metric-symbol"><Moon size={17}/></span><span>睡眠</span><Value value={record?.sleepHours} unit="h"/><ChevronRight className="card-disclosure" size={16}/></button>
      <button type="button" className="metric-card compact" onClick={()=>onOpenDetail('steps')}><span className="metric-symbol"><Footprints size={17}/></span><span>步数</span><Value value={record?.stepCount} unit="步"/><ChevronRight className="card-disclosure" size={16}/></button>
      <button type="button" className="metric-card compact" onClick={()=>onOpenDetail('daily')}><span className="metric-symbol"><Gauge size={17}/></span><span>日常消耗</span><Value value={getDailyActivityCalories(record)} unit="kcal"/><ChevronRight className="card-disclosure" size={16}/></button>
    </section>
    {!hasData && <div className="empty-note"><span>从今天开始记录</span></div>}
    <button className="primary-button" onClick={()=>onOpenRecord()}><Pencil size={18}/>{hasData ? '查看今日明细' : '设置今日活动'}</button>
    {quickKind&&<EntryEditor
      kind={quickKind}
      entry={null}
      recentEntries={quickKind==='food'?recentFoodEntriesFor(records):recentActivityEntriesFor(records)}
      onSave={saveQuick}
      onClose={()=>setQuickKind(undefined)}
    />}
    {message&&<Toast>{message}</Toast>}
  </main>
}
