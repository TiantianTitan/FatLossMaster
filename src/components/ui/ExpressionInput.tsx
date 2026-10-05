import { useEffect, useId, useRef } from 'react'
import { parseArithmeticExpression } from '../../lib/numbers'

const operators = [
  { value: '+', label: '＋' },
  { value: '-', label: '−' },
  { value: '×', label: '×' },
  { value: '÷', label: '÷' },
]

export function ExpressionInput({ raw, onRawChange, unit, label, placeholder, required=false, autoFocus=false, onFocus, onBlur }: {
  raw: string
  onRawChange: (raw: string) => void
  unit: string
  label: string
  placeholder?: string
  required?: boolean
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const resultId = useId()
  const result = parseArithmeticExpression(raw)
  const hasExpression = /[+\-*/×÷()]/.test(raw)
  const invalid = raw.trim() !== '' && result == null
  useEffect(()=>{inputRef.current?.setCustomValidity(invalid?'请输入有效的算式':'')},[invalid])
  const insertOperator = (operator: string) => {
    const input = inputRef.current
    const start = input?.selectionStart ?? raw.length
    const end = input?.selectionEnd ?? start
    onRawChange(`${raw.slice(0, start)}${operator}${raw.slice(end)}`)
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + operator.length, start + operator.length)
    })
  }

  return <span className={`expression-field${invalid?' invalid':''}`}>
    <span className="expression-main"><input ref={inputRef} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} autoFocus={autoFocus} required={required} aria-label={label} aria-invalid={invalid} aria-describedby={resultId} placeholder={placeholder} value={raw} onFocus={onFocus} onChange={event=>onRawChange(event.target.value)} onBlur={onBlur}/><small>{unit}</small></span>
    <span className="expression-tools"><span className="expression-operators" aria-label="运算符">{operators.map(({value,label:operatorLabel})=><button type="button" key={value} aria-label={`输入${operatorLabel}`} onPointerDown={event=>event.preventDefault()} onClick={()=>insertOperator(value)}>{operatorLabel}</button>)}</span><output id={resultId} aria-live="polite">{hasExpression ? result==null?'算式未完成':`= ${result.toLocaleString()} ${unit}` : ''}</output></span>
  </span>
}
