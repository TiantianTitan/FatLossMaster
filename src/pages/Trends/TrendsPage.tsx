import { format, isAfter, parseISO, subDays, subMonths } from 'date-fns'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyRecord } from '../../types/record'
import { calculateCalorieDeficit, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { calculateMonthlyStats, calculateWeeklyStats, type PeriodStats } from '../../lib/statistics'

type Range = '7'|'30'|'90'|'all'; type Metric = 'weight'|'waist'|'intake'|'deficit'|'protein'|'sleep'
const ranges: Array<[Range,string]> = [['7','7天'],['30','30天'],['90','3个月'],['all','全部']]
const metrics: Array<[Metric,string,string]> = [['weight','体重','kg'],['waist','腰围','cm'],['intake','摄入','kcal'],['deficit','热量缺口','kcal'],['protein','蛋白质','g'],['sleep','睡眠','h']]
const getValue = (r: DailyRecord, metric: Metric) => metric==='weight'?r.weightKg:metric==='waist'?r.waistCm:metric==='intake'?getFoodCalories(r):metric==='deficit'?calculateCalorieDeficit(r):metric==='protein'?getProteinGrams(r):r.sleepHours
const Stat = ({ label, value, unit, digits=0 }: {label:string;value?:number;unit:string;digits?:number}) => <div className="stat-item"><span>{label}</span><strong>{value == null ? '—' : value.toFixed(digits)} <small>{value != null && unit}</small></strong></div>
function StatsCard({ title, stats, monthly=false }: {title:string;stats:PeriodStats;monthly?:boolean}) { return <section className="stats-card"><div className="section-heading"><div><span>摘要</span><h2>{title}</h2></div><em>{stats.recordedDays} / {stats.totalDays} 天</em></div><div className="stats-grid"><Stat label="平均体重" value={stats.averageWeight} unit="kg" digits={1}/><Stat label="体重变化" value={stats.weightChange} unit="kg" digits={1}/><Stat label="平均腰围" value={stats.averageWaist} unit="cm" digits={1}/><Stat label="平均摄入" value={stats.averageIntake} unit="kcal" digits={1}/><Stat label="平均缺口" value={stats.averageDeficit} unit="kcal" digits={1}/><Stat label="平均蛋白质" value={stats.averageProtein} unit="g" digits={1}/><Stat label="平均睡眠" value={stats.averageSleep} unit="h" digits={1}/>{monthly&&<><Stat label="月初体重" value={stats.startWeight} unit="kg" digits={1}/><Stat label="当前体重" value={stats.currentWeight} unit="kg" digits={1}/></>}</div></section> }

export function TrendsPage({ records }: {records:DailyRecord[]}) {
  const [range,setRange]=useState<Range>('30'),[metric,setMetric]=useState<Metric>('weight'),[now]=useState(()=>new Date())
  const selectedMeta=metrics.find(m=>m[0]===metric)!
  const data=useMemo(()=>{const cutoff=range==='all'?null:range==='90'?subMonths(now,3):subDays(now,Number(range)-1); return records.filter(r=>!cutoff||isAfter(parseISO(r.date),cutoff)).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({date:r.date,label:format(parseISO(r.date),'M/d'),value:getValue(r,metric)})).filter(r=>r.value!=null)},[records,range,metric,now])
  const weekly=calculateWeeklyStats(records), monthly=calculateMonthlyStats(records)
  return <main className="page trends-page"><header className="page-header"><div><p className="eyebrow">看见长期变化</p><h1>趋势</h1></div><div className="trend-count">{data.length}<span>个数据点</span></div></header>
    <div className="segmented">{ranges.map(([id,label])=><button key={id} className={range===id?'active':''} onClick={()=>setRange(id)}>{label}</button>)}</div>
    <div className="metric-picker">{metrics.map(([id,label])=><button key={id} className={metric===id?'active':''} onClick={()=>setMetric(id)}>{label}</button>)}</div>
    <section className="chart-card"><div className="section-heading"><div><span>趋势图</span><h2>{selectedMeta[1]}趋势</h2></div><em>{selectedMeta[2]}</em></div>{data.length>1?<div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:15,right:5,left:-25,bottom:0}}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.32}/><stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5"/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}} minTickGap={25}/><YAxis domain={['auto','auto']} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--line)',borderRadius:14,color:'var(--text)'}} formatter={(value)=>[`${Number(value).toFixed(1)} ${selectedMeta[2]}`,selectedMeta[1]]}/>{metric==='deficit'&&<ReferenceLine y={0} stroke="var(--muted)"/>}<Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={3} fill="url(#trendFill)" activeDot={{r:5,fill:'var(--accent)',stroke:'var(--card)',strokeWidth:3}}/></AreaChart></ResponsiveContainer></div>:<div className="chart-empty"><div className="empty-line"/><p>至少记录两天{selectedMeta[1]}数据后，这里会出现趋势。</p></div>}</section>
    <StatsCard title="本周" stats={weekly}/><StatsCard title={`${now.getMonth()+1}月`} stats={monthly} monthly/>
  </main>
}
