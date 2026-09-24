import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import type { BodyProfile, DailyRecord, ThemeMode } from '../types/record'
import { calculateBMI } from '../lib/calculations'
import { ActionRow, Card, Header, Screen } from './components'
import { pickBackup, shareCSV, shareJSON } from './files'
import { importTodayFromAppleHealth } from './health'
import { ProfileSheet } from './ProfileSheet'
import type { Palette } from './theme'
import { typography } from './theme'

export function SettingsScreen({ records, profile, theme, onTheme, onProfile, onMerge, onReplace, onClear, onHealthPatch, colors }: { records: DailyRecord[]; profile: BodyProfile; theme: ThemeMode; onTheme: (mode: ThemeMode) => void; onProfile: (profile: BodyProfile) => void; onMerge: (records: DailyRecord[]) => void; onReplace: (records: DailyRecord[]) => void; onClear: () => void; onHealthPatch: (patch: Partial<DailyRecord>) => void; colors: Palette }) {
  const [editing, setEditing] = useState(false), [syncing, setSyncing] = useState(false)
  const run = async (job: () => Promise<unknown>, success?: string) => { try { await job(); if (success) Alert.alert(success) } catch (error) { Alert.alert('操作失败', error instanceof Error ? error.message : '请稍后重试') } }
  const restore = async () => {
    try {
      const incoming = await pickBackup()
      if (!incoming) return
      Alert.alert('恢复数据', `已验证 ${incoming.length} 条记录。选择“合并”会按日期写入；选择“覆盖”会先清空当前数据。`, [
        { text: '取消', style: 'cancel' }, { text: '合并', onPress: () => onMerge(incoming) }, { text: '覆盖', style: 'destructive', onPress: () => onReplace(incoming) },
      ])
    } catch (error) { Alert.alert('无法读取备份', error instanceof Error ? error.message : '文件格式不正确') }
  }
  const clear = () => Alert.alert('清空所有数据？', '请先导出 JSON 备份。此操作无法撤销。', [{ text: '取消', style: 'cancel' }, { text: '继续', style: 'destructive', onPress: () => Alert.alert('再次确认', '永久删除所有本机健康记录？', [{ text: '取消', style: 'cancel' }, { text: '永久删除', style: 'destructive', onPress: onClear }]) }])
  const syncHealth = async () => {
    setSyncing(true)
    try { const result = await importTodayFromAppleHealth(); onHealthPatch(result.patch); Alert.alert('同步完成', result.imported.length ? `已读取：${result.imported.join('、')}` : 'Apple 健康中没有可导入的今日数据。') }
    catch (error) { Alert.alert('无法同步', error instanceof Error ? error.message : '请使用包含 HealthKit 的 iOS 开发版') }
    finally { setSyncing(false) }
  }
  return <Screen colors={colors}>
    <Header eyebrow="本机与隐私" title="设置" colors={colors}/>
    <Text style={[styles.sectionLabel, { color: colors.muted }]}>身体资料</Text>
    <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [styles.profile, { backgroundColor: colors.text, opacity: pressed ? .8 : 1 }]}><View style={[styles.profileIcon, { backgroundColor: colors.lime }]}><Ionicons name="body-outline" size={23} color="#18201A"/></View><View style={{ flex: 1 }}><Text style={styles.profileMeta}>Mifflin–St Jeor 计算资料</Text><Text style={styles.profileValue}>{profile.weightKg == null ? '—' : `${profile.weightKg} kg`}</Text><Text style={styles.profileDetail}>{profile.sex === 'male' ? '男' : profile.sex === 'female' ? '女' : '未填'} · {profile.ageYears ?? '—'} 岁 · {profile.heightCm ?? '—'} cm · BMI {calculateBMI(profile.weightKg, profile.heightCm)?.toFixed(1) ?? '—'}</Text></View><Ionicons name="pencil" size={17} color="#FFFFFFA0"/></Pressable>

    <Text style={[styles.sectionLabel, { color: colors.muted }]}>Apple 健康</Text><Card colors={colors} style={{ paddingVertical: 0 }}><ActionRow icon="heart-outline" title={syncing ? '正在读取…' : '从 Apple 健康同步'} detail="体重、活动能量与睡眠；仅在你点击时读取" onPress={syncing ? () => undefined : syncHealth} colors={colors}/></Card>

    <Text style={[styles.sectionLabel, { color: colors.muted }]}>外观</Text><View style={styles.appearance}>{([['system', '跟随系统', 'contrast-outline'], ['light', '浅色', 'sunny-outline'], ['dark', '深色', 'moon-outline']] as Array<[ThemeMode, string, 'contrast-outline' | 'sunny-outline' | 'moon-outline']>).map(([id, label, icon]) => <Pressable key={id} onPress={() => onTheme(id)} style={[styles.appearanceButton, { backgroundColor: theme === id ? colors.text : colors.surface, borderColor: theme === id ? colors.text : colors.line }]}><Ionicons name={icon} size={20} color={theme === id ? colors.background : colors.text}/><Text style={[styles.appearanceText, { color: theme === id ? colors.background : colors.text }]}>{label}</Text></Pressable>)}</View>

    <Text style={[styles.sectionLabel, { color: colors.muted }]}>数据管理</Text><Card colors={colors} style={{ paddingVertical: 0 }}><ActionRow icon="download-outline" title="导出 CSV" detail="用于表格分析" onPress={() => run(() => shareCSV(records))} colors={colors}/><ActionRow icon="document-text-outline" title="导出 JSON" detail="完整、安全备份" onPress={() => run(() => shareJSON(records))} colors={colors}/><ActionRow icon="refresh-outline" title="从 JSON 恢复" detail="合并或覆盖本机数据" onPress={restore} colors={colors}/><ActionRow icon="trash-outline" title="清空所有数据" detail="需要两次确认" onPress={clear} colors={colors} destructive/></Card>

    <View style={[styles.privacy, { backgroundColor: colors.accentSoft }]}><Ionicons name="lock-closed" size={24} color={colors.accent}/><View style={{ flex: 1 }}><Text style={[styles.privacyTitle, { color: colors.text }]}>你的数据，只属于你</Text><Text style={[styles.privacyCopy, { color: colors.muted }]}>记录保存在此 App 的本机空间，不会自动上传服务器。更新 App 不会清除数据，但卸载 App 会；请定期导出 JSON。</Text></View></View>
    <Text style={[styles.version, { color: colors.muted }]}>轻衡 2.0 · Expo 原生版</Text>
    <ProfileSheet visible={editing} value={profile} onClose={() => setEditing(false)} onSave={next => { onProfile(next); setEditing(false) }} colors={colors}/>
  </Screen>
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: typography.body, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3, marginBottom: -8 },
  profile: { minHeight: 118, borderRadius: 25, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  profileIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  profileMeta: { color: '#FFFFFF98', fontFamily: typography.body, fontSize: 10 },
  profileValue: { color: '#FFFFFF', fontFamily: typography.display, fontSize: 26, fontWeight: '900', marginTop: 3 },
  profileDetail: { color: '#FFFFFFA8', fontFamily: typography.body, fontSize: 10, marginTop: 3 },
  appearance: { flexDirection: 'row', gap: 9 },
  appearanceButton: { flex: 1, minHeight: 74, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  appearanceText: { fontFamily: typography.body, fontSize: 11, fontWeight: '700' },
  privacy: { borderRadius: 22, padding: 17, flexDirection: 'row', gap: 13 },
  privacyTitle: { fontFamily: typography.body, fontSize: 14, fontWeight: '800' },
  privacyCopy: { fontFamily: typography.body, fontSize: 11, lineHeight: 18, marginTop: 4 },
  version: { textAlign: 'center', fontFamily: typography.mono, fontSize: 10, marginTop: 2 },
})
