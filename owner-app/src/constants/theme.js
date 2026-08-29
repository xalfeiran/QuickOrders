// One small shared palette/spacing scale so every screen looks consistent
// without pulling in a UI kit. Feel free to retune `colors.primary` to match
// the restaurant's branding.
export const colors = {
  primary: '#d64545',
  primaryDark: '#b93636',
  background: '#f7f5f2',
  surface: '#ffffff',
  border: '#e6e1db',
  text: '#26201c',
  muted: '#7a716a',
  danger: '#c0392b',
  success: '#1e8e3e',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
};
