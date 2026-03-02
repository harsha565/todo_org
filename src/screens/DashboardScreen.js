import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, Trash2, Calendar, Settings, Edit2, BarChart2, User, Flame, Home } from 'lucide-react-native';
import { format } from 'date-fns';
import ScreenWrapper from '../components/ScreenWrapper';
import TaskInputModal from '../components/TaskInputModal';
import DailyCheckInModal from '../components/DailyCheckInModal';
import StreakListModal from '../components/StreakListModal';
import CalendarPanel from '../components/CalendarModal';
import { DataService } from '../services/DataService';
import { useFocusEffect } from '@react-navigation/native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const QUOTES = {
    morning: [
        "What’s your plan for today?", "Today is yours to shape.", "Start with one clear step.", "Momentum begins now.", "Focus creates results.",
        "Begin before you feel ready.", "One task sets the tone.", "Clarity beats motivation.", "Today rewards action.", "Move first. Adjust later.",
        "Your future starts today.", "Discipline builds freedom.", "Do the important thing first.", "Energy follows action.", "Progress starts small.",
        "Execution defines the day.", "Make today count.", "Choose focus over noise.", "One win changes everything.", "Show up for today."
    ],
    afternoon: [
        "How’s the day going so far?", "Keep the momentum going.", "There’s still time to move forward.", "Progress beats perfection.", "One task at a time.",
        "Stay consistent.", "Small steps still count.", "Finish what you started.", "Refocus and continue.", "Half done is still progress.",
        "Momentum is built now.", "Don’t break the flow.", "Your effort matters.", "Stay in motion.", "This hour counts.",
        "Consistency wins.", "Keep pushing forward.", "Execution over excuses.", "You’re still in control.", "Finish strong."
    ],
    evening_done: [
        "Well done. You showed up today.", "Progress made. Rest earned.", "You kept your word today.", "Consistency achieved.", "Another step forward.",
        "You honored your discipline.", "Momentum protected.", "Strong finish today.", "You did what mattered.", "Day closed with effort.",
        "You stayed committed.", "Progress compounds.", "Today counts.", "You moved forward.", "Effort acknowledged.",
        "You followed through.", "Discipline maintained.", "A good day’s work.", "Respect the effort.", "Well executed."
    ],
    evening_not_done: [
        "One small step still matters.", "Finish strong or rest well.", "Progress isn’t always loud.", "Tomorrow is another chance.", "No pressure. Just one step.",
        "Discipline is built slowly.", "You can still act.", "Rest if needed. Return stronger.", "One task can change the day.", "Don’t give up on today.",
        "Every effort counts.", "Even small wins matter.", "You’re still in control.", "Momentum can restart.", "Action is still possible.",
        "End the day intentionally.", "Do what you can.", "Progress isn’t linear.", "Tomorrow builds on today.", "One step is enough."
    ]
};

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const taskContext = useTasks();
    const tasks = taskContext?.tasks || [];
    const { addTask, toggleTask, deleteTask, updateTask, filterCategory, setFilterCategory } = taskContext || {};

    // UI State
    const [isMissionModalVisible, setMissionModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isStreakModalVisible, setStreakModalVisible] = useState(false); // For Creating
    const [isStreakListVisible, setStreakListVisible] = useState(false); // For Viewing
    const [isCheckInVisible, setCheckInVisible] = useState(false);

    // Data State
    const [quote, setQuote] = useState("Discipline is freedom.");

    // Animation State
    const dividerWidth = useRef(new Animated.Value(0)).current;

    const [isCalendarVisible, setCalendarVisible] = useState(false);

    // Derived State
    const activeStreaks = tasks.filter(t => t.isStreak).sort((a, b) => (b.streak || 0) - (a.streak || 0));
    const longestStreak = activeStreaks.length > 0 ? activeStreaks.reduce((prev, current) => (prev.streak > current.streak) ? prev : current) : null;
    const username = user?.email ? user.email.split('@')[0] : 'Commander';

    const dailyMissions = tasks; // All tasks (including streaks) count as missions/tasks now
    const completedMissions = dailyMissions.filter(t => t.completed).length;
    const totalMissions = dailyMissions.length;
    const showStats = completedMissions > 0;

    // Divider Animation
    useEffect(() => {
        dividerWidth.setValue(0);
        Animated.timing(dividerWidth, {
            toValue: width * 0.9, // 90% width, subtle divider
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, []);

    // Quote Logic
    useEffect(() => {
        const loadQuote = async () => {
            // ... existing quote logic
            try {
                const hour = new Date().getHours();
                const dateStr = new Date().toISOString().split('T')[0];
                let timeFrame = 'morning';
                let pool = QUOTES.morning;

                if (hour >= 12 && hour < 19) {
                    timeFrame = 'afternoon';
                    pool = QUOTES.afternoon;
                } else if (hour >= 19 || hour < 6) {
                    const allDone = dailyMissions.length > 0 && dailyMissions.every(t => t.completed);
                    timeFrame = allDone ? 'evening_done' : 'evening_pending';
                    pool = allDone ? QUOTES.evening_done : QUOTES.evening_not_done;
                }

                if (pool && pool.length > 0) {
                    const q = await DataService.getOrSetDailyQuote(dateStr, timeFrame, pool);
                    setQuote(q);
                }
            } catch (error) {
                console.log("Quote Error", error);
                setQuote("Execution defines the day.");
            }
        };
        loadQuote();
    }, [completedMissions, dailyMissions.length]);

    // Trigger Fluid Animation on Progress Change
    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [completedMissions]);


    // --- Actions ---
    const handleEditTask = (task) => {
        setEditingTask(task);
        setMissionModalVisible(true);
    };

    const handleUpdateMission = (id, updates) => {
        if (updateTask) {
            updateTask(id, updates);
            setMissionModalVisible(false);
            setEditingTask(null);
        }
    };

    // Log Logic
    const [targetLogDate, setTargetLogDate] = useState(null); // Date object
    const [editingLogData, setEditingLogData] = useState(null);

    const handleEditLog = (date, existingData) => {
        setTargetLogDate(date);
        setEditingLogData(existingData);
        setCheckInVisible(true);
    };

    const handleCheckInSave = async (data) => {
        const dateToSave = targetLogDate ? format(targetLogDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        try {
            await DataService.saveDailyLog({ ...data, date: dateToSave });
            setCheckInVisible(false);
            setTargetLogDate(null);
            setEditingLogData(null);
        } catch (e) {
            console.error("Failed to save log", e);
        }
    };

    const handleAddMission = (text, options) => {
        if (addTask) {
            addTask(text, { ...options, isStreak: false });
            setMissionModalVisible(false);
        }
    };

    const handleAddStreak = (text, options) => {
        if (addTask) {
            addTask(text, { ...options, isStreak: true, isHabit: true });
            setStreakModalVisible(false); // Close creation modal
            setStreakListVisible(true); // Open list modal to show it's there
        }
    };

    const handleSaveLog = async (logData) => {
        const todayStr = new Date().toISOString().split('T')[0];
        await DataService.saveDailyLog({ date: todayStr, ...logData });
        setCheckInVisible(false);
        // Stats update silently
    };

    const priorityColor = (p) => {
        if (p === 'high') return COLORS.accent; // Orange
        if (p === 'medium') return COLORS.primary; // Blue
        return '#333'; // Low
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* 1. Greeting */}
            <Text style={styles.greeting}>Hello, {username}</Text>

            {/* 2. Emotional Anchor (Quote) */}
            <Text style={styles.quoteText}>{quote}</Text>

            {/* 3. Streak Box (Conditional: Completed > 0) */}
            {showStats && longestStreak && (
                <TouchableOpacity
                    style={styles.streakBox}
                    onPress={() => setStreakListVisible(true)}
                    activeOpacity={0.9} // Low interaction feel
                >
                    <Text style={styles.streakLabel}>🔥 Longest streak</Text>

                    <View style={styles.streakMainContainer}>
                        <Text style={styles.streakMainValue} numberOfLines={1}>{longestStreak.text}</Text>
                        <Text style={styles.streakMainCount}>{longestStreak.streak || 0} days</Text>
                    </View>

                    <Text style={styles.streakSub}>Active streaks · {activeStreaks.length}</Text>
                </TouchableOpacity>
            )}

            {/* Fallback if stats shown but no streaks? 
                Prompt says "Show ONLY single longest". If no streaks, maybe show nothing or empty state.
                Assuming if activeStreaks.length > 0 check handles it.
            */}

            {/* 4. Progress Bar (Conditional) */}
            {showStats && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${(completedMissions / totalMissions) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {completedMissions} / {totalMissions} tasks completed • {Math.round((completedMissions / totalMissions) * 100)}% done
                    </Text>
                </View>
            )}
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={styles.taskItem}>
            {/* Left: Checkbox */}
            <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxActive]}
                onPress={() => toggleTask(item.id)}
            >
                {item.completed && <Check size={16} color="#000" strokeWidth={3} />}
            </TouchableOpacity>

            {/* Center: Title & Meta */}
            <View style={styles.taskContent}>
                <Text
                    style={[styles.taskText, item.completed && styles.taskTextCompleted]}
                    numberOfLines={2}
                >
                    {item.text}
                </Text>
                <Text style={styles.taskMeta}>
                    {item.priority.toUpperCase()} • {item.estimatedTime}m
                </Text>
            </View>

            {/* Right: Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => handleEditTask(item)} style={styles.actionIcon}>
                    <Edit2 size={16} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.actionIcon}>
                    <Trash2 size={16} color="#6B7280" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScreenWrapper style={styles.container}>
            {renderHeader()}

            <View style={styles.middleContainer}>
                {/* Animated Divider Line */}
                <Animated.View style={[styles.sectionDivider, { width: dividerWidth }]} />
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Mission Protocol</Text>
                    <Text style={styles.dateText}>{format(new Date(), 'EEEE, MMMM do')}</Text>
                </View>

                {/* Minimal Filter */}
                <View style={styles.filterRow}>
                    {['All', 'Health', 'Skill/Work', 'Discipline'].map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setFilterCategory(cat)}
                            style={{ marginRight: 16 }}
                        >
                            <Text style={[
                                styles.filterText,
                                filterCategory === cat && styles.filterTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Primary Action */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setMissionModalVisible(true)}
                activeOpacity={0.8}
            >
                <Plus color="#000" size={32} />
            </TouchableOpacity>

            {/* Navigation (Simple) */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.navItem}>
                    <View style={styles.activeIndicator} />
                    <Home color="#F97316" size={20} style={styles.navIcon} />
                    <Text style={[styles.navText, styles.navTextActive]}>HQ</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.navItem}>
                    <Calendar color="#6B7280" size={20} style={styles.navIcon} />
                    <Text style={styles.navText}>Calendar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Analytics')} style={styles.navItem}>
                    <BarChart2 color="#6B7280" size={20} style={styles.navIcon} />
                    <Text style={styles.navText}>Analytics</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Evolution')} style={styles.navItem}>
                    <User color="#6B7280" size={20} style={styles.navIcon} />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.navItem}>
                    <Settings color="#6B7280" size={20} style={styles.navIcon} />
                    <Text style={styles.navText}>Settings</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <CalendarPanel
                visible={isCalendarVisible}
                onClose={() => setCalendarVisible(false)}
                tasks={tasks}
                onEditLog={handleEditLog}
            />
            <TaskInputModal
                visible={isMissionModalVisible}
                onClose={() => { setMissionModalVisible(false); setEditingTask(null); }}
                onAddTask={handleAddMission}
                onUpdateTask={handleUpdateMission}
                initialData={editingTask}
                title="New Directive"
            />
            <TaskInputModal
                visible={isStreakModalVisible}
                onClose={() => setStreakModalVisible(false)}
                onAddTask={handleAddStreak}
                title="Initialize Streak"
            />
            <DailyCheckInModal
                visible={isCheckInVisible}
                onClose={() => setCheckInVisible(false)}
                onSave={handleCheckInSave}
                completedCount={tasks.filter(t => t.completed).length}
                stats={{ totalXP: 0 }}
                initialData={editingLogData}
            />
            <StreakListModal
                visible={isStreakListVisible}
                onClose={() => setStreakListVisible(false)}
                streaks={activeStreaks}
                onAddStreak={() => {
                    setStreakListVisible(false);
                    setStreakModalVisible(true);
                }}
                onDeleteStreak={(id) => deleteTask(id)}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212121', // Base background
    },
    // Header
    headerContainer: {
        marginTop: 40,
        marginBottom: 30,
        paddingHorizontal: SIZES.padding,
        alignItems: 'center', // Centered alignment
    },
    greeting: {
        fontSize: 14,
        color: '#9CA3AF', // Secondary
        fontWeight: '500',
        marginBottom: 8,
        textAlign: 'center',
    },
    quoteText: {
        fontSize: 22, // Increased from 18
        color: '#E5E7EB', // Primary
        fontWeight: '400', // Normal weight for calm reading
        fontStyle: 'italic', // "Emphasis"
        marginBottom: 20,
        lineHeight: 30, // Increased
        textAlign: 'center',
    },
    streakBox: {
        marginTop: 10,
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        alignSelf: 'center', // Centered
        alignItems: 'center',
        minWidth: 160, // Compact square feel
        // aspectRatio: 1, // Optional, might be too tall if content is short
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    streakLabel: {
        fontSize: 11,
        color: '#F97316', // Flame color
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    streakMainContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    streakMainValue: {
        fontSize: 15,
        color: '#E5E7EB', // Primary
        fontWeight: '500',
        marginBottom: 2,
        textAlign: 'center',
    },
    streakMainCount: {
        fontSize: 20,
        color: '#E5E7EB', // Primary
        fontWeight: '700',
        textAlign: 'center',
    },
    streakSub: {
        fontSize: 12,
        color: '#6B7280', // Muted
        fontWeight: '500',
    },
    progressContainer: {
        marginTop: 0,
        marginBottom: 10,
        alignItems: 'center',
        width: '100%',
    },
    progressBarBg: {
        height: 4,
        width: '100%', // full width relative to container
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#F97316', // Updated to fluid Orange
        borderRadius: 2,
    },
    progressText: {
        fontSize: 13,
        color: '#6B7280', // More subtle
        fontWeight: '500',
    },

    // Middle
    middleContainer: {
        flex: 1,
        paddingHorizontal: SIZES.padding,
    },
    sectionHeader: {
        marginBottom: 20,
        marginTop: 20, // Replaces marginTop on sectionTitle
        alignItems: 'flex-start', // Revert to Left
    },
    sectionTitle: {
        fontSize: 16, // Slightly smaller, precise
        fontWeight: '700',
        color: '#E5E7EB', // Primary
        marginBottom: 4, // Reduced for date below
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        width: '100%', // Full width divider
        alignSelf: 'flex-start', // Left align
        marginBottom: 10,
    },

    filterRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    filterPill: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'transparent',
    },
    filterPillActive: {
        backgroundColor: 'rgba(249,115,22,0.08)',
        borderWidth: 1,
        borderColor: '#F97316',
    },
    filterText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#F97316',
        textDecorationLine: 'none',
    },

    // List
    listContent: {
        paddingBottom: 100,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.03)', // Updated Background
        borderRadius: 8, // Updated Radius
        borderWidth: 0, // Removed border as per new 'No Box' drift or simply specific background focus?
        // Wait, prompt said "background rgba...0.03", "border radius 8px". Did not explicitly say remove border, but previous had it.
        // Usually refined specs override. I will trust the background vs border here.
        // Let's keep a very subtle border if needed or just use the background. safely, I'll remove the old explicit 1px border.
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#F97316',
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#F97316',
    },
    taskContent: {
        flex: 1,
        marginRight: 8,
    },
    taskText: {
        fontSize: 15,
        color: '#E5E7EB',
        fontWeight: '500',
        marginBottom: 4,
    },
    taskTextCompleted: {
        color: '#6B7280',
        textDecorationLine: 'line-through',
    },
    taskMeta: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        padding: 8,
        marginLeft: 4,
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        backgroundColor: '#FFF',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        zIndex: 100, // Above everything
    },
    // New Action Button
    logExecutionBtn: {
        marginTop: 30,
        alignSelf: 'center',
        backgroundColor: COLORS.accent,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10, // "Orange Glare"
    },
    logExecutionText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    footerActionContainer: {
        alignItems: 'center',
        marginTop: 20
    },

    // Nav
    navBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        alignItems: 'center',
        height: 58,
        backgroundColor: '#1E1E1E', // Updated
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)', // Updated
        paddingHorizontal: 16,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    navIcon: {
        marginBottom: 4,
    },
    navText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#6B7280',
    },
    navTextActive: {
        color: '#E5E7EB',
        fontWeight: '500',
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        width: 20,
        height: 2,
        backgroundColor: '#F97316',
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    }
});

export default DashboardScreen;
