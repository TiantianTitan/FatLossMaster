import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
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
  const insertedOnPointerDown = useRef(false)
  const pendingCaret = useRef<number | null>(null)
  const resultId = useId()
  const result = parseArithmeticExpression(raw)
  const hasExpression = /[+\-*/×÷()]/.test(raw)
  const invalid = raw.trim() !== '' && result == null
  useEffect(()=>{inputRef.current?.setCustomValidity(invalid?'请输入有效的算式':'')},[invalid])
  useLayoutEffect(() => {
    if (pendingCaret.current == null) return
    const input = inputRef.current
    const caret = pendingCaret.current
    pendingCaret.current = null
    input?.focus({ preventScroll: true })
    input?.setSelectionRange(caret, caret)
  }, [raw])
  const insertOperator = (operator: string) => {
    const input = inputRef.current
    const start = input?.selectionStart ?? raw.length
    const end = input?.selectionEnd ?? start
    pendingCaret.current = start + operator.length
    input?.focus({ preventScroll: true })
    onRawChange(`${raw.slice(0, start)}${operator}${raw.slice(end)}`)
  }
  const pressOperator = (event: PointerEvent<HTMLButtonElement>, operator: string) => {
    event.preventDefault()
    insertedOnPointerDown.current = event.pointerType !== 'mouse'
    if (insertedOnPointerDown.current) insertOperator(operator)
  }
  const clickOperator = (event: MouseEvent<HTMLButtonElement>, operator: string) => {
    // Touch can also dispatch click after pointerdown; do not insert twice.
    if (!insertedOnPointerDown.current || event.detail === 0) insertOperator(operator)
    insertedOnPointerDown.current = false
  }

  return <span className={`expression-field${invalid?' invalid':''}`}>
    <span className="expression-main"><input ref={inputRef} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} autoFocus={autoFocus} required={required} aria-label={label} aria-invalid={invalid} aria-describedby={resultId} placeholder={placeholder} value={raw} onFocus={onFocus} onChange={event=>onRawChange(event.target.value)} onBlur={onBlur}/><small>{unit}</small></span>
    <span className="expression-tools"><span className="expression-operators" aria-label="运算符">{operators.map(({value,label:operatorLabel})=><button type="button" key={value} aria-label={`输入${operatorLabel}`} onPointerDown={event=>pressOperator(event,value)} onClick={event=>clickOperator(event,value)}>{operatorLabel}</button>)}</span><output id={resultId} aria-live="polite">{hasExpression ? result==null?'算式未完成':`= ${result.toLocaleString()} ${unit}` : ''}</output></span>
  </span>
}
