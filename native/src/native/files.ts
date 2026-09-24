import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import type { DailyRecord } from '../types/record'
import { calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../lib/calculations'
import { parseBackup } from '../lib/import'

const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
const filename = (extension: string) => `轻衡备份-${new Date().toISOString().slice(0, 10)}.${extension}`

async function shareText(name: string, content: string, mimeType: string) {
  if (!FileSystem.cacheDirectory) throw new Error('无法访问临时目录')
  const uri = `${FileSystem.cacheDirectory}${name}`
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 })
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: `导出 ${name}` })
}

export const shareJSON = (records: DailyRecord[]) => shareText(
  filename('json'), JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), records }, null, 2), 'application/json',
)

export const shareCSV = (records: DailyRecord[]) => {
  const keys = ['date', 'sex', 'ageYears', 'heightCm', 'weightKg', 'waistCm', 'sleepHours', 'restingCalories', 'dailyCalories', 'exerciseCalories', 'totalCalories', 'foodCalories', 'proteinGrams', 'calorieDeficit', 'notes'] as const
  const rows = records.map(record => ({ ...record, exerciseCalories: getExerciseCalories(record), foodCalories: getFoodCalories(record), proteinGrams: getProteinGrams(record), totalCalories: calculateTotalCalories(record), calorieDeficit: calculateCalorieDeficit(record) }))
  const content = '\ufeff' + [keys.join(','), ...rows.map(row => keys.map(key => csvCell(row[key])).join(','))].join('\n')
  return shareText(filename('csv'), content, 'text/csv')
}

export async function pickBackup() {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true })
  if (result.canceled) return null
  const asset = result.assets[0]
  if (!asset) throw new Error('没有读取到备份文件')
  return parseBackup(await FileSystem.readAsStringAsync(asset.uri))
}
