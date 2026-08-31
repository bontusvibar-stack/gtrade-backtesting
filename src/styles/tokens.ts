export const colors = {
  // Core
  background: '#050505',
  surface: '#0A0A0A',
  surfaceElevated: '#111111',
  surfaceHover: '#151515',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#050505',

  // Accent - Hermes Amber/Orange
  accent: '#F59E0B',
  accentHover: '#D97706',
  accentMuted: 'rgba(245,158,11,0.12)',
  accentGlow: 'rgba(245,158,11,0.4)',

  // P&L
  profit: '#22C55E',
  profitMuted: 'rgba(34,197,94,0.12)',
  loss: '#EF4444',
  lossMuted: 'rgba(239,68,68,0.12)',

  // Semantic
  warning: '#F59E0B',
  info: '#3B82F6',
  error: '#EF4444',

  // UI States
  focus: 'rgba(245,158,11,0.4)',
  selection: 'rgba(245,158,11,0.08)',

  // Sidebar
  sidebarBg: '#121212',
  sidebarBorder: 'rgba(255,255,255,0.06)',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 12px rgba(0,0,0,0.4)',
  lg: '0 8px 24px rgba(0,0,0,0.5)',
  xl: '0 16px 48px rgba(0,0,0,0.6)',
  glow: '0 0 24px rgba(245,158,11,0.3)',
  glowAmber: '0 0 32px rgba(245,158,11,0.4)',
} as const;

export const transitions = {
  fast: '120ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const typography = {
  fontSans: 'Geist, Inter, system-ui, sans-serif',
  fontMono: 'Geist Mono, JetBrains Mono, monospace',
  fontDisplay: 'Geist, Inter, system-ui, sans-serif',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
  sidebar: 700,
  topbar: 800,
  commandBar: 900,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type ShadowToken = keyof typeof shadows;