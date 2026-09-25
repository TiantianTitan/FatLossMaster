import { RotateCcw } from 'lucide-react'
import type { ActivityEntry, DailyRecord, FoodEntry } from '../../types/record'
import { activityEntryPatch, activityEntriesFor, foodEntriesFor, foodEntryPatch, recentActivityEntriesFor, recentFoodEntriesFor } from '../../lib/entries'
import { activityLevels, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, getDailyActivityCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { EntrySection } from './EntrySection'
import { DecimalInput } from '../ui/DecimalInput'
import { DraftTextarea } from '../ui/DraftTextarea'
import { DEFAULT_RESTING_CALORIES } from '../../lib/recordDefaults'

export function RecordForm({ record, records, onUpdate }: { record: DailyRecord; records:DailyRecord[]; onUpdate: (patch: Partial<DailyRecord>) => Promise<boolean> }) {
  const total = calculateTotalCalories(record), deficit = calculateCalorieDeficit(record)
  const adjustedDaily = getDailyActivityCalories(record)
  const foodEntries = foodEntriesFor(record), activityEntries = activityEntriesFor(record)
  const setActivityLevel = (level: DailyRecord['activityLevel']) => onUpdate({ activityLevel: level, dailyCalories: estimateDailyActivityCalories(record.restingCalories, level) })
  const estimatedResting=()=>estimateRestingCalories(record.weightKg,record.heightCm,record.ageYears,record.sex)??DEFAULT_RESTING_CALORIES
  const resetResting = () => { const resting = estimatedResting(); onUpdate({ restingMode: 'auto', restingCalories: resting, dailyCalories: estimateDailyActivityCalories(resting, record.activityLevel ?? 'sedentary') }) }
  return <div className="form-stack">
    <section id="record-summary" className="form-section result-section"><h2>热量缺口</h2><div className={`result-strip ${deficit != null && deficit < 0 ? 'surplus' : ''}`}><span>{deficit == null ? '等待膳食记录' : deficit >= 0 ? '热量缺口' : '热量盈余'}</span><strong>{deficit == null ? '—' : `${Math.abs(deficit).toLocaleString()} kcal`}</strong></div><div className="energy-summary"><div><span>静息</span><strong>{record.restingCalories?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>日常</span><strong>{adjustedDaily?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>运动</span><strong>{getExerciseCalories(record)?.toLocaleString() ?? '—'}</strong></div><b>=</b><div><span>总消耗</span><strong>{total.toLocaleString()}</strong></div></div></section>

    <div id="record-activity" className="record-anchor"><EntrySection kind="activity" entries={activityEntries} recentEntries={recentActivityEntriesFor(records)} onChange={items => onUpdate(activityEntryPatch(items as ActivityEntry[]))}/></div>

    <div id="record-food" className="record-anchor"><EntrySection kind="food" entries={foodEntries} recentEntries={recentFoodEntriesFor(records)} onChange={items => onUpdate(foodEntryPatch(items as FoodEntry[]))}/></div>
    <div className="intake-summary"><div><span>膳食总计</span><strong>{getFoodCalories(record)?.toLocaleString() ?? '—'} kcal</strong></div><div><span>蛋白质总计</span><strong>{getProteinGrams(record)?.toLocaleString() ?? '—'} g</strong></div></div>

    <section id="record-resting" className="form-section"><div className="form-title-row"><h2>静息消耗</h2><button type="button" onClick={resetResting}><RotateCcw size={14}/>恢复估算</button></div><div className="input-card"><label className="input-row"><span>全天静卧消耗</span><span className="input-wrap"><DecimalInput commitOnBlur value={record.restingCalories} onValueChange={value=>{const manual=value!=null&&value>=500&&value<=5000,resting=manual?value:estimatedResting();onUpdate({restingCalories:resting,restingMode:manual?'manual':'auto',dailyCalories:estimateDailyActivityCalories(resting,record.activityLevel??'sedentary')})}} placeholder="自动估算"/><small>kcal</small></span></label></div></section>

    <section id="record-daily" className="form-section"><h2>日常消耗</h2><div className="activity-levels">{activityLevels.map(level => <button key={level.id} aria-pressed={record.activityLevel===level.id} className={record.activityLevel===level.id?'active':''} onClick={() => setActivityLevel(level.id)}><span><strong>{level.name}</strong><small>{level.description}</small></span><em>+{estimateDailyActivityCalories(record.restingCalories,level.id)?.toLocaleString() ?? '—'} kcal</em></button>)}</div><div className="input-card steps-card"><label className="input-row"><span>今日步数 <small>可选</small></span><span className="input-wrap"><DecimalInput commitOnBlur value={record.stepCount} onValueChange={stepCount=>onUpdate({stepCount:stepCount == null ? undefined : Math.min(200000,Math.max(0,stepCount))})} placeholder="未记录"/><small>步</small></span></label></div><div className="inline-result"><span>今日日常消耗</span><strong>+{adjustedDaily?.toLocaleString() ?? '—'} kcal</strong></div></section>

    <section id="record-sleep" className="form-section"><h2>睡眠时间</h2><div className="input-card"><label className="input-row"><span>昨晚睡眠</span><span className="input-wrap"><DecimalInput commitOnBlur value={record.sleepHours} onValueChange={sleepHours=>onUpdate({sleepHours:sleepHours == null ? undefined : Math.min(sleepHours,24)})} placeholder="例如 7,5"/><small>h</small></span></label></div></section>

    <section id="record-notes" className="form-section"><h2>备注</h2><DraftTextarea className="notes" rows={4} placeholder="今天感觉如何？" value={record.notes} onCommit={notes=>onUpdate({notes})}/></section>
  </div>
}
