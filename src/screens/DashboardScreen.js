import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTasks } from '../context/TaskContext';
import StreakCounter from '../components/StreakCounter';
import { Plus, Check, Trash2, Calendar, Settings } from 'lucide-react-native';
import { format } from 'date-fns';
import ScreenWrapper from '../components/ScreenWrapper';
import TaskInputModal from '../components/TaskInputModal';

const DashboardScreen = ({ navigation }) => {
    const { tasks, addTask, toggleTask, deleteTask } = useTasks();
    const [isMissionModalVisible, setMissionModalVisible] = useState(false);
    const [isStreakModalVisible, setStreakModalVisible] = useState(false);

    // Add Standard Mission
    const handleAddMission = (text) => {
        addTask(text, false); // isStreak = false
        setMissionModalVisible(false);
    };

    // Add Streak Habit
    const handleAddStreak = (text) => {
        addTask(text, true); // isStreak = true
        setStreakModalVisible(false);
    };

    const renderTask = ({ item }) => (
        <View style={styles.taskItem}>
            <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxActive]}
                onPress={() => toggleTask(item.id)}
            >
                {item.completed && <Check size={18} color="#000" strokeWidth={3} />}
            </TouchableOpacity>

            <Text style={[styles.taskText, item.completed && styles.taskTextCompleted]}>
                {item.text}
            </Text>

            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
                <Trash2 size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                renderItem={renderTask}
                ListHeaderComponent={() => (
                    <View>
                        <StreakCounter
                            tasks={tasks}
                            onAddStreak={() => setStreakModalVisible(true)}
                        />
                        <View style={styles.dateHeader}>
                            <Text style={styles.sectionTitle}>Today's Missions</Text>
                            <Text style={styles.dateText}>{format(new Date(), 'MMMM do, yyyy')}</Text>
                        </View>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
            />

            {/* Floating Action Button (Missions) */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setMissionModalVisible(true)}
            >
                <Plus color="#000" size={32} />
            </TouchableOpacity>

            {/* Mission Modal */}
            <TaskInputModal
                visible={isMissionModalVisible}
                onClose={() => setMissionModalVisible(false)}
                onAddTask={handleAddMission}
                title="What would be your next mission?"
            />

            {/* Streak Modal */}
            <TaskInputModal
                visible={isStreakModalVisible}
                onClose={() => setStreakModalVisible(false)}
                onAddTask={handleAddStreak}
                title="Ignite a New Streak"
            />

            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                    <Calendar color={COLORS.secondaryText} size={24} />
                </TouchableOpacity>
                <View style={styles.navIndicator} />
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Settings color={COLORS.secondaryText} size={24} />
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: 10,
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    dateHeader: {
        marginTop: 10,
        marginBottom: 15,
        marginLeft: 5,
    },
    dateText: {
        color: COLORS.secondaryText,
        fontSize: 14,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        padding: SIZES.padding,
        paddingBottom: 100,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: SIZES.radius,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222',
        // Highlight streaks slightly in list? Maybe not needed as per request
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.accent,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.accent,
    },
    taskText: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    taskTextCompleted: {
        color: COLORS.secondaryText,
        textDecorationLine: 'line-through',
    },
    deleteBtn: {
        padding: 5,
    },
    fab: {
        position: 'absolute',
        bottom: 90, // Above bottom nav
        right: 20,
        backgroundColor: COLORS.accent,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#222',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navIndicator: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.accent,
        borderRadius: 2,
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        display: 'none',
    }
});

export default DashboardScreen;
