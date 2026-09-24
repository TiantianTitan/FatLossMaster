import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActivityEntry, BodyProfile, DailyRecord, FoodEntry } from '../types/record'
import { calculateBMI, calculateCalorieDeficit, calculateTotalCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../lib/calculations'
import { displayDate, todayKey } from '../lib/date'
import { Card, formatValue, Header, Screen } from './components'
import { EntrySheet } from './EntrySheet'
import type { Palette } from './theme'
import { typography } from './theme'

export function HomeScreen({ record, profile, onAddFood, onAddActivity, onOpenRecord, colors }: { record?: DailyRecord; profile: BodyProfile; onAddFood: (entry: FoodEntry) => void; onAddActivity: (entry: ActivityEntry) => void; onOpenRecord: () => void; colors: Palette }) {
  const [entryKind, setEntryKind] = useState<'food' | 'activity'>()
  const deficit = calculateCalorieDeficit(record)
  const total = calculateTotalCalories(record)
  const surplus = deficit != null && deficit < 0
  return <Screen colors={colors}>
    <Header eyebrow={displayDate(todayKey())} title="今天" colors={colors} right={<View style={[styles.dayBadge, { backgroundColor: colors.lime }]}><Text style={styles.dayNumber}>{new Date().getDate()}</Text></View>}/>

    <View style={[styles.hero, { backgroundColor: surplus ? colors.coral : colors.text }]}>
      <View style={[styles.orbit, { borderColor: colors.lime }]}/>
      <Text style={[styles.heroLabel, { color: colors.background }]}>{deficit == null ? '今日热量结余' : surplus ? '今日热量盈余' : '今日热量缺口'}</Text>
      <View style={styles.heroValueRow}><Text style={[styles.heroValue, { color: colors.white }]}>{deficit == null ? '—' : formatValue(Math.abs(deficit), 1)}</Text><Text style={styles.heroUnit}>kcal</Text></View>
      <Text style={[styles.heroHint, { color: '#FFFFFFB5' }]}>{deficit == null ? '记录膳食后自动计算' : surplus ? '摄入高于消耗' : '消耗高于摄入'}</Text>
      <View style={[styles.heroRule, { backgroundColor: '#FFFFFF25' }]}/>
      <View style={styles.heroTotals}><View><Text style={styles.heroSmall}>摄入</Text><Text style={styles.heroTotal}>{formatValue(getFoodCalories(record), 1)}</Text></View><Ionicons name="arrow-forward" size={18} color="#FFFFFF80"/><View style={{ alignItems: 'flex-end' }}><Text style={styles.heroSmall}>总消耗</Text><Text style={styles.heroTotal}>{total ? formatValue(total, 1) : '—'}</Text></View></View>
    </View>

    <View style={styles.quickGrid}>
      <QuickAction title="记录进食" detail="热量与蛋白质" icon="restaurant-outline" color={colors.lime} onPress={() => setEntryKind('food')} colors={colors}/>
      <QuickAction title="记录运动" detail="额外活动消耗" icon="barbell-outline" color={colors.accentSoft} onPress={() => setEntryKind('activity')} colors={colors}/>
    </View>

    <View style={styles.metricGrid}>
      <Metric label="蛋白质" value={formatValue(getProteinGrams(record), 1)} unit="g" colors={colors}/>
      <Metric label="当前体重" value={formatValue(profile.weightKg, 1)} unit="kg" detail={`BMI ${calculateBMI(profile.weightKg, profile.heightCm)?.toFixed(1) ?? '—'}`} colors={colors}/>
      <Metric label="运动记录" value={formatValue(getExerciseCalories(record), 1)} unit="kcal" icon="barbell-outline" colors={colors}/>
      <Metric label="睡眠时间" value={formatValue(record?.sleepHours, 2)} unit="h" icon="moon-outline" colors={colors}/>
    </View>

    <Pressable onPress={onOpenRecord} style={({ pressed }) => [styles.detailButton, { borderColor: colors.line, backgroundColor: colors.surface, opacity: pressed ? .7 : 1 }]}><Text style={[styles.detailText, { color: colors.text }]}>查看今日明细</Text><Ionicons name="arrow-forward" size={18} color={colors.text}/></Pressable>

    <EntrySheet kind="food" visible={entryKind === 'food'} onClose={() => setEntryKind(undefined)} onSave={entry => onAddFood(entry as FoodEntry)} colors={colors}/>
    <EntrySheet kind="activity" visible={entryKind === 'activity'} onClose={() => setEntryKind(undefined)} onSave={entry => onAddActivity(entry as ActivityEntry)} colors={colors}/>
  </Screen>
}

function QuickAction({ title, detail, icon, color, onPress, colors }: { title: string; detail: string; icon: 'restaurant-outline' | 'barbell-outline'; color: string; onPress: () => void; colors: Palette }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? .65 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: color }]}><Ionicons name={icon} size={21} color={colors.text}/></View><Text style={[styles.quickTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.quickDetail, { color: colors.muted }]}>{detail}</Text><Ionicons name="add-circle" size={24} color={colors.text} style={styles.plus}/></Pressable>
}

