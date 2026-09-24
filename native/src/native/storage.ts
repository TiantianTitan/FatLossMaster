import AsyncStorage from '@react-native-async-storage/async-storage'
import type { DailyRecord, ThemeMode } from '../types/record'

const RECORDS_KEY = '@qingheng/records-v2'
const THEME_KEY = '@qingheng/theme'

export async function loadRecords(): Promise<DailyRecord[]> {
  const raw = await AsyncStorage.getItem(RECORDS_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as DailyRecord[] : []
  } catch {
    return []
  }
}

export const storeRecords = (records: DailyRecord[]) =>
  AsyncStorage.setItem(RECORDS_KEY, JSON.stringify([...records].sort((a, b) => a.date.localeCompare(b.date))))

export async function loadTheme(): Promise<ThemeMode> {
  const mode = await AsyncStorage.getItem(THEME_KEY)
  return mode === 'light' || mode === 'dark' ? mode : 'system'
}

export const storeTheme = (mode: ThemeMode) => AsyncStorage.setItem(THEME_KEY, mode)
