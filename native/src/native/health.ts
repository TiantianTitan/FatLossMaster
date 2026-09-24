import { Platform } from 'react-native'
import type { DailyRecord } from '../types/record'
import { format } from 'date-fns'

export interface HealthImportResult {
  patch: Partial<DailyRecord>
  imported: string[]
}

export async function importTodayFromAppleHealth(): Promise<HealthImportResult> {
  if (Platform.OS !== 'ios') throw new Error('Apple 健康同步仅支持 iPhone')

  const HealthKit = await import('@kingstinct/react-native-healthkit')
  if (!HealthKit.isHealthDataAvailable()) throw new Error('此设备无法使用 Apple 健康')

  const quantityWeight = 'HKQuantityTypeIdentifierBodyMass' as const
  const quantityEnergy = 'HKQuantityTypeIdentifierActiveEnergyBurned' as const
  const categorySleep = 'HKCategoryTypeIdentifierSleepAnalysis' as const
  await HealthKit.requestAuthorization({ toRead: [quantityWeight, quantityEnergy, categorySleep] })

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weight = await HealthKit.getMostRecentQuantitySample(quantityWeight, 'kg')
  const active = await HealthKit.queryStatisticsForQuantity(quantityEnergy, ['cumulativeSum'], {
    unit: 'kcal', filter: { date: { startDate: start, endDate: now, strictStartDate: true } },
  })
  const sleepStart = new Date(start)
  sleepStart.setDate(sleepStart.getDate() - 1)
  sleepStart.setHours(12, 0, 0, 0)
  const sleepSamples = await HealthKit.queryCategorySamples(categorySleep, {
    limit: -1, ascending: true, filter: { date: { startDate: sleepStart, endDate: now } },
  })
  const asleepValues = new Set([1, 3, 4, 5])
  const sleepMs = sleepSamples.filter(sample => asleepValues.has(Number(sample.value))).reduce((sum, sample) => sum + (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()), 0)

  const patch: Partial<DailyRecord> = {}
  const imported: string[] = []
  if (weight && format(new Date(weight.endDate), 'yyyy-MM-dd') <= format(now, 'yyyy-MM-dd')) {
    patch.weightKg = Math.round(weight.quantity * 10) / 10
    imported.push('体重')
  }
  if (active.sumQuantity?.quantity != null) {
    patch.exerciseCalories = Math.round(active.sumQuantity.quantity * 10) / 10
    patch.activityEntries = [{ id: 'apple-health-active', name: 'Apple 健康活动能量', calories: patch.exerciseCalories }]
    imported.push('运动能量')
  }
  if (sleepMs > 0) {
    patch.sleepHours = Math.round((sleepMs / 3_600_000) * 100) / 100
    imported.push('睡眠')
  }
  return { patch, imported }
}
