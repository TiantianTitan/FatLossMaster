import { format, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg'
import type { DailyRecord } from '../types/record'
import { calculateCalorieDeficit, getExerciseCalories, getFoodCalories, getProteinGrams } from '../lib/calculations'
import { calculateMonthlyStats, calculateWeeklyStats, recordsInDayRange, type PeriodStats } from '../lib/statistics'
import { Card, formatValue, Header, Pill, Screen, SectionTitle } from './components'
import type { Palette } from './theme'
import { typography } from './theme'

type Range = '7' | '30' | '90' | 'all'
type Metric = 'weight' | 'deficit' | 'exercise' | 'intake' | 'protein' | 'sleep' | 'waist'
const ranges: Array<[Range, string]> = [['7', '7天'], ['30', '30天'], ['90', '90天'], ['all', '全部']]
const metrics: Array<[Metric, string, string]> = [['weight', '体重', 'kg'], ['deficit', '热量缺口', 'kcal'], ['exercise', '运动', 'kcal'], ['intake', '摄入', 'kcal'], ['protein', '蛋白质', 'g'], ['sleep', '睡眠', 'h'], ['waist', '腰围', 'cm']]
const valueFor = (record: DailyRecord, metric: Metric) => metric === 'weight' ? record.weightKg : metric === 'deficit' ? calculateCalorieDeficit(record) : metric === 'exercise' ? getExerciseCalories(record) : metric === 'intake' ? getFoodCalories(record) : metric === 'protein' ? getProteinGrams(record) : metric === 'sleep' ? record.sleepHours : record.waistCm

export function TrendsScreen({ records, colors }: { records: DailyRecord[]; colors: Palette }) {
  const [range, setRange] = useState<Range>('30'), [metric, setMetric] = useState<Metric>('weight')
  const now = useMemo(() => new Date(), [])
  const meta = metrics.find(item => item[0] === metric) ?? metrics[0]!
  const data = useMemo(() => {
    const ranged = range === 'all' ? records : recordsInDayRange(records, Number(range), now)
    const today = format(now, 'yyyy-MM-dd')
    return [...ranged].sort((a, b) => a.date.localeCompare(b.date)).map(record => ({ date: record.date, label: format(parseISO(record.date), 'M/d'), value: metric === 'exercise' && record.date < today ? getExerciseCalories(record) ?? 0 : valueFor(record, metric) })).filter((item): item is { date: string; label: string; value: number } => item.value != null)
  }, [records, range, metric, now])
  return <Screen colors={colors}>
    <Header eyebrow="看见长期变化" title="趋势" colors={colors} right={<View style={[styles.count, { backgroundColor: colors.lime }]}><Text style={styles.countValue}>{data.length}</Text><Text style={styles.countLabel}>条记录</Text></View>}/>
    <View style={[styles.rangeBar, { backgroundColor: colors.surfaceAlt }]}>{ranges.map(([id, label]) => <Pressable key={id} onPress={() => setRange(id)} style={[styles.range, range === id && { backgroundColor: colors.surface }]}><Text style={[styles.rangeText, { color: range === id ? colors.text : colors.muted }]}>{label}</Text></Pressable>)}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metrics}>{metrics.map(([id, label]) => <Pill key={id} label={label} active={metric === id} onPress={() => setMetric(id)} colors={colors}/>)}</ScrollView>
    <Card colors={colors} style={styles.chartCard}><SectionTitle colors={colors} trailing={<Text style={[styles.unit, { color: colors.muted }]}>{meta[2]}</Text>}>{meta[1]}趋势</SectionTitle><TrendChart data={data} colors={colors} zeroLine={metric === 'deficit'}/>{data.length < 2 ? <Text style={[styles.empty, { color: colors.muted }]}>至少记录两天{meta[1]}数据后，这里会出现趋势。</Text> : null}</Card>
    <StatsCard title="本周" stats={calculateWeeklyStats(records)} colors={colors}/>
    <StatsCard title={`${now.getMonth() + 1}月`} stats={calculateMonthlyStats(records)} colors={colors} monthly/>
  </Screen>
}

