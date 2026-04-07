// src/theme/index.ts
export const Colors = {
  yellow:       '#F5C800',
  yellowDark:   '#D4AC00',
  yellowLight:  '#FFF8CC',
  black:        '#1A1A1A',
  blackSoft:    '#2C2C2C',
  white:        '#FFFFFF',
  offWhite:     '#F8F8F6',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F4F4F2',
  border:       '#E8E8E4',
  borderStrong: '#CCCCCC',
  success:      '#2E7D32',
  successLight: '#E8F5E9',
  warning:      '#F57F17',
  warningLight: '#FFF8E1',
  danger:       '#C62828',
  dangerLight:  '#FFEBEE',
  info:         '#1565C0',
  infoLight:    '#E3F2FD',
  textPrimary:   '#1A1A1A',
  textSecondary: '#555550',
  textMuted:     '#999990',
};

export const Fonts = {
  regular: 'System',
  bold:    'System',
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 999,
};

export const FontSize = {
  xs: 10, sm: 12, md: 14, base: 16, lg: 18, xl: 22, xxl: 28, hero: 36,
};

export const Shadow = {
  sm: { shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:4, elevation:2 },
  md: { shadowColor:'#000', shadowOffset:{width:0,height:3}, shadowOpacity:0.12, shadowRadius:8, elevation:4 },
};
