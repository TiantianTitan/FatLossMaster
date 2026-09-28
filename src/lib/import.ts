import type { ActivityLevel, AppPreferences, DailyRecord, Sex } from '../types/record'

const validNumber=(value:unknown,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value

export interface ParsedImport {
  records: DailyRecord[]
  preferences?: AppPreferences
  source: 'json' | 'csv'
}

const validateRecords = (records: unknown[]): DailyRecord[] => {
  const dates = new Set<string>()
  const ids = new Set<string>()
  return records.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('备份中包含无效记录')
    const record = item as DailyRecord
    if (typeof record.id !== 'string' || !record.id || typeof record.date !== 'string' || !validDate(record.date) || typeof record.createdAt !== 'string' || !record.createdAt || typeof record.updatedAt !== 'string' || !record.updatedAt) throw new Error('备份记录缺少必要字段')
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
    if (record.notes != null && typeof record.notes !== 'string') throw new Error(`${record.date} 的备注格式无效`)
    if (record.foodEntries != null && (!Array.isArray(record.foodEntries) || record.foodEntries.some(entry => typeof entry?.id !== 'string' || !entry.id || typeof entry.name !== 'string' || !validNumber(entry.calories,0,20000) || (entry.proteinGrams != null && !validNumber(entry.proteinGrams,0,1000))) || new Set(record.foodEntries.map(entry=>entry.id)).size!==record.foodEntries.length)) throw new Error(`${record.date} 的膳食单项格式无效`)
    if (record.activityEntries != null && (!Array.isArray(record.activityEntries) || record.activityEntries.some(entry => typeof entry?.id !== 'string' || !entry.id || typeof entry.name !== 'string' || !validNumber(entry.calories,0,10000) || (entry.includedInSteps != null && typeof entry.includedInSteps !== 'boolean')) || new Set(record.activityEntries.map(entry=>entry.id)).size!==record.activityEntries.length)) throw new Error(`${record.date} 的运动单项格式无效`)
    if (dates.has(record.date)) throw new Error(`备份中 ${record.date} 存在重复记录`)
    if (ids.has(record.id)) throw new Error(`备份中记录 ID ${record.id} 重复`)
    dates.add(record.date)
    ids.add(record.id)
    return record
  })
}

export const parseBackupPackage = (text: string): ParsedImport => {
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || !('version' in data) || !('records' in data) || ![1, 2, 3, 4].includes(Number(data.version)) || !Array.isArray(data.records)) throw new Error('不是有效的轻衡备份文件')
  const rawPreferences = 'preferences' in data ? data.preferences : undefined
  let preferences: AppPreferences | undefined
  if (rawPreferences != null) {
    if (typeof rawPreferences !== 'object' || Array.isArray(rawPreferences)) throw new Error('备份中的目标设置无效')
    const target = (rawPreferences as AppPreferences).proteinTargetGrams
    if (target != null && !validNumber(target,10,500)) throw new Error('备份中的蛋白质目标无效')
    preferences = target == null ? {} : { proteinTargetGrams: target }
  }
  return { records: validateRecords(data.records), preferences, source: 'json' }
}

export const parseBackup = (text: string): DailyRecord[] => parseBackupPackage(text).records

const csvRows = (text:string,delimiter:string) => {
  const rows:string[][]=[]
  let row:string[]=[],cell='',quoted=false
  const input=text.replace(/^\ufeff/,'')
  for(let index=0;index<input.length;index+=1){
    const character=input[index]
    if(character==='"'){
      if(quoted&&input[index+1]==='"'){cell+='"';index+=1}else quoted=!quoted
    }else if(character===delimiter&&!quoted){row.push(cell);cell=''}
    else if((character==='\n'||character==='\r')&&!quoted){if(character==='\r'&&input[index+1]==='\n')index+=1;row.push(cell);if(row.some(value=>value.trim()))rows.push(row);row=[];cell=''}
    else cell+=character
  }
  if(quoted)throw new Error('CSV 中有未闭合的引号')
  row.push(cell);if(row.some(value=>value.trim()))rows.push(row)
  return rows
}

