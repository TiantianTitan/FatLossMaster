import { ArrowLeft, Dumbbell, Flame, Footprints, Gauge, Moon, Pencil, Ruler, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BodyProfile, DailyRecord, DetailMetric, RecordSection } from '../../types/record'
import { activityLevels, calculateBMI, calculateCalorieDeficit, getDailyActivityCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { activityEntriesFor, foodEntriesFor } from '../../lib/entries'
import { relativeDateTitle, todayKey } from '../../lib/date'
import { BodyEditor } from '../../components/forms/BodyEditor'

type DetailMeta = { title:string; eyebrow:string; unit:string; icon:LucideIcon; section:RecordSection }

const detailMeta:Record<DetailMetric,DetailMeta> = {
  deficit:{ title:'热量缺口', eyebrow:'今日结果', unit:'kcal', icon:Flame, section:'summary' },
  protein:{ title:'蛋白质', eyebrow:'今日摄入', unit:'g', icon:Utensils, section:'food' },
  weight:{ title:'体重', eyebrow:'身体数据', unit:'kg', icon:Ruler, section:'summary' },
  exercise:{ title:'运动', eyebrow:'额外消耗', unit:'kcal', icon:Dumbbell, section:'activity' },
  sleep:{ title:'睡眠', eyebrow:'昨晚记录', unit:'h', icon:Moon, section:'sleep' },
  steps:{ title:'步数', eyebrow:'今日活动', unit:'步', icon:Footprints, section:'daily' },
  daily:{ title:'日常消耗', eyebrow:'活动档位', unit:'kcal', icon:Gauge, section:'daily' },
}

const metricValue = (metric:DetailMetric, record:DailyRecord, historical=false) => {
  if(metric==='deficit') return calculateCalorieDeficit(record)
  if(metric==='protein') return getProteinGrams(record)
  if(metric==='weight') return record.weightKg
  if(metric==='exercise') return getExerciseCalories(record) ?? (historical ? 0 : undefined)
  if(metric==='sleep') return record.sleepHours
  if(metric==='steps') return record.stepCount
  return getDailyActivityCalories(record)
}

const numberText = (value:number) => value.toLocaleString(undefined,{maximumFractionDigits:2})
const displayValue = (metric:DetailMetric,value:number) => metric==='deficit'
  ? `${value>=0?'缺口':'盈余'} ${numberText(Math.abs(value))}`
  : numberText(value)

function Sparkline({values}:{values:number[]}) {
  if(values.length<2)return <div className="detail-chart-empty"><span/>再记录 {2-values.length} 条即可查看趋势</div>
  const min=Math.min(...values),max=Math.max(...values),range=max-min||1
  const points=values.map((value,index)=>`${8+index*(304/(values.length-1))},${82-((value-min)/range)*68}`).join(' ')
  const last=points.split(' ').at(-1)!.split(',')
  return <svg className="detail-sparkline" viewBox="0 0 320 96" role="img" aria-label="近期趋势"><polyline points={points}/><circle cx={last[0]} cy={last[1]} r="5"/></svg>
}

export function MetricDetailPage({metric,record,records,bodyDefaults,onBack,onEdit,onUpdateBody}:{metric:DetailMetric;record:DailyRecord;records:DailyRecord[];bodyDefaults:BodyProfile;onBack:()=>void;onEdit:(section:RecordSection)=>void;onUpdateBody:(body:BodyProfile)=>Promise<void>}) {
  const [editingBody,setEditingBody]=useState(false)
  const meta=detailMeta[metric],Icon=meta.icon
  const current=metric==='weight'?bodyDefaults.weightKg:metricValue(metric,record)
  const history=useMemo(()=>[...records].filter(item=>item.date<=todayKey()).sort((a,b)=>b.date.localeCompare(a.date)).map(item=>({date:item.date,value:metricValue(metric,item,true)})).filter((item):item is {date:string;value:number}=>item.value!=null).slice(0,8),[metric,records])
  const chartValues=[...history].reverse().map(item=>item.value)
  const hasTrend=chartValues.length>=2
  const foodEntries=foodEntriesFor(record),activityEntries=activityEntriesFor(record)
  const activityName=activityLevels.find(level=>level.id===(record.activityLevel??'sedentary'))?.name??'静坐办公'
  const facts = metric==='deficit' ? [
    ['摄入',getFoodCalories(record), 'kcal'],['静息',record.restingCalories,'kcal'],['日常',getDailyActivityCalories(record),'kcal'],['运动',getExerciseCalories(record),'kcal'],
  ] : metric==='protein' ? [
    ['膳食记录',foodEntries.length,'项'],['今日摄入',getFoodCalories(record),'kcal'],
  ] : metric==='weight' ? [
    ['身高',bodyDefaults.heightCm,'cm'],['BMI',calculateBMI(bodyDefaults.weightKg,bodyDefaults.heightCm), ''],['腰围',bodyDefaults.waistCm,'cm'],
  ] : metric==='exercise' ? [
    ['运动记录',activityEntries.length,'项'],
  ] : metric==='steps' ? [
    ['热量计算','不计入',''],
  ] : metric==='daily' ? [
    ['活动档位',activityName,''],['静息消耗',record.restingCalories,'kcal'],
  ] : []
  const heroLabel=metric==='deficit'&&current!=null?(current>=0?'今日热量缺口':'今日热量盈余'):meta.eyebrow
  return <main className="page metric-detail-page">
    <header className="detail-nav"><button type="button" onClick={onBack} aria-label="返回首页"><ArrowLeft size={22}/></button><span>今日详情</span><i/></header>
    <section className={`detail-hero detail-${metric}`}><div className="detail-hero-icon"><Icon size={22}/></div><p>{heroLabel}</p><strong>{current==null?'—':metric==='deficit'?numberText(Math.abs(current)):numberText(current)} <small>{current!=null&&meta.unit}</small></strong><h1>{meta.title}</h1></section>
    {facts.length>0&&<section className="detail-facts" aria-label="今日数据">{facts.map(([label,value,unit])=><div key={label}><span>{label}</span><strong>{typeof value==='number'?numberText(value):value??'—'} <small>{value!=null&&unit}</small></strong></div>)}</section>}
    <button type="button" className="detail-edit-button" onClick={()=>metric==='weight'?setEditingBody(true):onEdit(meta.section)}><Pencil size={17}/>{metric==='weight'?'编辑身体资料':'编辑今日记录'}</button>
    <section className={`detail-history-card ${hasTrend?'':'compact'}`}><div className="detail-section-head"><div><span>最近 {history.length} 条记录</span><h2>近期变化</h2></div><em>{hasTrend?meta.unit:`${history.length}/2`}</em></div><Sparkline values={chartValues}/></section>
    <section className="detail-list"><div className="detail-section-head"><div><span>按日期</span><h2>记录</h2></div></div>{history.length===0?<div className="detail-list-empty">暂无历史记录</div>:history.map(item=><div className="detail-list-row" key={item.date}><span>{relativeDateTitle(item.date)}</span><strong>{displayValue(metric,item.value)} <small>{metric==='deficit'?'kcal':meta.unit}</small></strong></div>)}</section>
    {editingBody&&<BodyEditor value={bodyDefaults} onClose={()=>setEditingBody(false)} onSave={async body=>{await onUpdateBody(body);setEditingBody(false)}}/>}
  </main>
}
