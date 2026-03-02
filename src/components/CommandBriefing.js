import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

const CommandBriefing = ({ briefing }) => {
    const { message, icon, type } = briefing || {};
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!message) return;

        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            if (i < message.length) {
                setDisplayedText(prev => prev + message.charAt(i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, 30); // Speed of typing

        return () => clearInterval(interval);
    }, [message]);

    if (!message) return null;

    let borderColor = '#333';
    let textColor = COLORS.secondaryText;

    if (type === 'warning') { borderColor = '#EF4444'; textColor = '#FCA5A5'; }
    if (type === 'momentum') { borderColor = '#F59E0B'; textColor = '#FCD34D'; }
    if (type === 'comeback') { borderColor = '#10B981'; textColor = '#6EE7B7'; }

    return (
        <View style={[styles.container, { borderColor }]}>
            <View style={styles.iconContainer}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>COMMAND BRIEFING</Text>
                <Text style={[styles.message, { color: textColor }]}>
                    {displayedText}
                    <Text style={styles.cursor}>|</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 0,
        marginBottom: 20,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1, // subtle styling
        // borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 // Only left border colored? 
        // User requested "Clean, typewriter...". Let's do full box but subtle.
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 10,
        color: '#666',
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    message: {
        fontSize: 14,
        fontFamily: 'monospace', // Try monospace if system supports
        lineHeight: 20,
        fontWeight: '400',
    },
    cursor: {
        color: COLORS.accent,
        opacity: 0.8,
    }
});

export default CommandBriefing;
