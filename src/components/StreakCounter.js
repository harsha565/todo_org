import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { Flame, Plus } from 'lucide-react-native';

const StreakItem = ({ task }) => (
    <View style={styles.streakWrapper}>
        <View style={[styles.streakCard, task.completed && styles.streakCardActive]}>
            <Flame
                size={32} // Larger Icon
                color={task.completed ? '#FFF' : COLORS.secondaryText} // White flame on active
                fill={task.completed ? '#FFF' : 'transparent'}
            />
            <Text style={[styles.streakCount, task.completed && styles.streakCountActive]}>
                {task.streak || 0}
            </Text>
            {/* Active glowing indicator */}
            {task.completed && <View style={styles.glowOverlay} />}
        </View>
        <Text style={styles.streakName} numberOfLines={1}>{task.text}</Text>
    </View>
);

const AddStreakBtn = ({ onPress }) => (
    <View style={styles.streakWrapper}>
        <TouchableOpacity style={[styles.streakCard, styles.addCard]} onPress={onPress}>
            <Plus size={32} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.streakName} numberOfLines={1}>New Streak</Text>
    </View>
);

const StreakCounter = ({ tasks, onAddStreak }) => {
    // Filter only streak items
    const streakTasks = tasks.filter(t => t.isStreak);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Active Streaks</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {streakTasks.map(task => (
                    <StreakItem key={task.id} task={task} />
                ))}
                {/* Add Streak Button at the end */}
                <AddStreakBtn onPress={onAddStreak} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 25,
    },
    label: {
        color: COLORS.secondaryText,
        fontSize: 14,
        marginBottom: 15,
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingRight: 20,
    },
    streakWrapper: {
        alignItems: 'center',
        marginRight: 20,
        width: 90,
    },
    streakCard: {
        width: 70,
        height: 90,
        backgroundColor: COLORS.cardBg,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    streakCardActive: {
        backgroundColor: COLORS.accent, // Full Accent Background for "Bold" look
        borderColor: COLORS.accent,
    },
    addCard: {
        borderColor: COLORS.accent,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 69, 0, 0.1)',
    },
    streakCount: {
        fontSize: 28, // Bigger Font
        fontWeight: '900', // Boldest
        color: COLORS.text,
        marginVertical: 5,
    },
    streakCountActive: {
        color: '#000', // Black text on Orange background
    },
    streakName: {
        color: COLORS.secondaryText,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
    },
    glowOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
        opacity: 0.1,
    }
});

export default StreakCounter;
