export const parseDecimal = (raw: string) => {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return undefined
  const value = Number(normalized)
  return Number.isFinite(value) ? value : undefined
}

export const parseArithmeticExpression = (raw: string) => {
  const source = raw
    .trim()
    .replace(/[，,]/g, '.')
    .replace(/[×xX]/g, '*')
    .replace(/÷/g, '/')
    .replace(/＋/g, '+')
    .replace(/[−–—]/g, '-')
    .replace(/\s/g, '')
  if (!source || !/^[\d.+\-*/()]+$/.test(source)) return undefined

  let index = 0
  const factor = (): number | undefined => {
    const sign = source[index] === '+' || source[index] === '-' ? source[index++] : undefined
    let value: number | undefined
    if (source[index] === '(') {
      index += 1
      value = expression()
      if (value == null || source[index] !== ')') return undefined
      index += 1
    } else {
      const match = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/)
      if (!match) return undefined
      index += match[0].length
      value = Number(match[0])
    }
    if (!Number.isFinite(value)) return undefined
    return sign === '-' ? -value : value
  }
  const term = (): number | undefined => {
    let value = factor()
    if (value == null) return undefined
    while (source[index] === '*' || source[index] === '/') {
      const operator = source[index++]
      const right = factor()
      if (right == null || (operator === '/' && right === 0)) return undefined
      value = operator === '*' ? value * right : value / right
      if (!Number.isFinite(value)) return undefined
    }
    return value
  }
  const expression = (): number | undefined => {
    let value = term()
    if (value == null) return undefined
    while (source[index] === '+' || source[index] === '-') {
      const operator = source[index++]
      const right = term()
      if (right == null) return undefined
      value = operator === '+' ? value + right : value - right
      if (!Number.isFinite(value)) return undefined
    }
    return value
  }

  const value = expression()
  if (value == null || index !== source.length) return undefined
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}
