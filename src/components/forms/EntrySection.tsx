import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ActivityEntry, FoodEntry } from '../../types/record'
import { Modal } from '../ui/Modal'
import { parseDecimal } from '../../lib/numbers'

export type EntryKind = 'food' | 'activity'
export type Entry = FoodEntry | ActivityEntry

export function EntrySection({ kind, entries, recentEntries=[], onChange }: { kind: EntryKind; entries: Entry[]; recentEntries?:Entry[]; onChange: (entries: Entry[]) => Promise<boolean> }) {
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined)
  const [editorVersion, setEditorVersion] = useState(0)
  const [changeError,setChangeError]=useState('')
  const isFood = kind === 'food'
  const save = async(entry: Entry) => {
    const next = editing ? entries.map(item => item.id === editing.id ? entry : item) : [...entries, entry]
    const saved=await onChange(next);if(saved){setChangeError('');setEditing(undefined)}return saved
  }
  const saveAndContinue = async(entry: Entry) => { const saved=await onChange([...entries, entry]);if(saved){setChangeError('');setEditorVersion(version => version + 1)}return saved }
  const remove=async(entry:Entry)=>{const saved=await onChange(entries.filter(item=>item.id!==entry.id));setChangeError(saved?'':'删除失败，请重试')}
  return <section className="form-section entry-section">
    <div className="form-title-row"><h2>{isFood ? '膳食记录' : '运动记录'}</h2><button onClick={() => setEditing(null)}><Plus size={15}/>{isFood ? '添加膳食' : '添加运动'}</button></div>
    <div className="entry-card">
      {entries.length === 0 ? <button className="entry-empty" onClick={() => setEditing(null)}><Plus size={20}/><span>{isFood ? '添加今天吃过的食物或餐点' : '添加健身、跑步等额外消耗'}</span></button> : entries.map(entry => <div className="entry-row" key={entry.id}>
        <div><strong>{entry.name}</strong><span>{entry.calories.toLocaleString()} kcal{isFood && 'proteinGrams' in entry && entry.proteinGrams != null ? ` · 蛋白质 ${entry.proteinGrams} g` : ''}</span></div>
        <button onClick={() => setEditing(entry)} aria-label={`修改${entry.name}`}><Pencil size={16}/></button>
        <button className="entry-delete" onClick={() => remove(entry)} aria-label={`删除${entry.name}`}><Trash2 size={16}/></button>
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
  </section>
}

export function EntryEditor({ kind, entry, recentEntries=[], onSave, onSaveAndContinue, onClose }: { kind: EntryKind; entry: Entry | null; recentEntries?:Entry[]; onSave: (entry: Entry) => boolean|void|Promise<boolean|void>; onSaveAndContinue?: (entry: Entry) => boolean|void|Promise<boolean|void>; onClose: () => void }) {
  const [name, setName] = useState(entry?.name ?? '')
  const [calories, setCalories] = useState(entry?.calories?.toString() ?? '')
  const [protein, setProtein] = useState(entry && 'proteinGrams' in entry ? entry.proteinGrams?.toString() ?? '' : '')
  const [error,setError]=useState(''),[saving,setSaving]=useState(false)
  const isFood = kind === 'food'
  const buildEntry = () => {
    const value = parseDecimal(calories),proteinValue=protein===''?undefined:parseDecimal(protein); if (!value || value > (isFood?20000:10000) || (proteinValue!=null&&proteinValue>1000)) return
    const base = { id: entry?.id ?? crypto.randomUUID(), name: name.trim() || (isFood ? '快速记录' : '运动记录'), calories: value }
    return isFood ? { ...base, proteinGrams: proteinValue } : base
  }
  const persist=async(action:(next:Entry)=>boolean|void|Promise<boolean|void>,next:Entry)=>{setSaving(true);setError('');try{const saved=await action(next);if(saved===false)setError('保存失败，请重试')}catch{setError('保存失败，请重试')}finally{setSaving(false)}}
  const submit = async(event: React.FormEvent) => { event.preventDefault(); const next = buildEntry(); if(!next){setError('请输入有效的热量');return}await persist(onSave,next) }
  return <Modal title={entry ? `修改${isFood ? '膳食' : '运动'}` : `添加${isFood ? '膳食' : '运动'}`} onClose={onClose}><form className="entry-form" onSubmit={submit}>
    {!entry&&recentEntries.length>0&&<div className="recent-entry-presets"><span>最近使用</span><div>{recentEntries.map(item=><button type="button" key={`${item.name}-${item.calories}`} onClick={()=>{setName(item.name);setCalories(item.calories.toString());setProtein('proteinGrams' in item&&item.proteinGrams!=null?item.proteinGrams.toString():'');setError('')}}><strong>{item.name}</strong><small>{item.calories.toLocaleString()} kcal{'proteinGrams' in item&&item.proteinGrams!=null?` · ${item.proteinGrams.toLocaleString()} g`:''}</small></button>)}</div></div>}
    <label><span>名称 <small>可选</small></span><input placeholder={isFood ? '例如：鸡胸肉午餐' : '例如：力量训练'} value={name} onChange={e => setName(e.target.value)}/></label>
    <label><span>{isFood ? '膳食热量' : '运动消耗'}</span><span className="unit-input"><input autoFocus inputMode="decimal" type="text" autoComplete="off" placeholder="0" value={calories} onChange={e => {setCalories(e.target.value);setError('')}}/><small>kcal</small></span></label>
    {isFood && <label><span>蛋白质</span><span className="unit-input"><input inputMode="decimal" type="text" autoComplete="off" placeholder="可选" value={protein} onChange={e => setProtein(e.target.value)}/><small>g</small></span></label>}
    {error&&<p className="form-error" role="alert">{error}</p>}<div className="entry-form-actions">{onSaveAndContinue && <button className="secondary-button" type="button" disabled={saving} onClick={async()=>{const next=buildEntry();if(!next){setError('请输入有效的热量');return}await persist(onSaveAndContinue,next)}}>保存并继续添加</button>}<button className="primary-button" type="submit" disabled={saving}>{saving?'保存中…':entry?'保存修改':'完成'}</button></div>
  </form></Modal>
}
