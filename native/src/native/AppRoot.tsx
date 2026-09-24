import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Crypto from 'expo-crypto'
import type { ActivityEntry, BodyProfile, DailyRecord, FoodEntry, Page, ThemeMode } from '../types/record'
import { estimateDailyActivityCalories, estimateRestingCalories } from '../lib/calculations'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch } from '../lib/entries'
import { todayKey } from '../lib/date'
import { DEFAULT_ACTIVITY_LEVEL, DEFAULT_RESTING_CALORIES, defaultsForDate, resolveEnergyDefaults } from '../lib/recordDefaults'
import { HomeScreen } from './HomeScreen'
import { RecordsScreen } from './RecordsScreen'
import { TrendsScreen } from './TrendsScreen'
import { SettingsScreen } from './SettingsScreen'
import { ProfileSheet } from './ProfileSheet'
import { dark, light, typography } from './theme'
import { loadRecords, loadTheme, storeRecords, storeTheme } from './storage'

export default function AppRoot() {
  return <SafeAreaProvider><HealthApp/></SafeAreaProvider>
}

function HealthApp() {
  const system = useColorScheme()
  const [page, setPage] = useState<Page>('today'), [recordDate, setRecordDate] = useState(todayKey())
  const [records, setRecords] = useState<DailyRecord[]>([]), [theme, setThemeState] = useState<ThemeMode>('system'), [loaded, setLoaded] = useState(false)
  useEffect(() => { Promise.all([loadRecords(), loadTheme()]).then(([savedRecords, savedTheme]) => { setRecords(savedRecords); setThemeState(savedTheme); setLoaded(true) }) }, [])
  const isDark = theme === 'dark' || (theme === 'system' && system === 'dark'), colors = isDark ? dark : light
  const resolved = useMemo(() => resolveEnergyDefaults(records), [records])
  const descending = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records])
  const latest = <K extends keyof DailyRecord>(key: K): DailyRecord[K] | undefined => descending.find(record => record[key] != null)?.[key]
  const rawToday = records.find(record => record.date === todayKey())
  const profile: BodyProfile = { heightCm: rawToday?.heightCm ?? latest('heightCm'), weightKg: rawToday?.weightKg ?? latest('weightKg'), waistCm: rawToday?.waistCm ?? latest('waistCm'), ageYears: rawToday?.ageYears ?? latest('ageYears'), sex: rawToday?.sex ?? latest('sex') }
  const virtualToday = useMemo<DailyRecord>(() => {
    const defaults = defaultsForDate(records, todayKey()), now = new Date().toISOString()
    return resolved.find(record => record.date === todayKey()) ?? { ...defaults, id: 'today-preview', date: todayKey(), createdAt: now, updatedAt: now } as DailyRecord
  }, [records, resolved])
  const commit = (next: DailyRecord[]) => { const sorted = [...next].sort((a, b) => a.date.localeCompare(b.date)); setRecords(sorted); void storeRecords(sorted) }
  const upsert = (record: DailyRecord) => commit([...records.filter(item => item.date !== record.date), record])
  const remove = (id: string) => commit(records.filter(record => record.id !== id))
  const baseToday = () => {
    if (rawToday) return rawToday
    const now = new Date().toISOString()
    return { ...defaultsForDate(records, todayKey()), id: Crypto.randomUUID(), date: todayKey(), createdAt: now, updatedAt: now } as DailyRecord
  }
  const addFood = (entry: FoodEntry) => { const base = baseToday(); upsert({ ...base, ...foodEntryPatch([...foodEntriesFor(base), entry]), updatedAt: new Date().toISOString() }) }
  const addActivity = (entry: ActivityEntry) => { const base = baseToday(); upsert({ ...base, ...activityEntryPatch([...activityEntriesFor(base), entry]), updatedAt: new Date().toISOString() }) }
  const saveProfile = (body: BodyProfile) => {
    const base = baseToday(), resting = base.restingMode === 'manual' && base.restingCalories ? base.restingCalories : estimateRestingCalories(body.weightKg, body.heightCm, body.ageYears, body.sex) ?? DEFAULT_RESTING_CALORIES
    upsert({ ...base, ...body, restingCalories: resting, restingMode: base.restingMode ?? 'auto', activityLevel: base.activityLevel ?? DEFAULT_ACTIVITY_LEVEL, dailyCalories: estimateDailyActivityCalories(resting, base.activityLevel ?? DEFAULT_ACTIVITY_LEVEL), updatedAt: new Date().toISOString() })
  }
  const applyHealth = (patch: Partial<DailyRecord>) => {
    const base = baseToday(), merged = { ...base, ...patch }
    const resting = base.restingMode === 'manual' && base.restingCalories ? base.restingCalories : estimateRestingCalories(merged.weightKg, merged.heightCm, merged.ageYears, merged.sex) ?? DEFAULT_RESTING_CALORIES
    upsert({ ...merged, restingCalories: resting, restingMode: base.restingMode ?? 'auto', dailyCalories: estimateDailyActivityCalories(resting, merged.activityLevel ?? DEFAULT_ACTIVITY_LEVEL), updatedAt: new Date().toISOString() })
  }
  const setTheme = (mode: ThemeMode) => { setThemeState(mode); void storeTheme(mode) }
  const merge = (incoming: DailyRecord[]) => { const byDate = new Map(records.map(record => [record.date, record])); incoming.forEach(record => { const existing = byDate.get(record.date); byDate.set(record.date, { ...record, id: existing?.id ?? record.id }) }); commit([...byDate.values()]) }

  if (!loaded) return <View style={[styles.loader, { backgroundColor: colors.background }]}><View style={[styles.loaderMark, { backgroundColor: colors.text }]}><Text style={[styles.loaderGlyph, { color: colors.lime }]}>轻</Text></View><ActivityIndicator color={colors.accent}/><Text style={[styles.loaderText, { color: colors.muted }]}>正在打开轻衡</Text></View>

  return <View style={[styles.root, { backgroundColor: colors.background }]}><StatusBar style={isDark ? 'light' : 'dark'}/>
    {page === 'today' ? <HomeScreen record={virtualToday} profile={profile} onAddFood={addFood} onAddActivity={addActivity} onOpenRecord={() => { setRecordDate(todayKey()); setPage('records') }} colors={colors}/> : null}
    {page === 'records' ? <RecordsScreen initialDate={recordDate} records={records} onUpsert={upsert} onDelete={remove} colors={colors}/> : null}
    {page === 'trends' ? <TrendsScreen records={resolved} colors={colors}/> : null}
    {page === 'settings' ? <SettingsScreen records={resolved} profile={profile} theme={theme} onTheme={setTheme} onProfile={saveProfile} onMerge={merge} onReplace={commit} onClear={() => commit([])} onHealthPatch={applyHealth} colors={colors}/> : null}
    <TabBar page={page} onChange={setPage} colors={colors}/>
    <ProfileSheet visible={!profile.ageYears || !profile.sex} required value={profile} onClose={() => undefined} onSave={saveProfile} colors={colors}/>
  </View>
}

