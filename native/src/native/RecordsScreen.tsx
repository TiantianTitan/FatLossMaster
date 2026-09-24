import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { addDays, format, parseISO } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Crypto from 'expo-crypto'
import type { ActivityEntry, DailyRecord, FoodEntry } from '../types/record'
import { activityLevels, calculateCalorieDeficit, calculateTotalCalories, estimateDailyActivityCalories, estimateRestingCalories, getExerciseCalories, getFoodCalories, getProteinGrams } from '../lib/calculations'
import { activityEntriesFor, activityEntryPatch, foodEntriesFor, foodEntryPatch } from '../lib/entries'
import { fullDisplayDate, todayKey } from '../lib/date'
import { DEFAULT_RESTING_CALORIES, defaultsForDate } from '../lib/recordDefaults'
import { Card, formatValue, Header, NumberField, Screen, SectionTitle } from './components'
import { EntrySheet } from './EntrySheet'
import type { Palette } from './theme'
import { typography } from './theme'

type EditorState = { kind: 'food' | 'activity'; entry?: FoodEntry | ActivityEntry }

export function RecordsScreen({ initialDate, records, onUpsert, onDelete, colors }: { initialDate: string; records: DailyRecord[]; onUpsert: (record: DailyRecord) => void; onDelete: (id: string) => void; colors: Palette }) {
  const [selected, setSelected] = useState(initialDate), [showPicker, setShowPicker] = useState(false), [editor, setEditor] = useState<EditorState>()
  useEffect(() => setSelected(initialDate), [initialDate])
  const existing = records.find(item => item.date === selected)
  const defaults = useMemo(() => defaultsForDate(records, selected), [records, selected])
  const record = useMemo<DailyRecord>(() => existing ?? { ...defaults, id: Crypto.randomUUID(), date: selected, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as DailyRecord, [existing, defaults, selected])
  const update = (patch: Partial<DailyRecord>) => onUpsert({ ...record, ...patch, updatedAt: new Date().toISOString() })
  const deficit = calculateCalorieDeficit(record), total = calculateTotalCalories(record)
  const foodEntries = foodEntriesFor(record), activities = activityEntriesFor(record)
  const move = (days: number) => setSelected(format(addDays(parseISO(selected), days), 'yyyy-MM-dd'))
  const deleteDay = () => existing && Alert.alert('删除这天的记录？', `${fullDisplayDate(selected)} 的所有数据将被删除。`, [{ text: '取消', style: 'cancel' }, { text: '删除', style: 'destructive', onPress: () => onDelete(existing.id) }])
  const saveEntry = (entry: FoodEntry | ActivityEntry) => {
    if (editor?.kind === 'food') {
      const next = editor.entry ? foodEntries.map(item => item.id === entry.id ? entry as FoodEntry : item) : [...foodEntries, entry as FoodEntry]
      update(foodEntryPatch(next))
    } else {
      const next = editor?.entry ? activities.map(item => item.id === entry.id ? entry as ActivityEntry : item) : [...activities, entry as ActivityEntry]
      update(activityEntryPatch(next))
    }
  }
  const removeEntry = (kind: 'food' | 'activity', id: string) => update(kind === 'food' ? foodEntryPatch(foodEntries.filter(item => item.id !== id)) : activityEntryPatch(activities.filter(item => item.id !== id)))
  const resetResting = () => {
    const resting = estimateRestingCalories(record.weightKg, record.heightCm, record.ageYears, record.sex) ?? DEFAULT_RESTING_CALORIES
    update({ restingCalories: resting, restingMode: 'auto', dailyCalories: estimateDailyActivityCalories(resting, record.activityLevel ?? 'sedentary') })
  }

  return <Screen colors={colors}>
    <Header eyebrow="日常记录" title={selected === todayKey() ? '今天' : '历史记录'} colors={colors} right={selected !== todayKey() ? <Pressable onPress={() => setSelected(todayKey())}><Text style={[styles.today, { color: colors.accent }]}>回到今天</Text></Pressable> : undefined}/>
    <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.line }]}><Pressable onPress={() => move(-1)} hitSlop={10}><Ionicons name="chevron-back" size={23} color={colors.text}/></Pressable><Pressable style={{ alignItems: 'center' }} onPress={() => setShowPicker(true)}><Text style={[styles.dateMeta, { color: colors.muted }]}>点击选择日期</Text><Text style={[styles.date, { color: colors.text }]}>{fullDisplayDate(selected)}</Text></Pressable><Pressable onPress={() => move(1)} hitSlop={10}><Ionicons name="chevron-forward" size={23} color={colors.text}/></Pressable></View>
    {showPicker ? <DateTimePicker value={parseISO(selected)} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_, date) => { if (Platform.OS !== 'ios') setShowPicker(false); if (date) setSelected(format(date, 'yyyy-MM-dd')) }} themeVariant={colors.background === '#111612' ? 'dark' : 'light'}/> : null}

    <Card colors={colors} style={[styles.result, { backgroundColor: deficit != null && deficit < 0 ? `${colors.coral}20` : colors.accentSoft }]}>
      <Text style={[styles.resultLabel, { color: colors.muted }]}>{deficit == null ? '添加膳食后计算' : deficit >= 0 ? '热量缺口 · 消耗更多' : '热量盈余 · 摄入更多'}</Text>
      <Text style={[styles.resultValue, { color: deficit != null && deficit < 0 ? colors.coral : colors.text }]}>{deficit == null ? '—' : formatValue(Math.abs(deficit), 1)} <Text style={styles.resultUnit}>{deficit == null ? '' : 'kcal'}</Text></Text>
      <Text style={[styles.formula, { color: colors.muted }]}>消耗 {formatValue(total, 1)} − 摄入 {formatValue(getFoodCalories(record), 1)}</Text>
    </Card>

    <EntryList title="运动记录" subtitle={`${formatValue(getExerciseCalories(record), 1)} kcal`} kind="activity" entries={activities} onAdd={() => setEditor({ kind: 'activity' })} onEdit={entry => setEditor({ kind: 'activity', entry })} onRemove={id => removeEntry('activity', id)} colors={colors}/>
    <EntryList title="膳食记录" subtitle={`${formatValue(getFoodCalories(record), 1)} kcal · ${formatValue(getProteinGrams(record), 1)} g 蛋白质`} kind="food" entries={foodEntries} onAdd={() => setEditor({ kind: 'food' })} onEdit={entry => setEditor({ kind: 'food', entry })} onRemove={id => removeEntry('food', id)} colors={colors}/>

    <View style={styles.section}><SectionTitle colors={colors} trailing={<Pressable onPress={resetResting}><Text style={[styles.reset, { color: colors.accent }]}>恢复估算</Text></Pressable>}>静息消耗</SectionTitle><Card colors={colors}><NumberField label="全天静卧消耗" value={record.restingCalories} unit="kcal" onCommit={value => { const resting = value && value > 0 ? value : (estimateRestingCalories(record.weightKg, record.heightCm, record.ageYears, record.sex) ?? DEFAULT_RESTING_CALORIES); update({ restingCalories: resting, restingMode: value && value > 0 ? 'manual' : 'auto', dailyCalories: estimateDailyActivityCalories(resting, record.activityLevel ?? 'sedentary') }) }} colors={colors}/><Text style={[styles.help, { color: colors.muted }]}>Mifflin–St Jeor 估算；资料不足时使用 1,600 kcal。</Text></Card></View>

    <View style={styles.section}><SectionTitle colors={colors}>日常消耗</SectionTitle><View style={styles.levels}>{activityLevels.map(level => { const active = (record.activityLevel ?? 'sedentary') === level.id; return <Pressable key={level.id} onPress={() => update({ activityLevel: level.id, dailyCalories: estimateDailyActivityCalories(record.restingCalories, level.id) })} style={[styles.level, { backgroundColor: active ? colors.text : colors.surface, borderColor: active ? colors.text : colors.line }]}><View style={{ flex: 1 }}><Text style={[styles.levelName, { color: active ? colors.background : colors.text }]}>{level.name}</Text><Text style={[styles.levelDetail, { color: active ? `${colors.background}B0` : colors.muted }]}>{level.description}</Text></View><Text style={[styles.levelValue, { color: active ? colors.lime : colors.accent }]}>+{formatValue(estimateDailyActivityCalories(record.restingCalories, level.id), 1)}</Text></Pressable> })}</View></View>

    <View style={styles.section}><SectionTitle colors={colors}>睡眠时间</SectionTitle><Card colors={colors}><NumberField label="昨晚睡眠" value={record.sleepHours} unit="h" placeholder="例如 7,5" onCommit={value => update({ sleepHours: value == null ? undefined : Math.min(24, Math.max(0, value)) })} colors={colors}/></Card></View>
    <View style={styles.section}><SectionTitle colors={colors}>备注</SectionTitle><TextInput defaultValue={record.notes} key={`${record.id}-${record.notes ?? ''}`} multiline placeholder="今天感觉如何？饮食、运动或睡眠…" placeholderTextColor={colors.muted} onEndEditing={event => update({ notes: event.nativeEvent.text })} style={[styles.notes, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.line }]}/></View>
    {existing ? <Pressable onPress={deleteDay} style={styles.delete}><Ionicons name="trash-outline" size={17} color={colors.danger}/><Text style={[styles.deleteText, { color: colors.danger }]}>删除这天的记录</Text></Pressable> : null}
    <EntrySheet kind={editor?.kind ?? 'food'} entry={editor?.entry} visible={Boolean(editor)} onClose={() => setEditor(undefined)} onSave={saveEntry} colors={colors}/>
  </Screen>
}

