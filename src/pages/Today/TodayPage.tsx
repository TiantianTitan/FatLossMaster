import { ArrowUpRight, Dumbbell, Pencil, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { BodyProfile, DailyRecord } from '../../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { displayDate, todayKey } from '../../lib/date'
import { Modal } from '../../components/ui/Modal'
import { DecimalInput } from '../../components/ui/DecimalInput'

const Value = ({ value, unit }: { value?: number; unit: string }) => <strong>{value == null ? '—' : value.toLocaleString()} {value != null && <small>{unit}</small>}</strong>

export function TodayPage({ record, bodyDefaults, onUpdateBody, onEdit }: { record?: DailyRecord; bodyDefaults: BodyProfile; onUpdateBody: (body: BodyProfile) => Promise<void>; onEdit: () => void }) {
  const [editingBody,setEditingBody]=useState(false)
  const deficit = calculateCalorieDeficit(record), total = calculateTotalCalories(record), hasData = Boolean(record)
  return <main className="page today-page">
    <header className="page-header"><div><p className="eyebrow">{displayDate(todayKey())}</p><h1>今天</h1></div><div className="day-mark">{new Date().getDate()}</div></header>
    <section className={`hero-card ${deficit != null && deficit < 0 ? 'surplus' : ''}`}>
      <div className="hero-orbit"/><p>{deficit == null ? '今日热量结余' : deficit >= 0 ? '今日热量缺口' : '今日热量盈余'}</p>
      <div className="hero-number">{deficit == null ? '—' : Math.abs(deficit).toLocaleString()}<span>kcal</span></div>
      <div className="hero-caption">{deficit == null ? '记录膳食和消耗后自动计算' : deficit >= 0 ? '消耗高于摄入' : '摄入高于消耗'}</div>
      <div className="energy-row"><div><span>摄入</span><Value value={getFoodCalories(record)} unit="kcal"/></div><ArrowUpRight size={20}/><div><span>消耗</span><Value value={total || undefined} unit="kcal"/></div></div>
    </section>
    <section className="metric-grid">
      <article className="metric-card accent"><span>蛋白质</span><Value value={getProteinGrams(record)} unit="g"/><i>PROTEIN</i></article>
      <button className="metric-card body-card" onClick={()=>setEditingBody(true)}><span>当前身体数据</span><Value value={bodyDefaults.weightKg} unit="kg"/><small>身高 {bodyDefaults.heightCm?.toLocaleString()??'—'} cm · BMI {calculateBMI(bodyDefaults.weightKg, bodyDefaults.heightCm)?.toFixed(1) ?? '—'}</small></button>
      <article className="metric-card wide"><div className="metric-icon"><Dumbbell size={20}/></div><div><span>额外运动</span><Value value={getExerciseCalories(record)} unit="kcal"/></div><div className="mini-bars"><i/><i/><i/><i/><i/></div></article>
    </section>
    {!hasData && <div className="empty-note"><span>从今天开始</span><p>你的第一条记录还在等你，通常只需要一分钟。</p></div>}
    <button className="primary-button" onClick={onEdit}><Pencil size={18}/>{hasData ? '编辑今日记录' : '记录今天'}</button>
    {editingBody&&<BodyEditor value={bodyDefaults} onClose={()=>setEditingBody(false)} onSave={async body=>{await onUpdateBody(body);setEditingBody(false)}}/>}
  </main>
}

function BodyEditor({value,onSave,onClose}:{value:BodyProfile;onSave:(body:BodyProfile)=>Promise<void>;onClose:()=>void}){
  const [heightCm,setHeight]=useState(value.heightCm),[weightKg,setWeight]=useState(value.weightKg),[saving,setSaving]=useState(false)
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(heightCm==null&&weightKg==null)return;setSaving(true);await onSave({heightCm,weightKg})}
  return <Modal title="当前身体数据" onClose={onClose}><form className="entry-form body-editor" onSubmit={submit}><div className="profile-note"><UserRound size={20}/><p>保存后默认记录到今天，以后会沿用最近一次数据，无需每天重复填写。</p></div><label><span>身高</span><span className="unit-input"><DecimalInput value={heightCm} onValueChange={setHeight} placeholder="175"/><small>cm</small></span></label><label><span>体重</span><span className="unit-input"><DecimalInput value={weightKg} onValueChange={setWeight} placeholder="75,25"/><small>kg</small></span></label><button className="primary-button" disabled={saving}>{saving?'保存中…':'保存到今天'}</button></form></Modal>
}
