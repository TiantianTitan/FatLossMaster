export const parseDecimal = (raw: string) => {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) return undefined
  const value = Number(normalized)
  return Number.isFinite(value) ? value : undefined
}