function Metric({ label, value, unit, detail, icon, colors }: { label: string; value: string; unit: string; detail?: string; icon?: 'barbell-outline' | 'moon-outline'; colors: Palette }) {
  return <Card colors={colors} style={styles.metric}><View style={styles.metricLabelRow}>{icon ? <Ionicons name={icon} size={15} color={colors.accent}/> : null}<Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text></View><Text style={[styles.metricValue, { color: colors.text }]}>{value} <Text style={styles.metricUnit}>{value === '—' ? '' : unit}</Text></Text>{detail ? <Text style={[styles.metricDetail, { color: colors.muted }]}>{detail}</Text> : null}</Card>
}

const styles = StyleSheet.create({
  dayBadge: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '4deg' }] },
  dayNumber: { fontFamily: typography.display, fontSize: 24, fontWeight: '900', color: '#18201A' },
  hero: { minHeight: 276, borderRadius: 30, padding: 24, overflow: 'hidden' },
  orbit: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 40, opacity: .13, right: -50, top: -70 },
  heroLabel: { fontFamily: typography.body, fontSize: 14, fontWeight: '700' },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10 },
  heroValue: { fontFamily: typography.display, fontSize: 64, fontWeight: '900', letterSpacing: -3 },
  heroUnit: { color: '#FFFFFFB5', fontFamily: typography.body, fontSize: 15, fontWeight: '700', marginLeft: 8 },
  heroHint: { fontFamily: typography.body, fontSize: 13 },
  heroRule: { height: 1, marginTop: 30, marginBottom: 18 },
  heroTotals: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSmall: { color: '#FFFFFF90', fontFamily: typography.body, fontSize: 12 },
  heroTotal: { color: '#FFFFFF', fontFamily: typography.mono, fontSize: 20, fontWeight: '700', marginTop: 3 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quick: { flex: 1, minHeight: 142, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 15 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  quickTitle: { fontFamily: typography.body, fontSize: 15, fontWeight: '800' },
  quickDetail: { fontFamily: typography.body, fontSize: 11, marginTop: 4 },
  plus: { position: 'absolute', right: 13, top: 14 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { width: '48%', minHeight: 132, justifyContent: 'space-between' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricLabel: { fontFamily: typography.body, fontSize: 12, fontWeight: '600' },
  metricValue: { fontFamily: typography.display, fontSize: 27, fontWeight: '800' },
  metricUnit: { fontFamily: typography.body, fontSize: 12, fontWeight: '600' },
  metricDetail: { fontFamily: typography.body, fontSize: 11 },
  detailButton: { height: 58, borderRadius: 19, borderWidth: 1, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailText: { fontFamily: typography.body, fontSize: 16, fontWeight: '800' },
})
