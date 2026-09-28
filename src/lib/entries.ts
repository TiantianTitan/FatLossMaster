import type { ActivityEntry, DailyRecord, FoodEntry } from '../types/record'

export const foodEntriesFor = (record: DailyRecord): FoodEntry[] => record.foodEntries ?? (record.foodCalories != null || record.proteinGrams != null ? [{ id: 'legacy-food', name: '历史膳食记录', calories: record.foodCalories ?? 0, proteinGrams: record.proteinGrams }] : [])

export const activityEntriesFor = (record: DailyRecord): ActivityEntry[] => record.activityEntries ?? (record.exerciseCalories != null ? [{ id: 'legacy-activity', name: '历史运动记录', calories: record.exerciseCalories }] : [])

export const foodEntryPatch = (entries: FoodEntry[]): Partial<DailyRecord> => ({
  foodEntries: entries,
  foodCalories: entries.reduce((sum, item) => sum + item.calories, 0),
  proteinGrams: entries.reduce((sum, item) => sum + (item.proteinGrams ?? 0), 0),
})

export const activityEntryPatch = (entries: ActivityEntry[]): Partial<DailyRecord> => ({
  activityEntries: entries,
  exerciseCalories: entries.reduce((sum, item) => sum + item.calories, 0),
})

export const removeEntryById = <T extends FoodEntry | ActivityEntry>(entries: T[], id: string) => {
  const index = entries.findIndex(entry => entry.id === id)
  if (index < 0) return { entries, removed: undefined }
  return { entries: entries.filter(entry => entry.id !== id), removed: { entry: entries[index], index } }
}

export const restoreEntryAt = <T extends FoodEntry | ActivityEntry>(entries: T[], entry: T, index: number) => {
  if (entries.some(item => item.id === entry.id)) return entries
  const restored = [...entries]
  restored.splice(Math.min(Math.max(index, 0), restored.length), 0, entry)
  return restored
}

const recentEntries = <T extends FoodEntry | ActivityEntry>(records: DailyRecord[], pick: (record: DailyRecord) => T[], limit: number) => {
  const result:T[]=[]
  const seen=new Set<string>()
  const sorted=[...records].sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt))
  for(const record of sorted){
    const entries=pick(record)
    for(let index=entries.length-1;index>=0;index-=1){
      const entry=entries[index],name=entry.name.trim()
      if(entry.id.startsWith('legacy-')||name==='快速记录'||name==='运动记录')continue
      const key=name.toLocaleLowerCase()
      if(seen.has(key))continue
      seen.add(key);result.push(entry)
      if(result.length===limit)return result
    }
  }
  return result
}

export const recentFoodEntriesFor = (records: DailyRecord[], limit=5) => recentEntries(records, foodEntriesFor, limit)
export const recentActivityEntriesFor = (records: DailyRecord[], limit=5) => recentEntries(records, activityEntriesFor, limit)
