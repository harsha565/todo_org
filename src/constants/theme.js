export const COLORS = {
    background: '#212121', // Dashboard Gray
    cardBg: '#121212',
    text: '#FFFFFF',
    secondaryText: '#888888',
    accent: '#FF4500', // Orange (Flame)
    primary: '#3B82F6', // Blue
    success: '#10B981', // Green
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4'
};

export const SIZES = {
    padding: 20,
    radius: 12,
    base: 8,
    font: 14,
    h1: 30,
    h2: 22,
    h3: 16,
    h4: 14
};

export const FONTS = {
    h1: { fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
    h2: { fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
    h3: { fontSize: SIZES.h3, lineHeight: 22, fontWeight: 'bold' },
    body1: { fontSize: SIZES.font, lineHeight: 22 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
