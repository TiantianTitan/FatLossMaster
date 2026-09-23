import type { DailyRecord } from '../types/record'

export const parseBackup = (text: string): DailyRecord[] => {
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || !('version' in data) || !('records' in data) || ![1, 2].includes(Number(data.version)) || !Array.isArray(data.records)) throw new Error('不是有效的轻衡备份文件')
  const dates = new Set<string>()
  return data.records.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('备份中包含无效记录')
    const record = item as DailyRecord
    if (!record.id || !/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !record.createdAt || !record.updatedAt) throw new Error('备份记录缺少必要字段')
    if (record.sleepHours != null && (typeof record.sleepHours !== 'number' || !Number.isFinite(record.sleepHours) || record.sleepHours < 0 || record.sleepHours > 24)) throw new Error(`${record.date} 的睡眠时间无效`)
    if (record.foodEntries != null && (!Array.isArray(record.foodEntries) || record.foodEntries.some(entry => !entry?.id || typeof entry.name !== 'string' || typeof entry.calories !== 'number' || (entry.proteinGrams != null && typeof entry.proteinGrams !== 'number')))) throw new Error(`${record.date} 的膳食单项格式无效`)
    if (record.activityEntries != null && (!Array.isArray(record.activityEntries) || record.activityEntries.some(entry => !entry?.id || typeof entry.name !== 'string' || typeof entry.calories !== 'number'))) throw new Error(`${record.date} 的运动单项格式无效`)
    if (dates.has(record.date)) throw new Error(`备份中 ${record.date} 存在重复记录`)
    dates.add(record.date)
    return record
  })
}