function EntryList({ title, subtitle, kind, entries, onAdd, onEdit, onRemove, colors }: { title: string; subtitle: string; kind: 'food' | 'activity'; entries: Array<FoodEntry | ActivityEntry>; onAdd: () => void; onEdit: (entry: FoodEntry | ActivityEntry) => void; onRemove: (id: string) => void; colors: Palette }) {
  return <View style={styles.section}><SectionTitle colors={colors} trailing={<Text style={[styles.total, { color: colors.muted }]}>{subtitle}</Text>}>{title}</SectionTitle><Card colors={colors} style={{ paddingVertical: 5 }}>{entries.map((entry, index) => <Pressable key={entry.id} onPress={() => onEdit(entry)} style={[styles.entry, index < entries.length - 1 && { borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth }]}><View style={[styles.entryIcon, { backgroundColor: kind === 'food' ? colors.lime : colors.accentSoft }]}><Ionicons name={kind === 'food' ? 'restaurant-outline' : 'barbell-outline'} size={18} color={colors.text}/></View><View style={{ flex: 1 }}><Text style={[styles.entryName, { color: colors.text }]}>{entry.name || (kind === 'food' ? '未命名膳食' : '未命名运动')}</Text><Text style={[styles.entryDetail, { color: colors.muted }]}>{formatValue(entry.calories, 1)} kcal{kind === 'food' && (entry as FoodEntry).proteinGrams != null ? ` · ${formatValue((entry as FoodEntry).proteinGrams, 1)} g` : ''}</Text></View><Pressable onPress={() => onRemove(entry.id)} hitSlop={12}><Ionicons name="close-circle-outline" size={22} color={colors.muted}/></Pressable></Pressable>)}<Pressable onPress={onAdd} style={styles.add}><Ionicons name="add" size={20} color={colors.accent}/><Text style={[styles.addText, { color: colors.accent }]}>添加一项</Text></Pressable></Card></View>
}

