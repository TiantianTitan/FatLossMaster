import { useEffect, useRef, useState } from 'react'
import { parseArithmeticExpression } from '../../lib/numbers'
import { ExpressionInput } from './ExpressionInput'

export function DecimalInput({ value, onValueChange, label, placeholder, required=false, unit='', commitOnBlur=false }: { value?: number; onValueChange: (value?: number) => void; label: string; placeholder?: string; required?: boolean; unit?: string; commitOnBlur?: boolean }) {
  const [raw,setRaw]=useState(value == null ? '' : String(value))
  const focusedRef=useRef(false)
  useEffect(()=>{if(!focusedRef.current)setRaw(value == null ? '' : String(value))},[value])
  const change=(next:string)=>{
    setRaw(next)
    if(!commitOnBlur)onValueChange(next.trim()===''?undefined:parseArithmeticExpression(next))
  }
  const commit=()=>{
    focusedRef.current=false
    const result=parseArithmeticExpression(raw)
    if(raw.trim()===''){onValueChange(undefined);return}
    if(result!=null){setRaw(String(result));onValueChange(result)}
  }
  return <ExpressionInput raw={raw} onRawChange={change} onFocus={()=>{focusedRef.current=true}} onBlur={commit} unit={unit} label={label} placeholder={placeholder} required={required}/>
}
