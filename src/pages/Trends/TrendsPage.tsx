import { format, parseISO } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyRecord } from '../../types/record'
import { calculateCalorieDeficit, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { calculateTrendPeriod, type PeriodStats, type TrendRange } from '../../lib/statistics'

type Metric = 'weight'|'deficit'|'exercise'|'steps'|'intake'|'protein'|'sleep'|'waist'
const ranges: TrendRange[] = [7, 30, 90, 'all']
const metrics: Array<[Metric,string,string]> = [['weight','体重','kg'],['deficit','热量缺口','kcal'],['exercise','运动','kcal'],['steps','步数','步'],['intake','摄入','kcal'],['protein','蛋白质','g'],['sleep','睡眠','h'],['waist','腰围','cm']]

function getValue(record: DailyRecord, metric: Metric) {
  switch (metric) {
    case 'weight': return record.weightKg
    case 'deficit': return calculateCalorieDeficit(record)
    case 'exercise': return getExerciseCalories(record) ?? 0
    case 'steps': return record.stepCount
    case 'intake': return getFoodCalories(record)
    case 'protein': return getProteinGrams(record)
    case 'sleep': return record.sleepHours
    case 'waist': return record.waistCm
  }
}

const TrendDot = ({cx,cy}:{cx?:number;cy?:number}) => cx==null||cy==null?null:<g className="trend-node"><circle className="trend-node-hit" cx={cx} cy={cy} r="14"/><circle className="trend-node-dot" cx={cx} cy={cy} r="4"/></g>
const Stat = ({ label, value, unit, digits=0 }: {label:string;value?:number;unit:string;digits?:number}) => <div className="stat-item"><span>{label}</span><strong>{value == null ? '—' : value.toFixed(digits)} <small>{value != null && unit}</small></strong></div>

function StatsCard({ range, stats }: { range: TrendRange; stats: PeriodStats }) {
  const totalDeficit = stats.totalDeficit
  const balanceLabel = totalDeficit != null && totalDeficit < 0 ? '热量盈余' : '热量缺口'

  return <section className="stats-card" aria-labelledby="trend-summary-title">
    <div className="section-heading">
      <div><span>截至昨天</span><h2 id="trend-summary-title">{range === 'all' ? '全部记录' : `近${range}天`}</h2></div>
      <em>{stats.totalDays === 0 ? '暂无完整日' : `${stats.recordedDays} / ${stats.totalDays} 天`}</em>
    </div>
    <div className="stats-grid">
      <Stat label="平均体重" value={stats.averageWeight} unit="kg" digits={1}/>
      <Stat label="体重变化" value={stats.weightChange} unit="kg" digits={1}/>
      <Stat label="平均缺口" value={stats.averageDeficit} unit="kcal" digits={1}/>
      <Stat label="平均运动" value={stats.averageExercise} unit="kcal" digits={1}/>
      <Stat label={balanceLabel} value={totalDeficit == null ? undefined : Math.abs(totalDeficit)} unit="kcal" digits={1}/>
      <Stat label="总运动消耗" value={stats.totalExercise} unit="kcal" digits={1}/>
      <Stat label="有氧消耗" value={stats.totalAerobic} unit="kcal" digits={1}/>
      <Stat label="无氧消耗" value={stats.totalAnaerobic} unit="kcal" digits={1}/>
      <Stat label="平均摄入" value={stats.averageIntake} unit="kcal" digits={1}/>
      <Stat label="平均蛋白质" value={stats.averageProtein} unit="g" digits={1}/>
    </div>
  </section>
}

export function TrendsPage({ records,referenceDate }: {records:DailyRecord[];referenceDate:string}) {
  const [range, setRange] = useState<TrendRange>(30)
  const [metric, setMetric] = useState<Metric>('weight')
  const pickerRef=useRef<HTMLDivElement>(null)
  const selectedMeta=metrics.find(m=>m[0]===metric)!
  const { records: rangeRecords, stats } = useMemo(
    () => calculateTrendPeriod(records, range, parseISO(referenceDate)),
    [records, range, referenceDate],
  )
  const data = useMemo(() => rangeRecords.flatMap(record => {
    const value = getValue(record, metric)
    return value == null ? [] : [{ date: record.date, label: format(parseISO(record.date), 'M/d'), value }]
  }), [rangeRecords, metric])
  useEffect(()=>{const active=pickerRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');active?.scrollIntoView({block:'nearest',inline:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[metric])
  return <main className="page trends-page"><header className="page-header"><div><p className="eyebrow">看见长期变化</p><h1>趋势</h1></div><div className="trend-count">{data.length}<span>条记录</span></div></header>
    <div className="segmented" role="group" aria-label="趋势时间范围">
      {ranges.map(option => <button key={option} type="button" aria-pressed={range === option} className={range === option ? 'active' : ''} onClick={() => setRange(option)}>{option === 'all' ? '全部' : `${option}天`}</button>)}
    </div>
    <div ref={pickerRef} className="metric-picker" role="group" aria-label="趋势指标">{metrics.map(([id,label])=><button key={id} aria-pressed={metric===id} className={metric===id?'active':''} onClick={()=>setMetric(id)}>{label}</button>)}</div>
    <section className="chart-card"><div className="section-heading"><div><span>趋势图</span><h2>{selectedMeta[1]}趋势</h2></div><em>{selectedMeta[2]}</em></div>{data.length>1?<div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart accessibilityLayer data={data} margin={{top:15,right:5,left:-25,bottom:0}}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.32}/><stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} minTickGap={25}/><YAxis domain={['auto','auto']} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/><Tooltip trigger="click" cursor={{stroke:'var(--accent)',strokeOpacity:.28,strokeWidth:1}} contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)',boxShadow:'var(--shadow)'}} labelStyle={{color:'var(--muted)',fontSize:11,marginBottom:4}} labelFormatter={(_,payload)=>{const date=payload[0]?.payload?.date;return date?format(parseISO(String(date)),'yyyy年M月d日'):''}} formatter={(value)=>[`${Number(value).toLocaleString(undefined,{maximumFractionDigits:2})} ${selectedMeta[2]}`,selectedMeta[1]]}/>{metric==='deficit'&&<ReferenceLine y={0} stroke="var(--muted)"/>}<Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} fill="url(#trendFill)" dot={<TrendDot/>} activeDot={{r:6,fill:'var(--accent)',stroke:'var(--card)',strokeWidth:3}}/></AreaChart></ResponsiveContainer></div>:<div className="chart-empty"><div className="empty-line"/><p>至少需要 2 条记录</p></div>}</section>
    <StatsCard range={range} stats={stats}/>
  </main>
}