const styles = StyleSheet.create({
  today: { fontFamily: typography.body, fontSize: 14, fontWeight: '800' },
  stepper: { height: 70, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateMeta: { fontFamily: typography.body, fontSize: 10, marginBottom: 3 },
  date: { fontFamily: typography.body, fontSize: 16, fontWeight: '800' },
  result: { minHeight: 155, justifyContent: 'center' },
  resultLabel: { fontFamily: typography.body, fontSize: 12, fontWeight: '700' },
  resultValue: { fontFamily: typography.display, fontSize: 44, fontWeight: '900', marginVertical: 8 },
  resultUnit: { fontFamily: typography.body, fontSize: 14 },
  formula: { fontFamily: typography.mono, fontSize: 11 },
  section: { gap: 10 },
  reset: { fontFamily: typography.body, fontSize: 12, fontWeight: '800' },
  total: { fontFamily: typography.mono, fontSize: 11 },
  entry: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  entryName: { fontFamily: typography.body, fontSize: 14, fontWeight: '700' },
  entryDetail: { fontFamily: typography.mono, fontSize: 11, marginTop: 3 },
  add: { height: 54, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: typography.body, fontSize: 14, fontWeight: '800' },
  help: { fontFamily: typography.body, fontSize: 11, lineHeight: 17, marginTop: 10 },
  levels: { gap: 8 },
  level: { minHeight: 72, borderRadius: 19, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelName: { fontFamily: typography.body, fontSize: 14, fontWeight: '800' },
  levelDetail: { fontFamily: typography.body, fontSize: 10, marginTop: 3 },
  levelValue: { fontFamily: typography.mono, fontSize: 13, fontWeight: '800' },
  notes: { minHeight: 120, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, fontFamily: typography.body, fontSize: 15, textAlignVertical: 'top' },
  delete: { flexDirection: 'row', gap: 7, height: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: typography.body, fontSize: 13, fontWeight: '700' },
})
