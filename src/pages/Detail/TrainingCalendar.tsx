import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import type { DailyRecord } from '../../types/record'
import { activityEntriesFor, trainingBreakdown, trainingTypeLabel } from '../../lib/entries'
import { todayKey } from '../../lib/date'

const dateLabel = (date:string) => format(parseISO(date),'M月d日')
const weekday = (date:string) => format(parseISO(date),'EEEE',{locale:zhCN})

export function TrainingCalendar({ records, todayRecord }: { records:DailyRecord[]; todayRecord:DailyRecord }) {
  const today=todayKey()
  const [weekEnd,setWeekEnd]=useState(today)
  const [selectedDate,setSelectedDate]=useState(today)
  const byDate=useMemo(()=>new Map([...records,todayRecord].map(record=>[record.date,record])),[records,todayRecord])
  const days=Array.from({length:7},(_,index)=>format(subDays(parseISO(weekEnd),6-index),'yyyy-MM-dd'))
  const selectedRecord=byDate.get(selectedDate)
  const entries=selectedRecord?activityEntriesFor(selectedRecord):[]
  const hasLegacy=days.some(date=>trainingBreakdown(byDate.get(date)).unclassified>0)
  const move=(offset:number)=>{
    const next=format(subDays(parseISO(weekEnd),offset),'yyyy-MM-dd')
    const end=next>today?today:next
    setWeekEnd(end)
    setSelectedDate(end)
  }

  return <section className="training-calendar" aria-label="运动周历">
    <div className="training-calendar-head"><div><span>最近训练</span><h2>运动周历</h2></div><div className="training-week-controls"><button type="button" onClick={()=>move(7)} aria-label="上一周"><ChevronLeft size={18}/></button><strong>{dateLabel(days[0])} – {dateLabel(weekEnd)}</strong><button type="button" onClick={()=>move(-7)} disabled={weekEnd>=today} aria-label="下一周"><ChevronRight size={18}/></button></div></div>
    <div className="training-legend"><span className="aerobic">有氧</span><span className="anaerobic">无氧</span>{hasLegacy&&<span className="unclassified">未分类</span>}</div>
    <div className="training-week">{days.map(date=>{const dayTotals=trainingBreakdown(byDate.get(date));return <button type="button" key={date} className={date===selectedDate?'selected':''} aria-pressed={date===selectedDate} aria-label={`${dateLabel(date)} ${weekday(date)}，有氧 ${dayTotals.aerobic} kcal，无氧 ${dayTotals.anaerobic} kcal${dayTotals.unclassified?`，未分类 ${dayTotals.unclassified} kcal`:''}`} onClick={()=>setSelectedDate(date)}><span>{weekday(date).replace('星期','')}</span><strong>{format(parseISO(date),'d')}</strong><span className="training-day-marks" aria-hidden="true">{dayTotals.aerobic>0&&<i className="aerobic"/>}{dayTotals.anaerobic>0&&<i className="anaerobic"/>}{dayTotals.unclassified>0&&<i className="unclassified"/>}</span></button>})}</div>
    <div className="training-selected"><div className="training-selected-head"><strong>{dateLabel(selectedDate)} · {weekday(selectedDate)}</strong><span>{entries.length} 项</span></div>{entries.length===0?<p>当天无运动记录</p>:<div className="training-selected-list">{entries.map(entry=><div key={entry.id}><span><i className={entry.trainingType??'unclassified'}/>{entry.name || '运动记录'} <small>{trainingTypeLabel(entry.trainingType)}</small></span><strong>{entry.calories.toLocaleString()} <small>kcal</small></strong></div>)}</div>}</div>
  </section>
}
