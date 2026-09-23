import { RotateCcw } from 'lucide-react'
import type { ActivityEntry, DailyRecord, FoodEntry } from '../../types/record'
import { activityEntryPatch, activityEntriesFor, foodEntriesFor, foodEntryPatch } from '../../lib/entries'
import { activityLevels, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { EntrySection } from './EntrySection'
import { DecimalInput } from '../ui/DecimalInput'
import { DraftTextarea } from '../ui/DraftTextarea'

export function RecordForm({ record, onUpdate }: { record: DailyRecord; onUpdate: (patch: Partial<DailyRecord>) => void }) {
  const total = calculateTotalCalories(record), deficit = calculateCalorieDeficit(record)
  const foodEntries = foodEntriesFor(record), activityEntries = activityEntriesFor(record)
  const setActivityLevel = (level: DailyRecord['activityLevel']) => onUpdate({ activityLevel: level, dailyCalories: estimateDailyActivityCalories(record.restingCalories, level) })
  const resetResting = () => { const resting = estimateRestingCalories(record.weightKg); onUpdate({ restingMode: 'auto', restingCalories: resting, ...(record.activityLevel ? { dailyCalories: estimateDailyActivityCalories(resting, record.activityLevel) } : {}) }) }
  return <div className="form-stack">
    <section className="form-section"><h2>睡眠</h2><div className="input-card"><label className="input-row"><span>睡眠时间</span><span className="input-wrap"><DecimalInput commitOnBlur value={record.sleepHours} onValueChange={sleepHours=>onUpdate({sleepHours:sleepHours == null ? undefined : Math.min(sleepHours,24)})} placeholder="例如 7,5"/><small>h</small></span></label></div><p className="field-help">记录昨晚的实际睡眠时长，支持逗号或小数点，最多 24 小时。</p></section>

    <section className="form-section"><div className="form-title-row"><h2>基础静息消耗</h2><button type="button" onClick={resetResting}><RotateCcw size={14}/>恢复估算</button></div><div className="input-card"><label className="input-row"><span>全天静卧消耗</span><span className="input-wrap"><DecimalInput commitOnBlur value={record.restingCalories} onValueChange={resting=>onUpdate({restingCalories:resting,restingMode:'manual',dailyCalories:estimateDailyActivityCalories(resting,record.activityLevel)})} placeholder="输入体重后估算"/><small>kcal</small></span></label></div><p className="field-help">相当于全天躺着不动、维持身体基本运转的消耗。默认按 22 kcal × 当前体重估算，可手动修改。</p></section>

    <section className="form-section"><h2>日常活动档位</h2><div className="activity-levels">{activityLevels.map(level => <button key={level.id} className={record.activityLevel===level.id?'active':''} onClick={() => setActivityLevel(level.id)}><span><strong>{level.name}</strong><small>{level.description}</small></span><em>+{estimateDailyActivityCalories(record.restingCalories,level.id)?.toLocaleString() ?? '—'} kcal</em></button>)}</div><div className="inline-result"><span>档位增加的日常消耗</span><strong>+{record.dailyCalories?.toLocaleString() ?? '—'} kcal</strong></div></section>

    <EntrySection kind="activity" entries={activityEntries} onChange={items => onUpdate(activityEntryPatch(items as ActivityEntry[]))}/>
    <div className="energy-summary"><div><span>静息</span><strong>{record.restingCalories?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>日常</span><strong>{record.dailyCalories?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>运动</span><strong>{getExerciseCalories(record)?.toLocaleString() ?? '—'}</strong></div><b>=</b><div><span>总消耗</span><strong>{total.toLocaleString()}</strong></div></div>

    <EntrySection kind="food" entries={foodEntries} onChange={items => onUpdate(foodEntryPatch(items as FoodEntry[]))}/>
    <div className="intake-summary"><div><span>膳食总计</span><strong>{getFoodCalories(record)?.toLocaleString() ?? '—'} kcal</strong></div><div><span>蛋白质总计</span><strong>{getProteinGrams(record)?.toLocaleString() ?? '—'} g</strong></div></div>

    <section className="form-section"><h2>当日结果</h2><div className={`result-strip ${deficit != null && deficit < 0 ? 'surplus' : ''}`}><span>{deficit == null ? '添加膳食后计算' : deficit >= 0 ? '热量缺口 · 消耗更多' : '热量盈余 · 摄入更多'}</span><strong>{deficit == null ? '—' : `${Math.abs(deficit).toLocaleString()} kcal`}</strong></div><p className="deficit-formula">总消耗 {total.toLocaleString()} − 膳食 {getFoodCalories(record)?.toLocaleString() ?? '—'} = {deficit == null ? '—' : `${deficit >= 0 ? '+' : '−'}${Math.abs(deficit).toLocaleString()} kcal`}</p></section>
    <section className="form-section"><h2>备注</h2><DraftTextarea className="notes" rows={4} placeholder="今天感觉如何？运动、饮食或睡眠…" value={record.notes} onCommit={notes=>onUpdate({notes})}/><p className="field-help">离开输入框后自动保存</p></section>
  </div>
}
