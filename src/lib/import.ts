import type { DailyRecord } from '../types/record'

const validNumber=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value

export const parseBackup = (text: string): DailyRecord[] => {
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || !('version' in data) || !('records' in data) || ![1, 2, 3].includes(Number(data.version)) || !Array.isArray(data.records)) throw new Error('不是有效的轻衡备份文件')
  const dates = new Set<string>()
  return data.records.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('备份中包含无效记录')
    const record = item as DailyRecord
    if (!record.id || !validDate(record.date) || !record.createdAt || !record.updatedAt) throw new Error('备份记录缺少必要字段')
    if (record.sex != null && !['male','female'].includes(record.sex)) throw new Error(`${record.date} 的性别格式无效`)
    if (record.ageYears != null && (typeof record.ageYears !== 'number' || !Number.isFinite(record.ageYears) || record.ageYears <= 0 || record.ageYears > 130)) throw new Error(`${record.date} 的年龄无效`)
    if (record.sleepHours != null && (typeof record.sleepHours !== 'number' || !Number.isFinite(record.sleepHours) || record.sleepHours < 0 || record.sleepHours > 24)) throw new Error(`${record.date} 的睡眠时间无效`)
    if (record.stepCount != null && (typeof record.stepCount !== 'number' || !Number.isFinite(record.stepCount) || record.stepCount < 0 || record.stepCount > 200000)) throw new Error(`${record.date} 的步数无效`)
    if (record.heightCm != null&&!validNumber(record.heightCm,50,260)) throw new Error(`${record.date} 的身高无效`)
    if (record.weightKg != null&&!validNumber(record.weightKg,10,500)) throw new Error(`${record.date} 的体重无效`)
    if (record.waistCm != null&&!validNumber(record.waistCm,20,300)) throw new Error(`${record.date} 的腰围无效`)
    if (record.restingCalories != null&&!validNumber(record.restingCalories,500,5000)) throw new Error(`${record.date} 的静息消耗无效`)
    if (record.dailyCalories != null&&!validNumber(record.dailyCalories,0,5000)) throw new Error(`${record.date} 的日常消耗无效`)
    if (record.exerciseCalories != null&&!validNumber(record.exerciseCalories,0,10000)) throw new Error(`${record.date} 的运动消耗无效`)
    if (record.foodCalories != null&&!validNumber(record.foodCalories,0,20000)) throw new Error(`${record.date} 的摄入热量无效`)
    if (record.proteinGrams != null&&!validNumber(record.proteinGrams,0,1000)) throw new Error(`${record.date} 的蛋白质无效`)
    if (record.activityLevel != null&&!['sedentary','standing','walking','physical'].includes(record.activityLevel)) throw new Error(`${record.date} 的活动档位无效`)
    if (record.restingMode != null&&!['auto','manual'].includes(record.restingMode)) throw new Error(`${record.date} 的静息模式无效`)
    if (record.foodEntries != null && (!Array.isArray(record.foodEntries) || record.foodEntries.some(entry => !entry?.id || typeof entry.name !== 'string' || !validNumber(entry.calories,0,20000) || (entry.proteinGrams != null && !validNumber(entry.proteinGrams,0,1000))))) throw new Error(`${record.date} 的膳食单项格式无效`)
    if (record.activityEntries != null && (!Array.isArray(record.activityEntries) || record.activityEntries.some(entry => !entry?.id || typeof entry.name !== 'string' || !validNumber(entry.calories,0,10000) || (entry.includedInSteps != null && typeof entry.includedInSteps !== 'boolean')))) throw new Error(`${record.date} 的运动单项格式无效`)
    if (dates.has(record.date)) throw new Error(`备份中 ${record.date} 存在重复记录`)
    dates.add(record.date)
    return record
  })
}
