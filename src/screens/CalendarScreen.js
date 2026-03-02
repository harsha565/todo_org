import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Alert, useWindowDimensions } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTasks } from '../context/TaskContext';
import FuturisticCalendar from '../components/FuturisticCalendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ArrowLeft, X, Plus, Check, Trash2, Edit2, Calendar } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Svg, { Circle } from 'react-native-svg';
import TaskInputModal from '../components/TaskInputModal';
import { DataService } from '../services/DataService';
import DailyCheckInModal from '../components/DailyCheckInModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MonthlyOverview = ({ completionPercent }) => {
    const radius = 30;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

    return (
        <View style={styles.overviewContainer}>
            <Text style={styles.overviewTitle}>Month Overview</Text>
            <View style={styles.chartWrapper}>
                <Svg width={70} height={70}>
                    <Circle
                        cx="35"
                        cy="35"
                        r={radius}
                        stroke="#222"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx="35"
                        cy="35"
                        r={radius}
                        stroke={COLORS.primary || "#00E0FF"} // CYAN
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="35, 35"
                    />
                </Svg>
                <View style={styles.percentWrapper}>
                    <Text style={styles.percentText}>{Math.round(completionPercent)}%</Text>
                </View>
            </View>
            <Text style={styles.overviewSubtitle}>Tasks Done</Text>
        </View>
    );
};

