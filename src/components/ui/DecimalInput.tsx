import { useEffect, useRef } from 'react'
import { parseDecimal } from '../../lib/numbers'

export function DecimalInput({ value, onValueChange, placeholder, required=false, className }: { value?: number; onValueChange: (value?: number) => void; placeholder?: string; required?: boolean; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) inputRef.current.value = value == null ? '' : String(value)
  }, [value])
  return <input ref={inputRef} className={className} type="text" inputMode="decimal" autoComplete="off" required={required} placeholder={placeholder} defaultValue={value ?? ''} onChange={event => {
    const raw = event.target.value
    if (raw === '') onValueChange(undefined)
    else if (!/[.,]$/.test(raw)) { const parsed = parseDecimal(raw); if (parsed != null) onValueChange(parsed) }
  }} onBlur={event => { const parsed=parseDecimal(event.target.value); event.target.value=parsed == null ? '' : String(parsed); onValueChange(parsed) }}/>
}
