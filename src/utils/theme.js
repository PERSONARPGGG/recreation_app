// Theme Management Utility (Male, Female, Neutral)

export const THEMES = {
  MALE: 'male',       // ♂ Cyberpunk Blue Neon
  FEMALE: 'female',   // ♀ Glamour Magenta Pink
  NEUTRAL: 'neutral'  // ☯ Emerald Luxe Gold
};

export const THEME_DETAILS = {
  male: {
    id: 'male',
    name: '♂ 남성 전용 (Cyber Blue)',
    icon: '⚡',
    color: '#00f3ff',
    badgeClass: 'badge-male'
  },
  female: {
    id: 'female',
    name: '♀ 여성 전용 (Glam Magenta)',
    icon: '✨',
    color: '#ff007a',
    badgeClass: 'badge-female'
  },
  neutral: {
    id: 'neutral',
    name: '☯ 중성 럭셔리 (Emerald Gold)',
    icon: '👑',
    color: '#ffd700',
    badgeClass: 'badge-neutral'
  }
};

export function applyTheme(themeId) {
  const root = document.documentElement;
  if (themeId === THEMES.MALE) {
    root.removeAttribute('data-theme'); // default in index.css is male
  } else {
    root.setAttribute('data-theme', themeId);
  }
}
