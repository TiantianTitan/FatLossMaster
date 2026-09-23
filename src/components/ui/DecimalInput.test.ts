import { describe, expect, it } from 'vitest'
import { parseDecimal } from '../../lib/numbers'

describe('iOS decimal parsing', () => {
  it('accepts a decimal point', () => expect(parseDecimal('75.25')).toBe(75.25))
  it('accepts a decimal comma', () => expect(parseDecimal('75,25')).toBe(75.25))
  it('rejects incomplete or malformed values', () => { expect(parseDecimal('75,')).toBeUndefined(); expect(parseDecimal('7,5,2')).toBeUndefined() })
})
