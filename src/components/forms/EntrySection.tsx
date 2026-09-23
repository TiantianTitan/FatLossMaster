import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ActivityEntry, FoodEntry } from '../../types/record'
import { Modal } from '../ui/Modal'

type Kind = 'food' | 'activity'
type Entry = FoodEntry | ActivityEntry

export function EntrySection({ kind, entries, onChange }: { kind: Kind; entries: Entry[]; onChange: (entries: Entry[]) => void }) {
  const [editing, setEditing] = useState<Entry | null | undefined>(undefined)
  const [editorVersion, setEditorVersion] = useState(0)
  const isFood = kind === 'food'
  const save = (entry: Entry) => {
    const next = editing ? entries.map(item => item.id === editing.id ? entry : item) : [...entries, entry]
    onChange(next); setEditing(undefined)
  }
  const saveAndContinue = (entry: Entry) => { onChange([...entries, entry]); setEditorVersion(version => version + 1) }
  return <section className="form-section entry-section">
    <div className="form-title-row"><h2>{isFood ? '膳食单项' : '额外运动记录'}</h2><button onClick={() => setEditing(null)}><Plus size={15}/>{isFood ? '添加膳食' : '添加运动'}</button></div>
    <div className="entry-card">
      {entries.length === 0 ? <button className="entry-empty" onClick={() => setEditing(null)}><Plus size={20}/><span>{isFood ? '添加今天吃过的食物或餐点' : '添加健身、跑步等额外消耗'}</span></button> : entries.map(entry => <div className="entry-row" key={entry.id}>
        <div><strong>{entry.name}</strong><span>{entry.calories.toLocaleString()} kcal{isFood && 'proteinGrams' in entry && entry.proteinGrams != null ? ` · 蛋白质 ${entry.proteinGrams} g` : ''}</span></div>
        <button onClick={() => setEditing(entry)} aria-label={`修改${entry.name}`}><Pencil size={16}/></button>
        <button className="entry-delete" onClick={() => onChange(entries.filter(item => item.id !== entry.id))} aria-label={`删除${entry.name}`}><Trash2 size={16}/></button>
      </div>)}
    </div>
    {editing !== undefined && <EntryEditor key={editorVersion} kind={kind} entry={editing} onSave={save} onSaveAndContinue={editing ? undefined : saveAndContinue} onClose={() => setEditing(undefined)}/>} 
  </section>
}

function EntryEditor({ kind, entry, onSave, onSaveAndContinue, onClose }: { kind: Kind; entry: Entry | null; onSave: (entry: Entry) => void; onSaveAndContinue?: (entry: Entry) => void; onClose: () => void }) {
  const [name, setName] = useState(entry?.name ?? '')
  const [calories, setCalories] = useState(entry?.calories?.toString() ?? '')
  const [protein, setProtein] = useState(entry && 'proteinGrams' in entry ? entry.proteinGrams?.toString() ?? '' : '')
  const isFood = kind === 'food'
  const buildEntry = () => {
    const value = Number(calories); if (!value || value < 0) return
    const base = { id: entry?.id ?? crypto.randomUUID(), name: name.trim() || (isFood ? '快速记录' : '运动记录'), calories: value }
    return isFood ? { ...base, proteinGrams: protein === '' ? undefined : Number(protein) } : base
  }
  const submit = (event: React.FormEvent) => { event.preventDefault(); const next = buildEntry(); if (next) onSave(next) }
  return <Modal title={entry ? `修改${isFood ? '膳食' : '运动'}` : `添加${isFood ? '膳食' : '运动'}`} onClose={onClose}><form className="entry-form" onSubmit={submit}>
    <label><span>名称</span><input autoFocus placeholder={isFood ? '例如：鸡胸肉午餐' : '例如：力量训练'} value={name} onChange={e => setName(e.target.value)}/></label>
    <label><span>{isFood ? '膳食热量' : '运动消耗'}</span><span className="unit-input"><input required inputMode="numeric" type="number" min="1" placeholder="0" value={calories} onChange={e => setCalories(e.target.value)}/><small>kcal</small></span></label>
    {isFood && <label><span>蛋白质</span><span className="unit-input"><input inputMode="decimal" type="number" min="0" step="0.1" placeholder="可选" value={protein} onChange={e => setProtein(e.target.value)}/><small>g</small></span></label>}
    <div className="entry-form-actions">{onSaveAndContinue && <button className="secondary-button" type="button" onClick={() => { const next=buildEntry(); if(next) onSaveAndContinue(next) }}>保存并继续添加</button>}<button className="primary-button" type="submit">{entry ? '保存修改' : '完成'}</button></div>
  </form></Modal>
}