function TrendChart({ data, colors, zeroLine }: { data: Array<{ label: string; value: number }>; colors: Palette; zeroLine: boolean }) {
  const { width } = useWindowDimensions(), chartWidth = Math.max(260, width - 78), height = 220, pad = 25
  if (data.length < 2) return <View style={[styles.chartEmpty, { borderBottomColor: colors.line }]}/>
  const values = data.map(item => item.value), lowRaw = Math.min(...values, zeroLine ? 0 : Infinity), highRaw = Math.max(...values, zeroLine ? 0 : -Infinity)
  const spread = Math.max(1, highRaw - lowRaw), low = lowRaw - spread * .12, high = highRaw + spread * .12
  const x = (index: number) => pad + index * ((chartWidth - pad * 2) / (data.length - 1))
  const y = (value: number) => pad + (high - value) / (high - low) * (height - pad * 2)
  const line = data.map((item, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(item.value)}`).join(' ')
  const area = `${line} L ${x(data.length - 1)} ${height - pad} L ${pad} ${height - pad} Z`
  return <Svg width={chartWidth} height={height} style={{ marginTop: 14 }}><Defs><LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.accent} stopOpacity=".30"/><Stop offset="1" stopColor={colors.accent} stopOpacity="0"/></LinearGradient></Defs>{[0, .5, 1].map(step => <Line key={step} x1={pad} x2={chartWidth - pad} y1={pad + step * (height - pad * 2)} y2={pad + step * (height - pad * 2)} stroke={colors.line} strokeDasharray="4 6"/>)}{zeroLine && low < 0 && high > 0 ? <Line x1={pad} x2={chartWidth - pad} y1={y(0)} y2={y(0)} stroke={colors.muted} strokeWidth="1"/> : null}<Path d={area} fill="url(#fill)"/><Path d={line} fill="none" stroke={colors.accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>{data.map((item, index) => (index === 0 || index === data.length - 1) ? <Circle key={index} cx={x(index)} cy={y(item.value)} r="4.5" fill={colors.surface} stroke={colors.accent} strokeWidth="3"/> : null)}<SvgText x={pad} y={height - 5} fontSize="10" fill={colors.muted}>{data[0]?.label}</SvgText><SvgText x={chartWidth - pad} y={height - 5} fontSize="10" textAnchor="end" fill={colors.muted}>{data.at(-1)?.label}</SvgText></Svg>
}

function StatsCard({ title, stats, colors, monthly = false }: { title: string; stats: PeriodStats; colors: Palette; monthly?: boolean }) {
  const items: Array<[string, number | undefined, string, number]> = [['平均体重', stats.averageWeight, 'kg', 1], ['体重变化', stats.weightChange, 'kg', 1], ['平均缺口', stats.averageDeficit, 'kcal', 1], ['平均运动', stats.averageExercise, 'kcal', 1], ['平均摄入', stats.averageIntake, 'kcal', 1], ['平均蛋白质', stats.averageProtein, 'g', 1], ['平均睡眠', stats.averageSleep, 'h', 1], ['平均腰围', stats.averageWaist, 'cm', 1]]
  if (monthly) items.push(['月初体重', stats.startWeight, 'kg', 1], ['当前体重', stats.currentWeight, 'kg', 1])
  return <Card colors={colors}><View style={styles.statsHead}><View><Text style={[styles.statsEyebrow, { color: colors.accent }]}>截至昨天</Text><Text style={[styles.statsTitle, { color: colors.text }]}>{title}</Text></View><Text style={[styles.days, { color: colors.muted }]}>{stats.totalDays === 0 ? '暂无完整日' : `${stats.recordedDays} / ${stats.totalDays} 天`}</Text></View><View style={styles.statsGrid}>{items.map(([label, value, unit, digits]) => <View key={label} style={styles.stat}><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.statValue, { color: colors.text }]}>{formatValue(value, digits)} <Text style={styles.statUnit}>{value == null ? '' : unit}</Text></Text></View>)}</View></Card>
}

const styles = StyleSheet.create({
  count: { minWidth: 64, height: 54, paddingHorizontal: 10, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '3deg' }] },
  countValue: { color: '#18201A', fontFamily: typography.display, fontSize: 20, fontWeight: '900' },
  countLabel: { color: '#18201A', fontFamily: typography.body, fontSize: 9, fontWeight: '700' },
  rangeBar: { flexDirection: 'row', padding: 4, borderRadius: 16 },
  range: { flex: 1, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rangeText: { fontFamily: typography.body, fontSize: 13, fontWeight: '700' },
  metrics: { gap: 8, paddingRight: 20 },
  chartCard: { paddingBottom: 8 },
  unit: { fontFamily: typography.mono, fontSize: 11 },
  chartEmpty: { height: 130, borderBottomWidth: 2, opacity: .55, marginHorizontal: 20 },
  empty: { textAlign: 'center', fontFamily: typography.body, fontSize: 12, lineHeight: 19, margin: 12 },
  statsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  statsEyebrow: { fontFamily: typography.body, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statsTitle: { fontFamily: typography.display, fontSize: 24, fontWeight: '900', marginTop: 2 },
  days: { fontFamily: typography.mono, fontSize: 11 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  stat: { width: '50%' },
  statLabel: { fontFamily: typography.body, fontSize: 11 },
  statValue: { fontFamily: typography.display, fontSize: 20, fontWeight: '800', marginTop: 4 },
  statUnit: { fontFamily: typography.body, fontSize: 10 },
})
