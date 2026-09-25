import { describe, expect, it } from 'vitest'
import type { DailyRecord } from '../types/record'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch, recentActivityEntriesFor, recentFoodEntriesFor } from './entries'

const legacy: DailyRecord = { id: '1', date: '2026-09-23', foodCalories: 2100, proteinGrams: 150, exerciseCalories: 350, createdAt: 'now', updatedAt: 'now' }

describe('entry migration and totals', () => {
  it('exposes legacy totals as editable entries', () => {
    expect(foodEntriesFor(legacy)).toEqual([{ id: 'legacy-food', name: '历史膳食记录', calories: 2100, proteinGrams: 150 }])
    expect(activityEntriesFor(legacy)).toEqual([{ id: 'legacy-activity', name: '历史运动记录', calories: 350 }])
  })
  it('keeps compatibility totals in sync with item lists', () => {
    expect(foodEntryPatch([{ id: 'a', name: '午餐', calories: 800.5, proteinGrams: 50.25 }, { id: 'b', name: '加餐', calories: 200.25, proteinGrams: 10.5 }])).toMatchObject({ foodCalories: 1000.75, proteinGrams: 60.75 })
    expect(activityEntryPatch([{ id: 'a', name: '力量训练', calories: 300.5 }])).toMatchObject({ exerciseCalories: 300.5 })
  })
  it('returns the latest named entries without duplicate names or legacy totals', () => {
    const records:DailyRecord[]=[
      { ...legacy, id:'old', date:'2026-09-20', foodEntries:[{id:'1',name:'鸡胸肉',calories:300,proteinGrams:45},{id:'2',name:'燕麦',calories:250}],activityEntries:[{id:'3',name:'跑步',calories:280}] },
      { ...legacy, id:'new', date:'2026-09-24', foodEntries:[{id:'4',name:'鸡胸肉',calories:320,proteinGrams:48},{id:'5',name:'快速记录',calories:100}],activityEntries:[{id:'6',name:'跑步',calories:300},{id:'7',name:'力量训练',calories:240}] },
    ]
    expect(recentFoodEntriesFor(records)).toEqual([{id:'4',name:'鸡胸肉',calories:320,proteinGrams:48},{id:'2',name:'燕麦',calories:250}])
    expect(recentActivityEntriesFor(records)).toEqual([{id:'7',name:'力量训练',calories:240},{id:'6',name:'跑步',calories:300}])
  })
  it('limits recent entries', () => {
    const record:DailyRecord={...legacy,foodEntries:Array.from({length:6},(_,index)=>({id:String(index),name:`食物${index}`,calories:100+index}))}
    expect(recentFoodEntriesFor([record],3).map(item=>item.name)).toEqual(['食物5','食物4','食物3'])
  })
})
