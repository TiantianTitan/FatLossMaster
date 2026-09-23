import type { DailyRecord, NumericRecordKey } from '../../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories } from '../../lib/calculations'

const groups: Array<{title:string; fields:Array<{key:NumericRecordKey;label:string;unit:string;step?:string;placeholder?:string}>}> = [
  { title: '身体数据', fields: [{key:'heightCm',label:'身高',unit:'cm',step:'0.1',placeholder:'175'},{key:'weightKg',label:'体重',unit:'kg',step:'0.1',placeholder:'75.2'},{key:'waistCm',label:'腰围',unit:'cm',step:'0.1',placeholder:'84'}] },
  { title: '热量消耗', fields: [{key:'restingCalories',label:'静息热量',unit:'kcal',placeholder:'1650'},{key:'dailyCalories',label:'日常活动',unit:'kcal',placeholder:'500'},{key:'exerciseCalories',label:'运动热量',unit:'kcal',placeholder:'350'}] },
  { title: '膳食', fields: [{key:'foodCalories',label:'膳食能量',unit:'kcal',placeholder:'2100'},{key:'proteinGrams',label:'蛋白质',unit:'g',step:'0.1',placeholder:'150'}] },
]

export function RecordForm({ record, onUpdate }: { record: DailyRecord; onUpdate: (patch: Partial<DailyRecord>) => void }) {
  const bmi = calculateBMI(record.weightKg, record.heightCm), total = calculateTotalCalories(record), deficit = calculateCalorieDeficit(record)
  return <div className="form-stack">
    {groups.map(group => <section className="form-section" key={group.title}><h2>{group.title}</h2><div className="input-card">{group.fields.map(field => <label className="input-row" key={field.key}><span>{field.label}</span><span className="input-wrap"><input inputMode="decimal" type="number" min="0" step={field.step ?? '1'} placeholder={field.placeholder} value={record[field.key] ?? ''} onChange={e => onUpdate({ [field.key]: e.target.value === '' ? undefined : Number(e.target.value) })}/><small>{field.unit}</small></span></label>)}</div>
      {group.title === '身体数据' && <div className="inline-result"><span>自动计算 BMI</span><strong>{bmi?.toFixed(1) ?? '—'}</strong></div>}
      {group.title === '热量消耗' && <div className="inline-result"><span>总消耗</span><strong>{total ? `${total.toLocaleString()} kcal` : '—'}</strong></div>}
    </section>)}
    <section className="form-section"><h2>当日结果</h2><div className={`result-strip ${deficit != null && deficit < 0 ? 'surplus' : ''}`}><span>{deficit == null ? '等待膳食数据' : deficit >= 0 ? '热量缺口' : '热量盈余'}</span><strong>{deficit == null ? '—' : `${Math.abs(deficit).toLocaleString()} kcal`}</strong></div></section>
    <section className="form-section"><h2>备注</h2><textarea className="notes" rows={4} placeholder="今天感觉如何？运动、饮食或睡眠…" value={record.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value })}/></section>
  </div>
}
