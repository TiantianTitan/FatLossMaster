import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState, type ComponentProps, type PropsWithChildren } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Palette } from './theme'
import { shadow, typography } from './theme'

export type IconName = ComponentProps<typeof Ionicons>['name']

export function Screen({ children, colors, scroll = true }: PropsWithChildren<{ colors: Palette; scroll?: boolean }>) {
  const insets = useSafeAreaInsets()
  const content = <View style={[styles.screenContent, { paddingTop: insets.top + 12, paddingBottom: 118 }]}>{children}</View>
  return scroll ? <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{content}</ScrollView> : <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>
}

export function Header({ eyebrow, title, right, colors }: { eyebrow: string; title: string; right?: React.ReactNode; colors: Palette }) {
  return <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text><Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text></View>{right}</View>
}

export function Card({ children, colors, style }: PropsWithChildren<{ colors: Palette; style?: object }>) {
  return <View style={[styles.card, shadow, { backgroundColor: colors.surface, borderColor: colors.line }, style]}>{children}</View>
}

export function SectionTitle({ children, colors, trailing }: PropsWithChildren<{ colors: Palette; trailing?: React.ReactNode }>) {
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.text }]}>{children}</Text>{trailing}</View>
}

export function Pill({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: Palette }) {
  return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: active ? colors.text : colors.surface, borderColor: active ? colors.text : colors.line }]}><Text style={[styles.pillText, { color: active ? colors.background : colors.muted }]}>{label}</Text></Pressable>
}

export function ActionRow({ icon, title, detail, onPress, colors, destructive = false }: { icon: IconName; title: string; detail?: string; onPress: () => void; colors: Palette; destructive?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, { borderBottomColor: colors.line, opacity: pressed ? .55 : 1 }]}><View style={[styles.actionIcon, { backgroundColor: destructive ? `${colors.danger}18` : colors.accentSoft }]}><Ionicons name={icon} color={destructive ? colors.danger : colors.accent} size={20}/></View><View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: destructive ? colors.danger : colors.text }]}>{title}</Text>{detail ? <Text style={[styles.actionDetail, { color: colors.muted }]}>{detail}</Text> : null}</View><Ionicons name="chevron-forward" size={18} color={colors.muted}/></Pressable>
}

export function NumberField({ label, value, unit, placeholder, onCommit, onValueChange, colors }: { label: string; value?: number; unit: string; placeholder?: string; onCommit: (value?: number) => void; onValueChange?: (value?: number) => void; colors: Palette }) {
  const text = value == null ? '' : String(value)
  const [draft, setDraft] = useState(text), [focused, setFocused] = useState(false)
  useEffect(() => { if (!focused) setDraft(text) }, [text, focused])
  const parse = (raw: string) => { const normalized = raw.trim().replace(',', '.'); const parsed = normalized === '' ? undefined : Number(normalized); return parsed != null && Number.isFinite(parsed) ? parsed : undefined }
  return <View style={[styles.fieldRow, { borderBottomColor: colors.line }]}><Text style={[styles.fieldLabel, { color: colors.text }]}>{label}</Text><TextInput
    value={draft} placeholder={placeholder ?? '—'} placeholderTextColor={colors.muted} keyboardType="decimal-pad" selectTextOnFocus onFocus={() => setFocused(true)}
    onChangeText={raw => { setDraft(raw); onValueChange?.(parse(raw)) }} onEndEditing={event => { setFocused(false); onCommit(parse(event.nativeEvent.text)) }}
    style={[styles.numberInput, { color: colors.text, backgroundColor: colors.surfaceAlt }]}/><Text style={[styles.unit, { color: colors.muted }]}>{unit}</Text></View>
}

export function Sheet({ visible, title, onClose, children, colors }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void; colors: Palette }>) {
  const insets = useSafeAreaInsets()
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}/><View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(20, insets.bottom + 8) }]}><View style={styles.sheetHandle}/><View style={styles.sheetHeader}><Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text><Pressable onPress={onClose} hitSlop={12}><Ionicons name="close-circle" size={28} color={colors.muted}/></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView></View></Modal>
}

export function PrimaryButton({ label, onPress, colors, disabled = false, icon }: { label: string; onPress: () => void; colors: Palette; disabled?: boolean; icon?: IconName }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, { backgroundColor: colors.text, opacity: disabled ? .35 : pressed ? .75 : 1 }]}>{icon ? <Ionicons name={icon} size={18} color={colors.background}/> : null}<Text style={[styles.primaryText, { color: colors.background }]}>{label}</Text></Pressable>
}

export const formatValue = (value?: number, digits = 0) => value == null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: digits })

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 20, gap: 18 },
  header: { minHeight: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: typography.body, fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontFamily: typography.display, fontSize: 36, fontWeight: '800', letterSpacing: -.9 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 18 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionText: { fontFamily: typography.body, fontSize: 18, fontWeight: '700' },
  pill: { minHeight: 38, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 20 },
  pillText: { fontFamily: typography.body, fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth },
  actionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: typography.body, fontSize: 16, fontWeight: '700' },
  actionDetail: { fontFamily: typography.body, fontSize: 12, marginTop: 3 },
  fieldRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  fieldLabel: { flex: 1, fontFamily: typography.body, fontSize: 15, fontWeight: '600' },
  numberInput: { minWidth: 96, height: 42, borderRadius: 12, paddingHorizontal: 12, fontFamily: typography.mono, fontSize: 16, textAlign: 'right' },
  unit: { width: 45, marginLeft: 8, fontFamily: typography.body, fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.42)' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { width: 38, height: 5, borderRadius: 3, backgroundColor: '#9B9B9B55', alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontFamily: typography.display, fontSize: 26, fontWeight: '800' },
  primary: { minHeight: 54, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginVertical: 14 },
  primaryText: { fontFamily: typography.body, fontSize: 16, fontWeight: '800' },
})
