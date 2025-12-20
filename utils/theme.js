import { useColorScheme } from 'react-native';

// Theme color mapping and constants
export const THEME_COLOR_MAP = {
    blue: '#1d72d3',
    teal: '#0d9488',
    orange: '#F57C00',
    slate: '#475569',
};

// Theme Colors for Profile Settings
export const THEME_COLORS = [
    { id: 'blue', color: THEME_COLOR_MAP.blue, name: 'Mavi' },
    { id: 'teal', color: THEME_COLOR_MAP.teal, name: 'Turkuaz' },
    { id: 'orange', color: THEME_COLOR_MAP.orange, name: 'Turuncu' },
    { id: 'slate', color: THEME_COLOR_MAP.slate, name: 'Koyu Gri' },
];

export const LIGHT_COLORS = {
    primary: "#F57C00",
    background: "#F0F2F5",
    surface: "#FFFFFF",
    textDark: "#0f172a",
    textGray: "#647487",
    white: "#FFFFFF",
    success: "#22c55e",
    danger: "#ef4444",
    warning: "#f97316",
    border: "#e5e7eb",
};

export const DARK_COLORS = {
    primary: "#FF9800",
    background: "#0f172a",
    surface: "#1e293b",
    textDark: "#f8fafc",
    textGray: "#94a3b8",
    white: "#FFFFFF",
    success: "#4ade80",
    danger: "#f87171",
    warning: "#fb923c",
    border: "#334155",
};

export const useAppColors = () => {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};

// For backward compatibility while migrating
export const GLOBAL_COLORS = LIGHT_COLORS;
