import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ActivityEntry, FoodEntry } from '../../types/record'
import { Modal } from '../ui/Modal'
import { parseArithmeticExpression } from '../../lib/numbers'
import { removeEntryById, restoreEntryAt, trainingTypeLabel } from '../../lib/entries'
import { UndoToast } from '../ui/UndoToast'
import { ExpressionInput } from '../ui/ExpressionInput'

export type EntryKind = 'food' | 'activity'
export type Entry = FoodEntry | ActivityEntry

export function EntrySection({ kind, entries, recentEntries=[], onChange }: { kind: EntryKind; entries: Entry[]; recentEntries?:Entry[]; onChange: (entries: Entry[]) => Promise<boolean> }) {
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined)
  const [editorVersion, setEditorVersion] = useState(0)
  const [changeError,setChangeError]=useState(''),[deleted,setDeleted]=useState<{entry:Entry;index:number}|null>(null),[undoing,setUndoing]=useState(false),[removingId,setRemovingId]=useState<string>()
  const sectionRef=useRef<HTMLElement>(null),restoreAfterSave=useRef(false)
  const undoTimer=useRef<number>(undefined)
  const isFood = kind === 'food'
  useEffect(()=>{if(editing!==undefined||!restoreAfterSave.current)return;restoreAfterSave.current=false;let timer=0;const frame=requestAnimationFrame(()=>{timer=window.setTimeout(()=>sectionRef.current?.closest<HTMLElement>('.record-anchor')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),320)});return()=>{cancelAnimationFrame(frame);window.clearTimeout(timer)}},[editing])
  useEffect(()=>()=>window.clearTimeout(undoTimer.current),[])
  const save = async(entry: Entry) => {
    const wasAdding=editing===null
    const next = editing ? entries.map(item => item.id === editing.id ? entry : item) : [...entries, entry]
    const saved=await onChange(next);if(saved){setChangeError('');restoreAfterSave.current=wasAdding;setEditing(undefined)}return saved
  }
  const saveAndContinue = async(entry: Entry) => { const saved=await onChange([...entries, entry]);if(saved){setChangeError('');setEditorVersion(version => version + 1)}return saved }
  const remove=async(entry:Entry)=>{const result=removeEntryById(entries,entry.id);if(!result.removed)return;setRemovingId(entry.id);const saved=await onChange(result.entries);setRemovingId(undefined);if(!saved){setChangeError('删除失败，请重试');return}setChangeError('');setDeleted(result.removed);window.clearTimeout(undoTimer.current);undoTimer.current=window.setTimeout(()=>setDeleted(null),5000)}
  const undoDelete=async()=>{if(!deleted||undoing)return;window.clearTimeout(undoTimer.current);setUndoing(true);const saved=await onChange(restoreEntryAt(entries,deleted.entry,deleted.index));setUndoing(false);if(saved){setDeleted(null);setChangeError('')}else{setChangeError('恢复失败，请重试');undoTimer.current=window.setTimeout(()=>setDeleted(null),5000)}}
  return <section ref={sectionRef} className="form-section entry-section">
    <div className="form-title-row"><h2>{isFood ? '膳食记录' : '运动记录'}</h2><button onClick={() => setEditing(null)}><Plus size={15}/>{isFood ? '添加膳食' : '添加运动'}</button></div>
    <div className="entry-card">
      {entries.length === 0 ? <button className="entry-empty" onClick={() => setEditing(null)}><Plus size={20}/><span>{isFood ? '添加今天吃过的食物或餐点' : '添加健身、跑步等额外消耗'}</span></button> : entries.map(entry => <div className="entry-row" key={entry.id}>
        <div><strong>{entry.name}</strong><span>{!isFood && `${trainingTypeLabel((entry as ActivityEntry).trainingType)} · `}{entry.calories.toLocaleString()} kcal{isFood && 'proteinGrams' in entry && entry.proteinGrams != null ? ` · 蛋白质 ${entry.proteinGrams} g` : ''}</span></div>
        <button disabled={removingId!=null} onClick={() => setEditing(entry)} aria-label={`修改${entry.name}`}><Pencil size={16}/></button>
        <button disabled={removingId!=null} className="entry-delete" onClick={() => remove(entry)} aria-label={`删除${entry.name}`}><Trash2 size={16}/></button>
      </div>)}
    </div>
    {changeError&&<p className="form-error" role="alert">{changeError}</p>}
    {editing !== undefined && <EntryEditor
      key={editorVersion}
      kind={kind}
      entry={editing}
      recentEntries={recentEntries}
      onSave={save}
      onSaveAndContinue={editing ? undefined : saveAndContinue}
      onClose={() => setEditing(undefined)}
    />}
    {deleted&&<UndoToast message={`已删除“${deleted.entry.name}”`} onUndo={undoDelete} undoing={undoing}/>}
  </section>
}

