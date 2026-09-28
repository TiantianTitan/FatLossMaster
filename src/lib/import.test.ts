import { describe, expect, it } from 'vitest'
import { buildBackupPayload } from './export'
import { parseBackup, parseBackupPackage, parseCSV, parseImport } from './import'
import type { DailyRecord } from '../types/record'

const record:DailyRecord={id:'record-1',date:'2026-09-24',weightKg:70.2,createdAt:'2026-09-24T08:00:00.000Z',updatedAt:'2026-09-24T08:00:00.000Z'}
const legacyBase = { id: '1', date: '2026-09-23', createdAt: '2026-09-23T00:00:00Z', updatedAt: '2026-09-23T00:00:00Z' }

describe('data import',()=>{
  it('imports the compact Chinese CSV format with dot dates and blank cells',()=>{
    const csv='日期,运动热量(kcal),全天进食(kcal),全天蛋白质(g),体重(kg),睡眠(h)\n2026.09.14,635,1752,117,72.2,8.25\n2026.09.18,260,1624,118,,\n'
    const result=parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({date:'2026-09-14',exerciseCalories:635,foodCalories:1752,proteinGrams:117,weightKg:72.2,sleepHours:8.25})
    expect(result[1]).toMatchObject({date:'2026-09-18',exerciseCalories:260,foodCalories:1624,proteinGrams:118})
    expect(result[1].weightKg).toBeUndefined()
  })

  it('imports app CSV columns and preserves quoted notes',()=>{
    const csv='date,sex,ageYears,heightCm,weightKg,waistCm,sleepHours,stepCount,restingCalories,dailyCalories,exerciseCalories,totalCalories,foodCalories,proteinGrams,calorieDeficit,notes\n"2026-09-24","male","30","176","70.2","","7.5","10000","1660","332","350","2342","1680","120","662","状态不错, ""力量训练"""'
    expect(parseCSV(csv)[0]).toMatchObject({date:'2026-09-24',sex:'male',ageYears:30,heightCm:176,weightKg:70.2,sleepHours:7.5,stepCount:10000,restingCalories:1660,dailyCalories:332,exerciseCalories:350,foodCalories:1680,proteinGrams:120,notes:'状态不错, "力量训练"'})
  })

  it('recognizes the steps column used by earlier app exports',()=>{
    const csv='date,sex,ageYears,heightCm,weightKg,sleepHours,restingCalories,dailyCalories,exerciseCalories,foodCalories,proteinGrams,notes,steps\n2026-09-14,male,29,178.5,72.2,8.25,1697.6,339.5,505,1752,117,,7330'
    expect(parseCSV(csv)[0]).toMatchObject({date:'2026-09-14',weightKg:72.2,sleepHours:8.25,stepCount:7330})
  })

  it('supports semicolon CSV with decimal commas',()=>{
    expect(parseCSV('日期;体重(kg);睡眠(h)\n2026/09/24;70,2;7,5')[0]).toMatchObject({date:'2026-09-24',weightKg:70.2,sleepHours:7.5})
  })

  it('rejects duplicate dates and invalid values',()=>{
    expect(()=>parseCSV('日期,体重(kg)\n2026-09-24,70\n2026-09-24,71')).toThrow('重复记录')
    expect(()=>parseCSV('日期,睡眠(h)\n2026-02-30,8')).toThrow('日期无效')
    expect(()=>parseCSV('日期,睡眠(h)\n2026-09-24,25')).toThrow('睡眠时间无效')
  })

  it('reads version 4 preferences while preserving the old records-only API',()=>{
    const json=JSON.stringify(buildBackupPayload([record],{proteinTargetGrams:125.5}))
    expect(parseBackupPackage(json)).toMatchObject({source:'json',preferences:{proteinTargetGrams:125.5},records:[record]})
    expect(parseBackup(json)).toEqual([record])
  })

  it('preserves an explicitly empty version 4 preference set',()=>{
    expect(parseBackupPackage(JSON.stringify(buildBackupPayload([record],{}))).preferences).toEqual({})
  })

  it('rejects duplicate record and entry identifiers before replacement can lose data',()=>{
    expect(()=>parseBackup(JSON.stringify({version:4,records:[record,{...record,date:'2026-09-25'}]}))).toThrow('记录 ID')
    expect(()=>parseBackup(JSON.stringify({version:4,records:[{...record,foodEntries:[{id:'same',name:'早餐',calories:300},{id:'same',name:'午餐',calories:500}]}]}))).toThrow('膳食单项格式无效')
  })

  it('rejects non-string identifiers, timestamps and notes',()=>{
    expect(()=>parseBackup(JSON.stringify({version:4,records:[{...record,id:12}]}))).toThrow('缺少必要字段')
    expect(()=>parseBackup(JSON.stringify({version:4,records:[{...record,createdAt:123}]}))).toThrow('缺少必要字段')
    expect(()=>parseBackup(JSON.stringify({version:4,records:[{...record,notes:{text:'bad'}}]}))).toThrow('备注格式无效')
  })

  it('keeps version 1 to 3 backups compatible and detects imports by content',()=>{
    for(const version of [1,2,3])expect(parseBackupPackage(JSON.stringify({version,records:[record]})).records).toEqual([record])
    expect(parseImport(JSON.stringify({version:3,records:[record]}),'backup').source).toBe('json')
  })
})

describe('backup import compatibility', () => {
  it('accepts legacy version 1 backups', () => expect(parseBackup(JSON.stringify({ version: 1, records: [{ ...legacyBase, foodCalories: 2000 }] }))).toHaveLength(1))
  it('accepts version 2 item lists', () => expect(parseBackup(JSON.stringify({ version: 2, records: [{ ...legacyBase, foodEntries: [{ id: 'f', name: '午餐', calories: 800 }] }] }))[0].foodEntries).toHaveLength(1))
  it('accepts valid metabolic profile fields', () => expect(parseBackup(JSON.stringify({ version: 2, records: [{ ...legacyBase, sex:'female',ageYears:30 }] }))[0]).toMatchObject({sex:'female',ageYears:30}))
  it('rejects invalid metabolic profile fields', () => expect(() => parseBackup(JSON.stringify({ version: 2, records: [{ ...legacyBase, sex:'other',ageYears:200 }] }))).toThrow('性别格式无效'))
  it('rejects malformed item lists', () => expect(() => parseBackup(JSON.stringify({ version: 2, records: [{ ...legacyBase, foodEntries: [{ name: '午餐' }] }] }))).toThrow('膳食单项格式无效'))
  it('accepts version 3 steps and included-in-steps activity metadata', () => expect(parseBackup(JSON.stringify({ version: 3, records: [{ ...legacyBase, stepCount: 8500.5, activityEntries: [{ id:'a',name:'跑步',calories:300,includedInSteps:true }] }] }))[0]).toMatchObject({stepCount:8500.5}))
  it('rejects invalid step counts', () => expect(() => parseBackup(JSON.stringify({ version: 3, records: [{ ...legacyBase, stepCount: -1 }] }))).toThrow('步数无效'))
  it('rejects impossible body measurements', () => expect(() => parseBackup(JSON.stringify({ version: 3, records: [{ ...legacyBase, weightKg: 0 }] }))).toThrow('体重无效'))
  it('rejects invalid dates and non-finite nutrition values', () => {
    expect(() => parseBackup(JSON.stringify({ version: 3, records: [{ ...legacyBase, date: '2026-02-31' }] }))).toThrow('缺少必要字段')
    expect(() => parseBackup(JSON.stringify({ version: 3, records: [{ ...legacyBase, proteinGrams: -1 }] }))).toThrow('蛋白质无效')
  })
})