const DayDetailModal = ({ visible, date, onClose, tasks, onAddTask, onToggleTask, onDeleteTask, onEditTask, hasLog, onEditLog, dailyLog }) => {
    const [isAddModalVisible, setAddModalVisible] = useState(false);

    const modalHeight = SCREEN_HEIGHT * 0.75;
    const viewDateStr = format(date, 'yyyy-MM-dd');
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = viewDateStr < todayStr;
    const isToday = viewDateStr === todayStr;

    // --- Archive Viewer Component ---
    const LogSummary = ({ log }) => {
        const { day_score, performance_grade, energy, focus, mood, win, struggle } = log;
        let gradeColor = COLORS.primary;
        if (day_score >= 90) gradeColor = '#FFD700';
        else if (day_score >= 75) gradeColor = COLORS.success;
        else if (day_score < 50) gradeColor = '#FF4444';

        const StatBar = ({ label, value, color }) => (
            <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>{label}</Text>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{value}/5</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${(value / 5) * 100}%`, height: '100%', backgroundColor: color }} />
                </View>
            </View>
        );

        return (
            <View style={styles.logSummaryContainer}>
                <View style={styles.logHeader}>
                    <View>
                        <Text style={styles.logGradeLabel}>PERFORMANCE</Text>
                        <Text style={[styles.logGrade, { color: gradeColor }]}>{performance_grade || 'LOGGED'}</Text>
                    </View>
                    <View style={styles.logScoreBadge}>
                        <Text style={styles.logScoreText}>{day_score}</Text>
                    </View>
                </View>

                <View style={styles.logStatsGrid}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <StatBar label="ENERGY" value={energy} color="#FFD700" />
                        <StatBar label="FOCUS" value={focus} color="#00E0FF" />
                    </View>
                    <View style={styles.moodBox}>
                        <Text style={{ fontSize: 24 }}>{mood}</Text>
                    </View>
                </View>

                {win ? (
                    <View style={styles.quoteBlock}>
                        <Text style={styles.quoteLabel}>BIGGEST WIN</Text>
                        <Text style={styles.quoteText}>"{win}"</Text>
                    </View>
                ) : null}

                <TouchableOpacity style={styles.editSummaryBtn} onPress={onEditLog}>
                    <Edit2 size={14} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.editSummaryText}>Edit Reflection</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.detailModalContent, { height: modalHeight }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{format(date, 'MMMM do')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={COLORS.secondaryText} size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.taskListContainer}>
                        {/* 1. Archive View (if log exists) */}
                        {hasLog && dailyLog && <LogSummary log={dailyLog} />}

                        {/* 2. Tasks Label */}
                        <Text style={styles.sectionLabel}>MISSIONS</Text>

                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <View key={task.id} style={styles.modalTaskRow}>
                                    <View style={styles.taskContent}>
                                        <TouchableOpacity onPress={() => onToggleTask(task.id)}>
                                            <View style={[styles.statusIndicator]}>
                                                {task.completed ? (
                                                    <Check size={20} color={COLORS.success} strokeWidth={3} />
                                                ) : (
                                                    <X size={20} color={COLORS.danger} strokeWidth={3} />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.modalTaskText, task.completed && styles.textLineThrough]} numberOfLines={1}>
                                                {task.text}
                                            </Text>
                                            {task.source === 'streak' && (
                                                <View style={styles.streakTag}>
                                                    <Text style={styles.streakTagText}>streak</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {(!isPast || isToday) && (
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => onEditTask(task)}
                                        >
                                            <Edit2 size={20} color="#FFF" />
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => onDeleteTask(task.id)}
                                    >
                                        <Trash2 size={18} color={COLORS.error || '#ff4444'} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.placeholderText}>
                                No tasks for this day.
                            </Text>
                        )}
                    </ScrollView>

                    <View style={styles.actionRow}>
                        {!isPast && (
                            <TouchableOpacity style={styles.addDayTaskBtn} onPress={() => setAddModalVisible(true)}>
                                <Plus color="#000" size={20} />
                                <Text style={styles.addDayTaskText}>Add Mission</Text>
                            </TouchableOpacity>
                        )}

                        {!hasLog && (
                            <TouchableOpacity
                                style={[styles.editLogBtn, isPast && { flex: 1 }]}
                                onPress={onEditLog}
                            >
                                <Calendar color="#666" size={18} />
                                <Text style={styles.editLogText}>
                                    {isPast ? "Create Retroactive Log" : "Log Day"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TaskInputModal
                        visible={isAddModalVisible}
                        onClose={() => setAddModalVisible(false)}
                        onAddTask={onAddTask}
                        title={`New Mission for ${format(date, 'MMM d')}`}
                    />
                </View>
            </View>
        </Modal>
    );
};



// ... imports

const CalendarScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Track month for overview
    const [isDetailVisible, setDetailVisible] = useState(false);
    const { tasks, addTask, toggleTask, deleteTask, updateTask } = useTasks();

    const [editingTask, setEditingTask] = useState(null);
    const [isEditModalVisible, setEditModalVisible] = useState(false);

    // New State for Log
    const [dailyLog, setDailyLog] = useState(null);
    const [isCheckInVisible, setCheckInVisible] = useState(false);
    const [monthlyScores, setMonthlyScores] = useState({});

    // Fetch scores on mount/month change
    React.useEffect(() => {
        const fetchScores = async () => {
            const yearMonth = format(currentMonth, 'yyyy-MM');
            const scores = await DataService.getDailyLogsForMonth(yearMonth);
            setMonthlyScores(scores);
        };
        fetchScores();
    }, [currentMonth]);

    const handleEditTask = (task) => {
        setEditingTask(task);
        setEditModalVisible(true);
    };

    const handleUpdateTask = (id, updates) => {
        updateTask(id, updates);
        setEditModalVisible(false);
        setEditingTask(null);
    };

    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

    const handleDateSelect = async (date) => {
        setSelectedDate(date);
        setDetailVisible(true);
        // Fetch Log
        const dateStr = format(date, 'yyyy-MM-dd');
        const log = await DataService.getDailyLog(dateStr);
        setDailyLog(log);
    };

    const handleEditLog = () => {
        setDetailVisible(false);
        setCheckInVisible(true);
    };

    const handleSaveLogFromCalendar = async (logData) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        await DataService.saveDailyLog({ date: dateStr, ...logData });
        setCheckInVisible(false);
        // Refresh local state
        const updatedLog = await DataService.getDailyLog(dateStr);
        setDailyLog(updatedLog);
        // Refresh heatmap
        const yearMonth = format(currentMonth, 'yyyy-MM');
        const scores = await DataService.getDailyLogsForMonth(yearMonth);
        setMonthlyScores(scores);
    };

    const handleAddTask = (text) => {
        addTask(text);
    };

    const handleDeleteTask = (id) => {
        Alert.alert(
            "Delete Mission",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteTask(id) }
            ]
        );
    };

    // ... handlers

    // --- MONTHLY OVERVIEW CALCULATION ---
    const calculateMonthlyStats = () => {
        try {
            if (!currentMonth || isNaN(currentMonth)) return 0;
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const daysInMonth = eachDayOfInterval({ start, end });

            let totalTasksInMonth = 0;
            let totalCompletedInMonth = 0;

            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');

                (tasks || []).forEach(task => {
                    if (!task) return;
                    if (task.isStreak) {
                        totalTasksInMonth++;
                        if (task.completionHistory && Array.isArray(task.completionHistory) && task.completionHistory.includes(dateStr)) {
                            totalCompletedInMonth++;
                        }
                    } else {
                        // Mission
                        if (task.date === dateStr) {
                            totalTasksInMonth++;
                            if (task.completed) {
                                totalCompletedInMonth++;
                            }
                        }
                    }
                });
            });

            if (totalTasksInMonth === 0) return 0;
            const percent = (totalCompletedInMonth / totalTasksInMonth) * 100;
            return isNaN(percent) ? 0 : percent;
        } catch (e) {
            console.error("Monthly Calc Error", e);
            return 0;
        }
    };

    const monthlyCompletion = calculateMonthlyStats();

    // --- DAILY DETAIL FILTERING ---
    // MERGE ALL TASKS - Show ALL tasks for selected date (streak + normal)
    const dailyTasks = (tasks || []).reduce((acc, task) => {
        if (!task) return acc;
        
        const selectedStr = formattedSelectedDate;
        
        if (task.isStreak) {
            // STREAK: Show if created on or before selected date (ongoing streaks)
            if (task.date <= selectedStr) {
                const isCompletedOnDate = task.completionHistory && task.completionHistory.includes(selectedStr);
                acc.push({
                    ...task,
                    completed: isCompletedOnDate,
                    source: 'streak'
                });
            }
        } else {
            // NORMAL TASK: Show if scheduled for selected date
            if (task.date === selectedStr) {
                acc.push({
                    ...task,
                    completed: task.completed,
                    source: 'normal'
                });
            }
        }
        
        return acc;
    }, []);

    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>History</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={[styles.splitLayout, isMobile && styles.splitLayoutMobile]}>
                    <View style={[styles.calendarSection, isMobile && styles.sectionMobile]}>
                        <FuturisticCalendar
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                            tasks={tasks}
                        />
                    </View>

                    <View style={[styles.overviewSection, isMobile && styles.sectionMobile]}>
                        <MonthlyOverview completionPercent={monthlyCompletion || 0} />
                    </View>
                </View>

                {/* ... rest of JSX ... */}

                <Text style={styles.instructionText}>Tap a date to view or add missions.</Text>
            </ScrollView>

            <DayDetailModal
                visible={isDetailVisible}
                date={selectedDate}
                onClose={() => setDetailVisible(false)}
                tasks={dailyTasks}
                onAddTask={handleAddTask}
                onToggleTask={(id) => toggleTask(id, formattedSelectedDate)}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                onEditLog={handleEditLog}
                hasLog={!!dailyLog}
                dailyLog={dailyLog}
            />

            <DailyCheckInModal
                visible={isCheckInVisible}
                onClose={() => setCheckInVisible(false)}
                onSave={handleSaveLogFromCalendar}
                initialData={dailyLog}
            />

            <TaskInputModal
                visible={isEditModalVisible}
                onClose={() => { setEditModalVisible(false); setEditingTask(null); }}
                onAddTask={() => { }}
                onUpdateTask={handleUpdateTask}
                initialData={editingTask}
                title="Edit Mission"
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    backBtn: {
        marginRight: 20,
    },
    title: {
        fontSize: 24,
        color: COLORS.text,
        fontWeight: 'bold',
    },
    content: {
        padding: SIZES.padding,
    },
    instructionText: {
        color: COLORS.secondaryText,
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    splitLayout: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
    },
    splitLayoutMobile: {
        flexDirection: 'column',
    },
    calendarSection: {
        width: '48%',
    },
    overviewSection: {
        width: '48%',
    },
    sectionMobile: {
        width: '100%',
        marginBottom: 20,
    },
    overviewContainer: {
        backgroundColor: '#0a0a0a',
        borderRadius: SIZES.radius,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222',
        height: '100%',
        justifyContent: 'center',
    },
    overviewTitle: {
        color: COLORS.secondaryText,
        fontSize: 10,
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    chartWrapper: {
        position: 'relative',
        width: 70,
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    percentWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    overviewSubtitle: {
        color: COLORS.text,
        fontSize: 10,
        textAlign: 'center',
    },
    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center', // Center horizontally
    },
    detailModalContent: {
        backgroundColor: '#050505',
        borderRadius: 25,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
        width: '90%', // 90% width of screen
        maxWidth: 400,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 20,
        // Height is set dynamically in component
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        paddingBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.accent,
        letterSpacing: 1,
    },
    taskListContainer: {
        flex: 1,
        marginBottom: 20,
    },
    modalTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#111',
        padding: 12,
        borderRadius: 12,
        justifyContent: 'space-between',
    },
    taskContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalTaskText: {
        color: COLORS.text,
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    deleteBtn: {
        padding: 5,
        marginLeft: 10,
    },
    textLineThrough: {
        textDecorationLine: 'line-through',
        color: COLORS.secondaryText,
    },
    placeholderText: {
        color: COLORS.secondaryText,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    addDayTaskBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 15,
    },
    addDayTaskText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    streakTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginLeft: 12
    },
    streakTagText: {
        fontSize: 10,
        color: COLORS.secondaryText,
        textTransform: 'lowercase'
    },
    statusIndicator: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    // checkbox: { ... } // Removed
    // checkboxActive: { ... } // Removed
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10
    },
    addDayTaskBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 15,
        flex: 1,
    },
    editLogBtn: {
        backgroundColor: '#222',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 15,
        flex: 1,
        borderWidth: 1,
        borderColor: '#333'
    },
    editLogBtnActive: {
        borderColor: COLORS.accent,
        backgroundColor: 'rgba(0, 224, 255, 0.1)'
    },
    editLogText: {
        color: '#666',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    /* Archive Viewer Styles */
    logSummaryContainer: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333'
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    logGradeLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    logGrade: {
        fontSize: 24,
        fontWeight: 'bold',
        includeFontPadding: false
    },
    logScoreBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    logScoreText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    logStatsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    moodBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    quoteBlock: {
        borderLeftWidth: 2,
        borderLeftColor: COLORS.accent,
        paddingLeft: 10,
        marginBottom: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        padding: 10,
        borderRadius: 4
    },
    quoteLabel: {
        color: COLORS.accent,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2
    },
    quoteText: {
        color: '#DDD',
        fontStyle: 'italic',
        fontSize: 14
    },
    editSummaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333'
    },
    editSummaryText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600'
    },
    sectionLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 5
    }
});

export default CalendarScreen;
