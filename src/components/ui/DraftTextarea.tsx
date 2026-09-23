import { useEffect, useRef } from 'react'

export function DraftTextarea({value,onCommit,...props}:{value?:string;onCommit:(value:string)=>void}&Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>,'value'|'defaultValue'|'onBlur'>){
  const ref=useRef<HTMLTextAreaElement>(null)
  useEffect(()=>{if(ref.current&&document.activeElement!==ref.current)ref.current.value=value??''},[value])
  return <textarea ref={ref} defaultValue={value??''} {...props} onBlur={event=>{if(event.target.value!==(value??''))onCommit(event.target.value)}}/>
}