const delimiterFor=(text:string)=>{
  const firstLine=text.replace(/^\ufeff/,'').split(/\r?\n/,1)[0]??''
  const count=(delimiter:string)=>{let total=0,quoted=false;for(let index=0;index<firstLine.length;index+=1){if(firstLine[index]==='"'){if(quoted&&firstLine[index+1]==='"')index+=1;else quoted=!quoted}else if(firstLine[index]===delimiter&&!quoted)total+=1}return total}
  return [',','\t',';'].sort((a,b)=>count(b)-count(a))[0]
}
const normalizedHeader=(value:string)=>value.trim().replace(/^\ufeff/,'').replace(/\s+/g,'').replace(/[（）]/g,character=>character==='（'?'(':')').toLowerCase()
const aliases:Record<string,string[]>= {
  date:['date','日期'],sex:['sex','性别'],ageYears:['ageyears','年龄'],heightCm:['heightcm','身高(cm)','身高'],weightKg:['weightkg','体重(kg)','体重'],waistCm:['waistcm','腰围(cm)','腰围'],sleepHours:['sleephours','睡眠(h)','睡眠时间(h)','睡眠'],stepCount:['stepcount','steps','步数'],restingCalories:['restingcalories','静息消耗(kcal)','静息消耗'],dailyCalories:['dailycalories','日常消耗(kcal)','日常消耗'],exerciseCalories:['exercisecalories','运动热量(kcal)','运动消耗(kcal)','运动'],foodCalories:['foodcalories','全天进食(kcal)','摄入热量(kcal)','摄入'],proteinGrams:['proteingrams','全天蛋白质(g)','蛋白质(g)','蛋白质'],activityLevel:['activitylevel','活动档位'],restingMode:['restingmode','静息模式'],notes:['notes','备注'],
}
const findColumn=(headers:string[],key:string)=>headers.findIndex(header=>aliases[key]?.includes(header))
const numberFrom=(value:string|undefined,label:string)=>{
  const clean=value?.trim()
  if(!clean)return undefined
  const normalized=clean.replace(/\s/g,'').replace(/,(?=\d+$)/,'.')
  const result=Number(normalized)
  if(!Number.isFinite(result))throw new Error(`${label} 不是有效数字`)
  return result
}
const normalizedDate=(value:string|undefined)=>{
  const clean=value?.trim().replace(/[./]/g,'-')
  if(!clean)return undefined
  const parts=clean.split('-').map(Number)
  if(parts.length!==3||parts.some(part=>!Number.isInteger(part)))return undefined
  const date=`${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`
  return validDate(date)?date:undefined
}
const sexFrom=(value?:string):Sex|undefined=>{const clean=value?.trim().toLowerCase();if(!clean)return undefined;if(['male','男','m'].includes(clean))return'male';if(['female','女','f'].includes(clean))return'female';throw new Error(`性别“${value}”无效`)}
const activityFrom=(value?:string):ActivityLevel|undefined=>{const clean=value?.trim();if(!clean)return undefined;const map:Record<string,ActivityLevel>={sedentary:'sedentary',standing:'standing',walking:'walking',physical:'physical','静坐办公':'sedentary','站立工作':'standing','走动工作':'walking','体力工作':'physical'};if(!map[clean])throw new Error(`活动档位“${value}”无效`);return map[clean]}

export const parseCSV = (text:string):DailyRecord[] => {
  const rows=csvRows(text,delimiterFor(text))
  if(rows.length<2)throw new Error('CSV 中没有可导入的记录')
  const headers=rows[0].map(normalizedHeader),dateIndex=findColumn(headers,'date')
  if(dateIndex<0)throw new Error('CSV 缺少“日期”列')
  const columns=Object.fromEntries(Object.keys(aliases).map(key=>[key,findColumn(headers,key)])) as Record<string,number>
  const recognized=Object.entries(columns).filter(([key,index])=>key!=='date'&&index>=0)
  if(recognized.length===0)throw new Error('CSV 中没有可识别的数据列')
  const now=new Date().toISOString()
  const records=rows.slice(1).map((row,rowIndex)=>{
    const date=normalizedDate(row[dateIndex])
    if(!date)throw new Error(`第 ${rowIndex+2} 行日期无效`)
    const at=(key:string)=>columns[key]>=0?row[columns[key]]:undefined
    const hasData=recognized.some(([,index])=>Boolean(row[index]?.trim()))
    if(!hasData)throw new Error(`${date} 没有可导入的数据`)
    const activityLevel=activityFrom(at('activityLevel'))
    const restingMode=at('restingMode')?.trim() as DailyRecord['restingMode']|undefined
    const record:DailyRecord={
      id:crypto.randomUUID(),date,createdAt:now,updatedAt:now,
      sex:sexFrom(at('sex')),ageYears:numberFrom(at('ageYears'),`${date} 的年龄`),heightCm:numberFrom(at('heightCm'),`${date} 的身高`),weightKg:numberFrom(at('weightKg'),`${date} 的体重`),waistCm:numberFrom(at('waistCm'),`${date} 的腰围`),sleepHours:numberFrom(at('sleepHours'),`${date} 的睡眠时间`),stepCount:numberFrom(at('stepCount'),`${date} 的步数`),restingCalories:numberFrom(at('restingCalories'),`${date} 的静息消耗`),dailyCalories:numberFrom(at('dailyCalories'),`${date} 的日常消耗`),exerciseCalories:numberFrom(at('exerciseCalories'),`${date} 的运动消耗`),foodCalories:numberFrom(at('foodCalories'),`${date} 的摄入热量`),proteinGrams:numberFrom(at('proteinGrams'),`${date} 的蛋白质`),activityLevel,restingMode:restingMode||undefined,notes:at('notes')?.trim()||undefined,
    }
    return Object.fromEntries(Object.entries(record).filter(([,value])=>value!==undefined)) as unknown as DailyRecord
  })
  return validateRecords(records)
}

export const parseImport = (text:string,fileName=''):ParsedImport => {
  const json=fileName.toLowerCase().endsWith('.json')||(!fileName.toLowerCase().endsWith('.csv')&&text.trimStart().startsWith('{'))
  try{return json?parseBackupPackage(text):{records:parseCSV(text),source:'csv'}}catch(error){if(error instanceof SyntaxError)throw new Error('JSON 文件格式无效',{cause:error});throw error}
}
