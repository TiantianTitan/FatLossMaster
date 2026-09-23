import { ArrowUpRight, Dumbbell, Moon, Pencil, Plus, Utensils } from 'lucide-react'
import { useState } from 'react'
import type { ActivityEntry, BodyProfile, DailyRecord, FoodEntry } from '../../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { displayDate, todayKey } from '../../lib/date'
import { EntryEditor, type Entry, type EntryKind } from '../../components/forms/EntrySection'
import { Toast } from '../../components/ui/Toast'

const Value = ({ value, unit }: { value?: number; unit: string }) => <strong>{value == null ? '—' : value.toLocaleString()} {value != null && <small>{unit}</small>}</strong>

export function TodayPage({ record, bodyDefaults, onQuickAddFood, onQuickAddActivity, onEdit }: { record?: DailyRecord; bodyDefaults: BodyProfile; onQuickAddFood: (entry:FoodEntry)=>Promise<void>; onQuickAddActivity:(entry:ActivityEntry)=>Promise<void>; onEdit: () => void }) {
  const [quickKind,setQuickKind]=useState<EntryKind>()
  const [message,setMessage]=useState('')
  const deficit = calculateCalorieDeficit(record), total = calculateTotalCalories(record), hasData = Boolean(record)
  const saveQuick=async(entry:Entry)=>{if(quickKind==='food')await onQuickAddFood(entry as FoodEntry);else await onQuickAddActivity(entry as ActivityEntry);setMessage(quickKind==='food'?'进食已记入今天':'运动已记入今天');setQuickKind(undefined);window.setTimeout(()=>setMessage(''),1800)}
  return <main className="page today-page">
    <header className="page-header"><div><p className="eyebrow">{displayDate(todayKey())}</p><h1>今天</h1></div><div className="day-mark">{new Date().getDate()}</div></header>
    <section className={`hero-card ${deficit != null && deficit < 0 ? 'surplus' : ''}`}>
      <div className="hero-orbit"/><p>{deficit == null ? '今日热量结余' : deficit >= 0 ? '今日热量缺口' : '今日热量盈余'}</p>
      <div className="hero-number">{deficit == null ? '—' : Math.abs(deficit).toLocaleString()}<span>kcal</span></div>
      <div className="hero-caption">{deficit == null ? '记录膳食和消耗后自动计算' : deficit >= 0 ? '消耗高于摄入' : '摄入高于消耗'}</div>
      <div className="energy-row"><div><span>摄入</span><Value value={getFoodCalories(record)} unit="kcal"/></div><ArrowUpRight size={20}/><div><span>消耗</span><Value value={total || undefined} unit="kcal"/></div></div>
    </section>
    <section className="quick-add-grid" aria-label="快速记录"><button onClick={()=>setQuickKind('food')}><span className="quick-icon food"><Utensils size={19}/></span><span><strong>记录进食</strong><small>热量与蛋白质</small></span><Plus size={18}/></button><button onClick={()=>setQuickKind('activity')}><span className="quick-icon exercise"><Dumbbell size={19}/></span><span><strong>记录运动</strong><small>额外活动消耗</small></span><Plus size={18}/></button></section>
    <section className="metric-grid">
      <article className="metric-card accent"><span>蛋白质</span><Value value={getProteinGrams(record)} unit="g"/><i>PROTEIN</i></article>
      <article className="metric-card body-card"><span>当前体重</span><Value value={bodyDefaults.weightKg} unit="kg"/><small>身高 {bodyDefaults.heightCm?.toLocaleString()??'—'} cm · BMI {calculateBMI(bodyDefaults.weightKg, bodyDefaults.heightCm)?.toFixed(1) ?? '—'}</small></article>
      <article className="metric-card compact"><span className="metric-symbol"><Dumbbell size={17}/></span><span>运动记录</span><Value value={getExerciseCalories(record)} unit="kcal"/><small>额外活动消耗</small></article>
      <article className="metric-card compact sleep-card"><span className="metric-symbol"><Moon size={17}/></span><span>睡眠时间</span><Value value={record?.sleepHours} unit="h"/><small>昨晚睡眠</small></article>
    </section>
    {!hasData && <div className="empty-note"><span>从今天开始</span><p>使用上方快捷按钮，几秒钟完成第一条记录。</p></div>}
    <button className="primary-button" onClick={onEdit}><Pencil size={18}/>{hasData ? '查看今日明细' : '设置今日活动'}</button>
    {quickKind&&<EntryEditor kind={quickKind} entry={null} onSave={saveQuick} onClose={()=>setQuickKind(undefined)}/>}
    {message&&<Toast>{message}</Toast>}
  </main>
}