function TabBar({ page, onChange, colors }: { page: Page; onChange: (page: Page) => void; colors: typeof light }) {
  const insets = useSafeAreaInsets()
  const tabs: Array<[Page, string, 'today-outline' | 'calendar-outline' | 'analytics-outline' | 'settings-outline']> = [['today', '今日', 'today-outline'], ['records', '记录', 'calendar-outline'], ['trends', '趋势', 'analytics-outline'], ['settings', '设置', 'settings-outline']]
  return <View style={[styles.tabShell, { bottom: Math.max(10, insets.bottom), backgroundColor: colors.surface, borderColor: colors.line }]}>{tabs.map(([id, label, icon]) => { const active = page === id; return <Pressable key={id} onPress={() => onChange(id)} style={styles.tab}><View style={[styles.tabIcon, active && { backgroundColor: colors.text }]}><Ionicons name={icon} size={20} color={active ? colors.lime : colors.muted}/></View><Text style={[styles.tabText, { color: active ? colors.text : colors.muted }]}>{label}</Text></Pressable> })}</View>
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loaderMark: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  loaderGlyph: { fontFamily: typography.display, fontSize: 31, fontWeight: '900' },
  loaderText: { fontFamily: typography.body, fontSize: 12 },
  tabShell: { position: 'absolute', left: 14, right: 14, height: 78, borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: .13, shadowRadius: 25, elevation: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { width: 40, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: typography.body, fontSize: 10, fontWeight: '700' },
})
