import { describe, expect, it } from 'vitest'
import { parseArithmeticExpression, parseDecimal } from '../../lib/numbers'

describe('iOS decimal parsing', () => {
  it('accepts a decimal point', () => expect(parseDecimal('75.25')).toBe(75.25))
  it('accepts a decimal comma', () => expect(parseDecimal('75,25')).toBe(75.25))
  it('rejects incomplete or malformed values', () => { expect(parseDecimal('75,')).toBeUndefined(); expect(parseDecimal('7,5,2')).toBeUndefined() })
})

describe('arithmetic expression parser', () => {
  it('calculates calorie expressions using operator precedence', () => {
    expect(parseArithmeticExpression('450×80÷100')).toBe(360)
    expect(parseArithmeticExpression('300 + 120 / 2')).toBe(360)
  })
  it('accepts decimal commas and parentheses', () => {
    expect(parseArithmeticExpression('(100,5 + 20) * 2')).toBe(241)
  })
  it('rounds repeating results to two decimal places', () => {
    expect(parseArithmeticExpression('200/3')).toBe(66.67)
  })
  it('rejects incomplete, unsafe, and non-finite expressions', () => {
    expect(parseArithmeticExpression('300+')).toBeUndefined()
    expect(parseArithmeticExpression('300/0')).toBeUndefined()
    expect(parseArithmeticExpression('alert(1)')).toBeUndefined()
  })
})
