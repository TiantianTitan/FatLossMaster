import type { DailyRecord } from '../types/record'

export const parseBackup = (text: string): DailyRecord[] => {
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || !('version' in data) || !('records' in data) || data.version !== 1 || !Array.isArray(data.records)) throw new Error('不是有效的轻衡备份文件')
  const dates = new Set<string>()
  return data.records.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('备份中包含无效记录')
    const record = item as DailyRecord
    if (!record.id || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !record.createdAt || !record.updatedAt) throw new Error('备份记录缺少必要字段')
    if (dates.has(record.date)) throw new Error(`备份中 ${record.date} 存在重复记录`)
    dates.add(record.date)
    return record
  })
}
