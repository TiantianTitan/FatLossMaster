import { UserRound } from 'lucide-react'
import { useState } from 'react'
import type { Sex } from '../../types/record'
import { DecimalInput } from '../ui/DecimalInput'
import { Modal } from '../ui/Modal'

export function DemographicSetup({ initialAge, initialSex, onSave }: { initialAge?: number; initialSex?: Sex; onSave: (profile: { ageYears: number; sex: Sex }) => Promise<void> }) {
  const [ageYears,setAge]=useState(initialAge),[sex,setSex]=useState(initialSex),[error,setError]=useState(''),[saving,setSaving]=useState(false)
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(ageYears==null||ageYears<=0||ageYears>130||!sex){setError('请选择性别并填写有效年龄');return}setSaving(true);setError('');try{await onSave({ageYears,sex})}catch{setError('保存失败，请重试');setSaving(false)}}
  return <Modal title="基础资料" dismissible={false} onClose={()=>{}}><form className="entry-form onboarding-form" onSubmit={submit}><div className="profile-note"><UserRound size={20}/><p>用于估算静息消耗</p></div><div className="profile-field"><span>性别</span><div className="sex-picker" role="group" aria-label="性别"><button type="button" aria-pressed={sex==='male'} className={sex==='male'?'active':''} onClick={()=>{setSex('male');setError('')}}>男</button><button type="button" aria-pressed={sex==='female'} className={sex==='female'?'active':''} onClick={()=>{setSex('female');setError('')}}>女</button></div></div><label><span>年龄</span><span className="unit-input"><DecimalInput required value={ageYears} onValueChange={value=>{setAge(value);setError('')}} placeholder="例如 30"/><small>岁</small></span></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={saving}>{saving?'保存中…':'开始使用'}</button></form></Modal>
}
