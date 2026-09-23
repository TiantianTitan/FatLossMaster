import { RotateCcw } from 'lucide-react'
import type { ActivityEntry, DailyRecord, FoodEntry, NumericRecordKey } from '../../types/record'
import { activityEntryPatch, activityEntriesFor, foodEntriesFor, foodEntryPatch } from '../../lib/entries'
import { activityLevels, calculateBMI, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../../lib/calculations'
import { EntrySection } from './EntrySection'

const bodyFields: Array<{key:NumericRecordKey;label:string;unit:string;placeholder:string}> = [{key:'heightCm',label:'身高',unit:'cm',placeholder:'175'},{key:'weightKg',label:'体重',unit:'kg',placeholder:'75.2'},{key:'waistCm',label:'腰围',unit:'cm',placeholder:'84'}]

export function RecordForm({ record, onUpdate }: { record: DailyRecord; onUpdate: (patch: Partial<DailyRecord>) => void }) {
  const bmi = calculateBMI(record.weightKg, record.heightCm), total = calculateTotalCalories(record), deficit = calculateCalorieDeficit(record)
  const foodEntries = foodEntriesFor(record), activityEntries = activityEntriesFor(record)
  const updateBody = (key: NumericRecordKey, value?: number) => {
    const patch: Partial<DailyRecord> = { [key]: value }
    if (key === 'weightKg' && record.restingMode !== 'manual') {
      const resting = estimateRestingCalories(value); patch.restingCalories = resting; patch.restingMode = 'auto'
      if (record.activityLevel) patch.dailyCalories = estimateDailyActivityCalories(resting, record.activityLevel)
    }
    onUpdate(patch)
  }
  const setActivityLevel = (level: DailyRecord['activityLevel']) => onUpdate({ activityLevel: level, dailyCalories: estimateDailyActivityCalories(record.restingCalories, level) })
  const resetResting = () => { const resting = estimateRestingCalories(record.weightKg); onUpdate({ restingMode: 'auto', restingCalories: resting, ...(record.activityLevel ? { dailyCalories: estimateDailyActivityCalories(resting, record.activityLevel) } : {}) }) }
  return <div className="form-stack">
    <section className="form-section"><h2>身体数据</h2><div className="input-card">{bodyFields.map(field => <label className="input-row" key={field.key}><span>{field.label}</span><span className="input-wrap"><input inputMode="decimal" type="number" min="0" step="any" placeholder={field.placeholder} value={record[field.key] ?? ''} onChange={e => updateBody(field.key, e.target.value === '' ? undefined : Number(e.target.value))}/><small>{field.unit}</small></span></label>)}</div><div className="inline-result"><span>自动计算 BMI</span><strong>{bmi?.toFixed(1) ?? '—'}</strong></div></section>

    <section className="form-section"><div className="form-title-row"><h2>基础静息消耗</h2><button onClick={resetResting}><RotateCcw size={14}/>恢复估算</button></div><div className="input-card"><label className="input-row"><span>全天静卧消耗</span><span className="input-wrap"><input inputMode="decimal" type="number" min="0" step="any" placeholder="输入体重后估算" value={record.restingCalories ?? ''} onChange={e => { const resting=e.target.value===''?undefined:Number(e.target.value); onUpdate({ restingCalories:resting, restingMode:'manual', dailyCalories:estimateDailyActivityCalories(resting,record.activityLevel) }) }}/><small>kcal</small></span></label></div><p className="field-help">相当于全天躺着不动、维持身体基本运转的消耗。默认按 22 kcal × 当前体重估算，可手动修改。</p></section>

    <section className="form-section"><h2>日常活动档位</h2><div className="activity-levels">{activityLevels.map(level => <button key={level.id} className={record.activityLevel===level.id?'active':''} onClick={() => setActivityLevel(level.id)}><span><strong>{level.name}</strong><small>{level.description}</small></span><em>+{estimateDailyActivityCalories(record.restingCalories,level.id)?.toLocaleString() ?? '—'} kcal</em></button>)}</div><div className="inline-result"><span>档位增加的日常消耗</span><strong>+{record.dailyCalories?.toLocaleString() ?? '—'} kcal</strong></div></section>

    <EntrySection kind="activity" entries={activityEntries} onChange={items => onUpdate(activityEntryPatch(items as ActivityEntry[]))}/>
    <div className="energy-summary"><div><span>静息</span><strong>{record.restingCalories?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>日常</span><strong>{record.dailyCalories?.toLocaleString() ?? '—'}</strong></div><b>+</b><div><span>运动</span><strong>{getExerciseCalories(record)?.toLocaleString() ?? '—'}</strong></div><b>=</b><div><span>总消耗</span><strong>{total.toLocaleString()}</strong></div></div>

    <EntrySection kind="food" entries={foodEntries} onChange={items => onUpdate(foodEntryPatch(items as FoodEntry[]))}/>
    <div className="intake-summary"><div><span>膳食总计</span><strong>{getFoodCalories(record)?.toLocaleString() ?? '—'} kcal</strong></div><div><span>蛋白质总计</span><strong>{getProteinGrams(record)?.toLocaleString() ?? '—'} g</strong></div></div>

    <section className="form-section"><h2>当日结果</h2><div className={`result-strip ${deficit != null && deficit < 0 ? 'surplus' : ''}`}><span>{deficit == null ? '添加膳食后计算' : deficit >= 0 ? '热量缺口 · 消耗更多' : '热量盈余 · 摄入更多'}</span><strong>{deficit == null ? '—' : `${Math.abs(deficit).toLocaleString()} kcal`}</strong></div><p className="deficit-formula">总消耗 {total.toLocaleString()} − 膳食 {getFoodCalories(record)?.toLocaleString() ?? '—'} = {deficit == null ? '—' : `${deficit >= 0 ? '+' : '−'}${Math.abs(deficit).toLocaleString()} kcal`}</p></section>
    <section className="form-section"><h2>备注</h2><textarea className="notes" rows={4} placeholder="今天感觉如何？运动、饮食或睡眠…" value={record.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value })}/></section>
  </div>
}
