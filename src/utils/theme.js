// Theme Management Utility (Male, Female, Neutral)

export const THEMES = {
  BLUE: 'blue',
  PINK: 'pink',
  GREEN: 'green',
  YELLOW: 'yellow'
};

export const THEME_DETAILS = {
  blue: {
    id: 'blue',
    name: '블루 오션',
    icon: '🌊',
    color: '#007aff',
    badgeClass: 'badge-blue'
  },
  pink: {
    id: 'pink',
    name: '핑크 블라썸',
    icon: '🌸',
    color: '#ff2d55',
    badgeClass: 'badge-pink'
  },
  green: {
    id: 'green',
    name: '그린 포레스트',
    icon: '🌲',
    color: '#34c759',
    badgeClass: 'badge-green'
  },
  yellow: {
    id: 'yellow',
    name: '옐로우 스파크',
    icon: '⚡',
    color: '#ffcc00',
    badgeClass: 'badge-yellow'
  }
};

export function applyTheme(themeId) {
  const root = document.documentElement;
  if (themeId === THEMES.BLUE) {
    root.removeAttribute('data-theme'); // default in index.css is blue
  } else {
    root.setAttribute('data-theme', themeId);
  }
}
