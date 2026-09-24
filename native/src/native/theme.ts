import { Platform } from 'react-native'

export type Palette = typeof light

export const light = {
  background: '#F3F0E8', surface: '#FCFAF5', surfaceAlt: '#EAE6DA', text: '#18201A', muted: '#6E756E',
  line: '#D9D5C9', accent: '#187A56', accentSoft: '#DDEDE4', lime: '#DDEB73', coral: '#E57B63', danger: '#B74437', white: '#FFFFFF',
}

export const dark: Palette = {
  background: '#111612', surface: '#1A211C', surfaceAlt: '#252D27', text: '#F4F2E9', muted: '#A4ACA4',
  line: '#343D36', accent: '#66C89B', accentSoft: '#1E3A2C', lime: '#C9DA63', coral: '#F18B73', danger: '#F07D6D', white: '#FFFFFF',
}

export const typography = {
  display: Platform.select({ ios: 'New York', default: 'serif' }),
  body: Platform.select({ ios: 'Avenir Next', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
}

export const shadow = Platform.select({
  ios: { shadowColor: '#172118', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20 },
  android: { elevation: 3 },
  default: {},
})
