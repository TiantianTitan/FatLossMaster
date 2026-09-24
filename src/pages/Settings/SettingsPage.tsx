import { ChevronRight, Database, Download, FileJson, Info, LockKeyhole, Moon, Pencil, RotateCcw, Ruler, SunMedium, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { BodyProfile, DailyRecord, ThemeMode } from '../../types/record'
import { exportCSV, exportJSON } from '../../lib/export'
import { parseBackup } from '../../lib/import'
import { clearRecords, mergeRecords, replaceRecords } from '../../db/records'
import { Modal } from '../../components/ui/Modal'
import { Toast } from '../../components/ui/Toast'
import { BodyEditor } from '../../components/forms/BodyEditor'
import { calculateBMI } from '../../lib/calculations'

export function SettingsPage({records,bodyDefaults,onUpdateBody,theme,setTheme,onRecordsChange}:{records:DailyRecord[];bodyDefaults:BodyProfile;onUpdateBody:(body:BodyProfile)=>Promise<void>;theme:ThemeMode;setTheme:(t:ThemeMode)=>void;onRecordsChange:()=>void}) {
 const fileRef=useRef<HTMLInputElement>(null),[pending,setPending]=useState<DailyRecord[]|null>(null),[toast,setToast]=useState(''),[editingBody,setEditingBody]=useState(false)
 const show=(message:string)=>{setToast(message);setTimeout(()=>setToast(''),1800)}
 const pick=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0]; if(!file)return; try{setPending(parseBackup(await file.text()))}catch(error){show(error instanceof Error?error.message:'无法读取备份')} finally {e.target.value=''} }
 const restore=async(mode:'merge'|'replace')=>{if(!pending)return;if(mode==='merge')await mergeRecords(pending);else await replaceRecords(pending);setPending(null);onRecordsChange();show(`已恢复 ${pending.length} 条记录`)}
 const erase=async()=>{if(!confirm('确认清空所有健康记录？此操作无法撤销，请先导出 JSON 备份。'))return;if(!confirm('再次确认：永久删除所有本地数据？'))return;await clearRecords();onRecordsChange();show('所有记录已清空')}
 const appearances:Array<[ThemeMode,string,typeof SunMedium]>=[['system','跟随系统',SunMedium],['light','浅色',SunMedium],['dark','深色',Moon]]
 return <main className="page settings-page"><header className="page-header"><div><p className="eyebrow">本机与隐私</p><h1>设置</h1></div></header>
  <section className="settings-section"><h2>身体资料</h2><button className="measurement-card" onClick={()=>setEditingBody(true)}><span className="measurement-symbol"><Ruler size={22}/></span><span><strong>{bodyDefaults.weightKg?.toLocaleString()??'—'} kg</strong><em>{bodyDefaults.sex==='male'?'男':bodyDefaults.sex==='female'?'女':'性别未填'} · {bodyDefaults.ageYears?.toLocaleString()??'—'} 岁 · {bodyDefaults.heightCm?.toLocaleString()??'—'} cm · BMI {calculateBMI(bodyDefaults.weightKg,bodyDefaults.heightCm)?.toFixed(1)??'—'}</em></span><Pencil size={17}/></button></section>
  <section className="settings-section"><h2>外观</h2><div className="appearance-grid">{appearances.map(([id,label,Icon])=><button key={id} aria-pressed={theme===id} className={theme===id?'active':''} onClick={()=>setTheme(id)}><Icon size={20}/><span>{label}</span></button>)}</div></section>
  <section className="settings-section"><h2>数据管理</h2><div className="settings-card"><button onClick={()=>{exportCSV(records);show('CSV 已导出')}}><span className="setting-icon"><Download/></span><span><strong>导出 CSV</strong></span><ChevronRight/></button><button onClick={()=>{exportJSON(records);show('JSON 备份已导出')}}><span className="setting-icon"><FileJson/></span><span><strong>导出 JSON</strong><small>完整备份</small></span><ChevronRight/></button><button onClick={()=>fileRef.current?.click()}><span className="setting-icon"><RotateCcw/></span><span><strong>恢复 JSON</strong></span><ChevronRight/></button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={pick}/><button className="destructive" onClick={erase}><span className="setting-icon"><Trash2/></span><span><strong>清空所有数据</strong><small>不可恢复</small></span><ChevronRight/></button></div></section>
  <section className="privacy-card"><LockKeyhole size={25}/><div><strong>仅保存在本机</strong><p>请定期导出 JSON 备份。</p></div></section>
  <section className="settings-section"><h2>单位</h2><div className="unit-row"><span>体重 <strong>kg</strong></span><span>长度 <strong>cm</strong></span><span>能量 <strong>kcal</strong></span></div></section>
  <section className="settings-section"><h2>关于</h2><div className="settings-card"><div className="setting-static"><span className="setting-icon"><Database/></span><span><strong>存储方式</strong><small>IndexedDB · 仅此设备</small></span></div><div className="setting-static"><span className="setting-icon"><Info/></span><span><strong>轻衡</strong><small>版本 1.0.0</small></span></div></div></section>
  {editingBody&&<BodyEditor value={bodyDefaults} onClose={()=>setEditingBody(false)} onSave={async body=>{await onUpdateBody(body);setEditingBody(false);show('身体资料已保存')}}/>}{pending&&<Modal title="恢复数据" onClose={()=>setPending(null)}><div className="restore-copy"><strong>{pending.length} 条记录</strong><p>合并保留现有数据；覆盖将替换全部数据。</p></div><div className="modal-actions"><button className="secondary-button" onClick={()=>restore('merge')}>合并</button><button className="danger-fill" onClick={()=>restore('replace')}>覆盖</button></div></Modal>}{toast&&<Toast>{toast}</Toast>}
 </main>
}
