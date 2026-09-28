import { describe,expect,it } from 'vitest'
import { preferencesAfterImport } from './preferences'

describe('preference restore rules',()=>{
  it('keeps a local target during a safe merge',()=>{
    expect(preferencesAfterImport({proteinTargetGrams:120},{proteinTargetGrams:150},'merge')).toEqual({proteinTargetGrams:120})
  })

  it('fills an unset target during a safe merge',()=>{
    expect(preferencesAfterImport({}, {proteinTargetGrams:150},'merge')).toEqual({proteinTargetGrams:150})
  })

  it('restores an explicitly empty version 4 preference set on replacement',()=>{
    expect(preferencesAfterImport({proteinTargetGrams:120},{},'replace')).toEqual({})
  })

  it('preserves local settings when an old backup has no preferences',()=>{
    expect(preferencesAfterImport({proteinTargetGrams:120},undefined,'replace')).toEqual({proteinTargetGrams:120})
  })
})
