import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BodyProfile, Sex } from '../types/record'
import { calculateBMI } from '../lib/calculations'
import { NumberField, PrimaryButton, Sheet } from './components'
import type { Palette } from './theme'
import { typography } from './theme'

export function ProfileSheet({ visible, value, required = false, onClose, onSave, colors }: { visible: boolean; value: BodyProfile; required?: boolean; onClose: () => void; onSave: (value: BodyProfile) => void; colors: Palette }) {
  const [draft, setDraft] = useState<BodyProfile>(value)
  useEffect(() => { if (visible) setDraft(value) }, [visible, value])
  const update = (patch: Partial<BodyProfile>) => setDraft(current => ({ ...current, ...patch }))
  return <Sheet visible={visible} title={required ? '先认识一下你' : '身体资料'} onClose={required ? () => undefined : onClose} colors={colors}>
    <Text style={[styles.intro, { color: colors.muted }]}>{required ? '性别和年龄用于 Mifflin–St Jeor 静息消耗估算，之后可以在设置中修改。' : '这些资料作为每日默认值；体重变化时只需更新这里。'}</Text>
    <Text style={[styles.label, { color: colors.text }]}>性别</Text><View style={styles.sexRow}>{(['male', 'female'] as Sex[]).map(sex => <Pressable key={sex} onPress={() => update({ sex })} style={[styles.sex, { backgroundColor: draft.sex === sex ? colors.text : colors.surfaceAlt }]}><Text style={[styles.sexText, { color: draft.sex === sex ? colors.background : colors.text }]}>{sex === 'male' ? '男' : '女'}</Text></Pressable>)}</View>
    <View style={{ marginTop: 10 }}><NumberField label="年龄" value={draft.ageYears} unit="岁" onCommit={ageYears => update({ ageYears })} onValueChange={ageYears => update({ ageYears })} colors={colors}/><NumberField label="身高" value={draft.heightCm} unit="cm" onCommit={heightCm => update({ heightCm })} onValueChange={heightCm => update({ heightCm })} colors={colors}/><NumberField label="体重" value={draft.weightKg} unit="kg" onCommit={weightKg => update({ weightKg })} onValueChange={weightKg => update({ weightKg })} colors={colors}/><NumberField label="腰围" value={draft.waistCm} unit="cm" onCommit={waistCm => update({ waistCm })} onValueChange={waistCm => update({ waistCm })} colors={colors}/></View>
    <View style={[styles.bmi, { backgroundColor: colors.accentSoft }]}><Text style={[styles.bmiLabel, { color: colors.muted }]}>当前 BMI</Text><Text style={[styles.bmiValue, { color: colors.text }]}>{calculateBMI(draft.weightKg, draft.heightCm)?.toFixed(1) ?? '—'}</Text></View>
    <PrimaryButton label="保存身体资料" onPress={() => onSave(draft)} disabled={!draft.ageYears || !draft.sex} colors={colors}/>
  </Sheet>
}

const styles = StyleSheet.create({
  intro: { fontFamily: typography.body, fontSize: 13, lineHeight: 20, marginBottom: 18 },
  label: { fontFamily: typography.body, fontSize: 14, fontWeight: '800', marginBottom: 9 },
  sexRow: { flexDirection: 'row', gap: 10 },
  sex: { flex: 1, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sexText: { fontFamily: typography.body, fontSize: 15, fontWeight: '800' },
  bmi: { marginTop: 16, padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bmiLabel: { fontFamily: typography.body, fontSize: 13 },
  bmiValue: { fontFamily: typography.display, fontSize: 25, fontWeight: '900' },
})
