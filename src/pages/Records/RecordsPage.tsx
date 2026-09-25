import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DailyRecord, RecordSection } from '../../types/record'
import { fullDisplayDate, todayKey } from '../../lib/date'
import { useDailyRecord } from '../../hooks/useDailyRecord'
import { RecordForm } from '../../components/forms/RecordForm'
import { Toast } from '../../components/ui/Toast'
import { deleteRecord } from '../../db/records'
import { defaultsForDate } from '../../lib/recordDefaults'

const weekdays = ['一','二','三','四','五','六','日']
export function RecordsPage({ initialDate, focusTarget, records, onRecordsChange }: { initialDate: string; focusTarget?:RecordSection; records: DailyRecord[]; onRecordsChange: () => void }) {
  const [selected, setSelected] = useState(initialDate), [month, setMonth] = useState(startOfMonth(parseISO(initialDate))),[calendarOpen,setCalendarOpen]=useState(false),[pageError,setPageError]=useState('')
  const didFocus=useRef(false)
  const today=todayKey(),canGoNext=selected<today,canGoNextMonth=format(month,'yyyy-MM')<today.slice(0,7)
  const dailyDefaults=useMemo(()=>defaultsForDate(records,selected),[records,selected])
  const { record, update, ready, saved, saveError, loadError, retryLoad } = useDailyRecord(selected, onRecordsChange, dailyDefaults)
  const marked = useMemo(() => new Set(records.map(r => r.date)), [records])
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })
  const selectDate = (date: Date, closeCalendar=false) => { const key=format(date,'yyyy-MM-dd');if(key>today)return;setSelected(key);setMonth(startOfMonth(date));setPageError('');if(closeCalendar)setCalendarOpen(false) }
  useEffect(()=>{if(!ready||!focusTarget||didFocus.current)return;didFocus.current=true;const timer=window.setTimeout(()=>document.getElementById(`record-${focusTarget}`)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),80);return()=>window.clearTimeout(timer)},[ready,focusTarget])
  const remove = async () => { if (!marked.has(selected) || !confirm(`确定删除 ${fullDisplayDate(selected)} 的记录吗？`)) return;try{await deleteRecord(record.id);onRecordsChange();setSelected(selected);setPageError('')}catch{setPageError('删除失败，请重试')} }
  return <main className="page records-page">
    <header className="page-header"><div><p className="eyebrow">日常记录</p><h1>{selected===todayKey()?'今天':'历史记录'}</h1></div>{selected!==todayKey()&&<button className="today-button" onClick={() => selectDate(new Date())}>回到今天</button>}</header>
    <div className="date-stepper compact"><button className="icon-button" aria-label="前一天" onClick={()=>selectDate(addDays(parseISO(selected),-1))}><ChevronLeft/></button><button className="date-picker-button" aria-expanded={calendarOpen} onClick={()=>setCalendarOpen(open=>!open)}><span>{selected===today?'正在记录今天':'正在查看'}</span><strong>{fullDisplayDate(selected)}</strong><ChevronDown size={15} className={calendarOpen?'open':''}/></button><button className="icon-button" aria-label="后一天" disabled={!canGoNext} onClick={()=>selectDate(addDays(parseISO(selected),1))}><ChevronRight/></button></div>
    {calendarOpen&&<section className="calendar-card collapsible"><div className="calendar-head"><button className="icon-button" aria-label="上个月" onClick={() => setMonth(addMonths(month,-1))}><ChevronLeft/></button><strong>{format(month,'yyyy年 M月')}</strong><button className="icon-button" aria-label="下个月" disabled={!canGoNextMonth} onClick={() => setMonth(addMonths(month,1))}><ChevronRight/></button></div><div className="calendar-grid">{weekdays.map(d=><span className="weekday" key={d}>{d}</span>)}{days.map(day => { const key=format(day,'yyyy-MM-dd'),future=key>today; return <button key={key} aria-label={fullDisplayDate(key)} aria-current={key===selected?'date':undefined} disabled={future} className={`${key===selected?'selected ':''}${!isSameMonth(day,month)?'muted ':''}${marked.has(key)?'marked':''}`} onClick={()=>selectDate(day,true)}><span>{day.getDate()}</span></button> })}</div></section>}
    {!calendarOpen&&<button className="calendar-shortcut" onClick={()=>setCalendarOpen(true)}><CalendarDays size={16}/>选择其他日期<span>{marked.size} 条记录</span></button>}
    {ready ? <><RecordForm record={record} records={records} onUpdate={update}/>{marked.has(selected) && <button className="danger-button" onClick={remove}><Trash2 size={18}/>删除这天的记录</button>}</> : loadError?<div className="loading-card error-card"><p>{loadError}</p><button type="button" onClick={retryLoad}>重试</button></div>:<div className="loading-card">正在读取记录…</div>}
    {(saveError||pageError) ? <Toast>{saveError||pageError}</Toast> : saved && <Toast>已保存</Toast>}
  </main>
}
