import type { AppPreferences } from '../types/record'

const PREFERENCES_KEY = 'light-balance:preferences'

export const loadPreferences = (): AppPreferences => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}')
    if (!value || typeof value !== 'object') return {}
    const proteinTargetGrams = (value as AppPreferences).proteinTargetGrams
    return typeof proteinTargetGrams === 'number' && Number.isFinite(proteinTargetGrams) && proteinTargetGrams >= 10 && proteinTargetGrams <= 500
      ? { proteinTargetGrams }
      : {}
  } catch {
    return {}
  }
}

export const savePreferences = (preferences: AppPreferences) => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    // The app remains usable when private browsing blocks localStorage.
  }
}

export const preferencesAfterImport = (local:AppPreferences,incoming:AppPreferences|undefined,mode:'merge'|'replace'):AppPreferences => {
  if(mode==='replace')return incoming??local
  const proteinTargetGrams=local.proteinTargetGrams??incoming?.proteinTargetGrams
  return proteinTargetGrams==null?{}:{proteinTargetGrams}
}