export function EntryEditor({ kind, entry, recentEntries=[], onSave, onSaveAndContinue, onClose }: { kind: EntryKind; entry: Entry | null; recentEntries?:Entry[]; onSave: (entry: Entry) => boolean|void|Promise<boolean|void>; onSaveAndContinue?: (entry: Entry) => boolean|void|Promise<boolean|void>; onClose: () => void }) {
  const [name, setName] = useState(entry?.name ?? '')
  const [calories, setCalories] = useState(entry?.calories?.toString() ?? '')
  const [protein, setProtein] = useState(entry && 'proteinGrams' in entry ? entry.proteinGrams?.toString() ?? '' : '')
  const [trainingType,setTrainingType]=useState<ActivityEntry['trainingType']>(entry && 'trainingType' in entry ? entry.trainingType : undefined)
  const [error,setError]=useState(''),[saving,setSaving]=useState(false)
  const isFood = kind === 'food'
  const validationError = () => {
    if(!isFood&&!trainingType)return '请选择有氧或无氧'
    const value=parseArithmeticExpression(calories)
    if(!value||value>(isFood?20000:10000))return '请输入有效的热量'
    if(isFood&&protein.trim()!==''){
      const proteinValue=parseArithmeticExpression(protein)
      if(proteinValue==null||proteinValue>1000)return '请输入有效的蛋白质'
    }
    return ''
  }
  const buildEntry = () => {
    const value = parseArithmeticExpression(calories),proteinValue=protein.trim()===''?undefined:parseArithmeticExpression(protein); if (!value) return
    const base = { id: entry?.id ?? crypto.randomUUID(), name: name.trim() || (isFood ? '快速记录' : '运动记录'), calories: value }
    return isFood ? { ...base, proteinGrams: proteinValue } : { ...base, trainingType, ...(entry && 'includedInSteps' in entry ? { includedInSteps: entry.includedInSteps } : {}) }
  }
  const persist=async(action:(next:Entry)=>boolean|void|Promise<boolean|void>,next:Entry)=>{setSaving(true);setError('');try{const saved=await action(next);if(saved===false)setError('保存失败，请重试')}catch{setError('保存失败，请重试')}finally{setSaving(false)}}
  const run=async(action:(next:Entry)=>boolean|void|Promise<boolean|void>)=>{const issue=validationError();if(issue){setError(issue);return}const next=buildEntry();if(next)await persist(action,next)}
  const submit = async(event: React.FormEvent) => { event.preventDefault();await run(onSave) }
  return <Modal title={entry ? `修改${isFood ? '膳食' : '运动'}` : `添加${isFood ? '膳食' : '运动'}`} onClose={onClose}><form className="entry-form" onSubmit={submit}>
    {!entry&&recentEntries.length>0&&<div className="recent-entry-presets"><span>最近使用</span><div>{recentEntries.map(item=><button type="button" key={`${item.name}-${item.calories}`} onClick={()=>{setName(item.name);setCalories(item.calories.toString());setProtein('proteinGrams' in item&&item.proteinGrams!=null?item.proteinGrams.toString():'');if(!isFood)setTrainingType((item as ActivityEntry).trainingType);setError('')}}><strong>{item.name}</strong><small>{!isFood&&`${trainingTypeLabel((item as ActivityEntry).trainingType)} · `}{item.calories.toLocaleString()} kcal{'proteinGrams' in item&&item.proteinGrams!=null?` · ${item.proteinGrams.toLocaleString()} g`:''}</small></button>)}</div></div>}
    <label><span>名称 <small>可选</small></span><input placeholder={isFood ? '例如：鸡胸肉午餐' : '例如：力量训练'} value={name} onChange={e => setName(e.target.value)}/></label>
    {!isFood&&<fieldset className="training-type-picker"><legend>运动类型</legend><div>{(['aerobic','anaerobic'] as const).map(type=><button type="button" key={type} className={trainingType===type?'selected':''} aria-pressed={trainingType===type} onClick={()=>{setTrainingType(type);setError('')}}>{trainingTypeLabel(type)}</button>)}</div></fieldset>}
    <label><span>{isFood ? '膳食热量' : '运动消耗'}</span><ExpressionInput raw={calories} onRawChange={raw=>{setCalories(raw);setError('')}} autoFocus unit="kcal" label={isFood?'膳食热量':'运动消耗'} placeholder={isFood?'如 450×80÷100':'如 300+120'}/></label>
    {isFood && <label><span>蛋白质</span><ExpressionInput raw={protein} onRawChange={setProtein} unit="g" label="蛋白质" placeholder="如 20×1.5"/></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}<div className="entry-form-actions">{onSaveAndContinue && <button className="secondary-button" type="button" disabled={saving} onClick={()=>run(onSaveAndContinue)}>保存并继续添加</button>}<button className="primary-button" type="submit" disabled={saving}>{saving?'保存中…':entry?'保存修改':'完成'}</button></div>
  </form></Modal>
}
