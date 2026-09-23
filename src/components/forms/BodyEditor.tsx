import { UserRound } from 'lucide-react'
import { useState } from 'react'
import type { BodyProfile } from '../../types/record'
import { Modal } from '../ui/Modal'
import { DecimalInput } from '../ui/DecimalInput'

export function BodyEditor({value,onSave,onClose}:{value:BodyProfile;onSave:(body:BodyProfile)=>Promise<void>;onClose:()=>void}){
  const [heightCm,setHeight]=useState(value.heightCm),[weightKg,setWeight]=useState(value.weightKg),[waistCm,setWaist]=useState(value.waistCm),[saving,setSaving]=useState(false)
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(heightCm==null&&weightKg==null&&waistCm==null)return;setSaving(true);await onSave({heightCm,weightKg,waistCm})}
  return <Modal title="身体测量" onClose={onClose}><form className="entry-form body-editor" onSubmit={submit}><div className="profile-note"><UserRound size={20}/><p>身体数据不需要每天填写。更新时会记录到今天，并作为之后记录的参考值。</p></div><label><span>身高</span><span className="unit-input"><DecimalInput value={heightCm} onValueChange={setHeight} placeholder="175"/><small>cm</small></span></label><label><span>体重</span><span className="unit-input"><DecimalInput value={weightKg} onValueChange={setWeight} placeholder="75,25"/><small>kg</small></span></label><label><span>腰围</span><span className="unit-input"><DecimalInput value={waistCm} onValueChange={setWaist} placeholder="84,5"/><small>cm</small></span></label><button className="primary-button" disabled={saving}>{saving?'保存中…':'保存本次测量'}</button></form></Modal>
}
