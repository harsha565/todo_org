import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = "streakmaster_active_theme";

export const GRADIENT_THEMES = {
    PITCH_BLACK: {
        id: 'PITCH_BLACK',
        name: 'Pitch Black',
        colors: ['#000000', '#0a0500', '#120800'],
        preview: '#000'
    },
    MIDNIGHT_BLUE: {
        id: 'MIDNIGHT_BLUE',
        name: 'Midnight Blue',
        colors: ['#000010', '#0a0a2e', '#1a1a40'],
        preview: '#000010'
    },
    MAGMA_RED: {
        id: 'MAGMA_RED',
        name: 'Magma Red',
        colors: ['#1a0500', '#2d0a00', '#400f00'],
        preview: '#1a0500'
    },
    DEEP_SPACE: {
        id: 'DEEP_SPACE',
        name: 'Deep Space',
        colors: ['#050510', '#201030', '#301540'],
        preview: '#201030'
    },
    CYBER_FOREST: {
        id: 'CYBER_FOREST',
        name: 'Cyber Forest',
        colors: ['#001005', '#002010', '#003015'],
        preview: '#001005'
    }
};

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [activeThemeId, setActiveThemeId] = useState('PITCH_BLACK');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem(THEME_KEY);
            if (stored && GRADIENT_THEMES[stored]) {
                setActiveThemeId(stored);
            }
        } catch (e) {
            console.error("Theme Load Error", e);
            // Fallback to default is already handled by useState default
        }
    };

    const setTheme = async (themeId) => {
        if (GRADIENT_THEMES[themeId]) {
            setActiveThemeId(themeId);
            await AsyncStorage.setItem(THEME_KEY, themeId);
        }
    };

    const activeColors = GRADIENT_THEMES[activeThemeId]?.colors || GRADIENT_THEMES.PITCH_BLACK.colors;

    return (
        <ThemeContext.Provider value={{
            activeThemeId,
            setTheme,
            activeColors,
            themes: Object.values(GRADIENT_THEMES)
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
