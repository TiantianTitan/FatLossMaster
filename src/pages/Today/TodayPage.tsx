import { ArrowUpRight, Dumbbell, Pencil } from 'lucide-react'
import type { DailyRecord } from '../../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { displayDate, todayKey } from '../../lib/date'

const Value = ({ value, unit }: { value?: number; unit: string }) => <strong>{value == null ? '—' : value.toLocaleString()} {value != null && <small>{unit}</small>}</strong>

export function TodayPage({ record, onEdit }: { record?: DailyRecord; onEdit: () => void }) {
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
      <article className="metric-card"><span>体重</span><Value value={record?.weightKg} unit="kg"/><small>BMI {calculateBMI(record?.weightKg, record?.heightCm)?.toFixed(1) ?? '—'}</small></article>
      <article className="metric-card wide"><div className="metric-icon"><Dumbbell size={20}/></div><div><span>额外运动</span><Value value={getExerciseCalories(record)} unit="kcal"/></div><div className="mini-bars"><i/><i/><i/><i/><i/></div></article>
    </section>
    {!hasData && <div className="empty-note"><span>从今天开始</span><p>你的第一条记录还在等你，通常只需要一分钟。</p></div>}
    <button className="primary-button" onClick={onEdit}><Pencil size={18}/>{hasData ? '编辑今日记录' : '记录今天'}</button>
  </main>
}
