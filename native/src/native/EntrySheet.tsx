import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import * as Crypto from 'expo-crypto'
import type { ActivityEntry, FoodEntry } from '../types/record'
import type { Palette } from './theme'
import { NumberField, PrimaryButton, Sheet } from './components'
import { typography } from './theme'

type Kind = 'food' | 'activity'
type Entry = FoodEntry | ActivityEntry

export function EntrySheet({ kind, entry, visible, onClose, onSave, colors }: { kind: Kind; entry?: Entry; visible: boolean; onClose: () => void; onSave: (entry: Entry) => void; colors: Palette }) {
  const [name, setName] = useState(''), [calories, setCalories] = useState<number>(), [protein, setProtein] = useState<number>()
  useEffect(() => { if (visible) { setName(entry?.name ?? ''); setCalories(entry?.calories); setProtein(kind === 'food' ? (entry as FoodEntry | undefined)?.proteinGrams : undefined) } }, [visible, entry, kind])
  const save = () => {
    if (calories == null || calories < 0) return
    const base = { id: entry?.id ?? Crypto.randomUUID(), name: name.trim(), calories }
    onSave(kind === 'food' ? { ...base, proteinGrams: protein } : base)
    onClose()
  }
  return <Sheet visible={visible} title={entry ? `修改${kind === 'food' ? '膳食' : '运动'}` : `添加${kind === 'food' ? '膳食' : '运动'}`} onClose={onClose} colors={colors}>
    <Text style={[styles.label, { color: colors.text }]}>名称 <Text style={{ color: colors.muted }}>（可选）</Text></Text>
    <TextInput value={name} onChangeText={setName} placeholder={kind === 'food' ? '例如：午餐' : '例如：力量训练'} placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}/>
    <View style={[styles.numeric, { backgroundColor: colors.surface }]}><NumberField label="热量" value={calories} unit="kcal" onCommit={setCalories} onValueChange={setCalories} colors={colors}/>{kind === 'food' ? <NumberField label="蛋白质" value={protein} unit="g" onCommit={setProtein} onValueChange={setProtein} colors={colors}/> : null}</View>
    <PrimaryButton label={entry ? '保存修改' : '添加到今天'} onPress={save} disabled={calories == null || calories < 0} colors={colors}/>
  </Sheet>
}

const styles = StyleSheet.create({
  label: { fontFamily: typography.body, fontSize: 14, fontWeight: '700', marginBottom: 9 },
  input: { height: 52, borderRadius: 16, paddingHorizontal: 16, fontFamily: typography.body, fontSize: 16 },
  numeric: { marginTop: 12 },
})
