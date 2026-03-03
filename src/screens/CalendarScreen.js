import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Alert, useWindowDimensions } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTasks } from '../context/TaskContext';
import FuturisticCalendar from '../components/FuturisticCalendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ArrowLeft, X, Plus, Check, Trash2, Edit2, Calendar, CheckCircle, Circle as LucideCircle, MinusCircle } from 'lucide-react-native';
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

    const modalHeight = SCREEN_HEIGHT * 0.8;
    const viewDateStr = format(date, 'yyyy-MM-dd');
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = viewDateStr < todayStr;
    const isToday = viewDateStr === todayStr;

    const streakTasks = tasks.filter(t => t.source === 'streak');
    const completedTasks = tasks.filter(t => t.source !== 'streak' && t.completed);
    const notCompletedTasks = tasks.filter(t => t.source !== 'streak' && !t.completed);

    const LogSummary = ({ log }) => {
        const { day_score, performance_grade, energy, focus, mood, win, struggle } = log;
        let gradeColor = COLORS.primary;
        if (day_score >= 90) gradeColor = '#FFD700';
        else if (day_score >= 75) gradeColor = COLORS.success;
        else if (day_score < 50) gradeColor = '#FF4444';

        const StatBar = ({ label, value, color }) => (
            <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#888', fontSize: 10, textTransform: 'uppercase' }}>{label}</Text>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{value}/5</Text>
                </View>
                <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
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
                    <Edit2 size={12} color="#666" style={{ marginRight: 6 }} />
                    <Text style={styles.editSummaryText}>Edit Reflection</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tasks were created on this day.</Text>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.detailModalContent, { maxHeight: modalHeight }]}>

                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>{format(date, 'EEEE, MMMM do')}</Text>
                            <View style={styles.badgeLine}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>{isToday ? "Today" : isPast ? "Past Day" : "Future"}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color="rgba(255,255,255,0.6)" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.taskListContainer} showsVerticalScrollIndicator={false}>
                        {hasLog && dailyLog && <LogSummary log={dailyLog} />}

                        {tasks.length === 0 ? renderEmptyState() : (
                            <>
                                {/* SECTION: Streak Tasks */}
                                {streakTasks.length > 0 && (
                                    <View style={styles.taskGroup}>
                                        <View style={styles.groupHeader}>
                                            <Text style={styles.groupTitle}>Streak Tasks</Text>
                                            <Text style={styles.groupSubtitle}>Habits active on this day</Text>
                                        </View>
                                        {streakTasks.map(task => (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={styles.streakRow}
                                                onPress={() => onToggleTask(task.id)}
                                            >
                                                <View style={styles.streakInfo}>
                                                    <View style={styles.statusIcon}>
                                                        {task.completed ? (
                                                            <CheckCircle size={20} color="#2ECC71" />
                                                        ) : (
                                                            <LucideCircle size={20} color="rgba(255,255,255,0.3)" />
                                                        )}
                                                    </View>
                                                    <Text style={[styles.streakText, task.completed && styles.streakTextDone]}>{task.text}</Text>
                                                </View>
                                                <Text style={styles.streakCount}>{task.streak || 0} 🔥</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* SECTION: Completed Tasks */}
                                {completedTasks.length > 0 && (
                                    <View style={styles.taskGroup}>
                                        <View style={styles.groupHeader}>
                                            <Text style={styles.groupTitle}>Completed Tasks</Text>
                                        </View>
                                        {completedTasks.map(task => (
                                            <View key={task.id} style={[styles.normalRow, styles.normalRowDone]}>
                                                <TouchableOpacity style={styles.normalContent} onPress={() => onToggleTask(task.id)}>
                                                    <View style={styles.statusIcon}>
                                                        <Check size={18} color="#2ECC71" />
                                                    </View>
                                                    <Text style={styles.normalTextDone}>{task.text}</Text>
                                                </TouchableOpacity>
                                                {(!isPast || isToday) && (
                                                    <TouchableOpacity onPress={() => onEditTask(task)} style={styles.actionIcon}>
                                                        <Edit2 size={16} color="rgba(255,255,255,0.4)" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity onPress={() => onDeleteTask(task.id)} style={styles.actionIcon}>
                                                    <Trash2 size={16} color="rgba(255,255,255,0.4)" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* SECTION: Not Completed Tasks */}
                                {notCompletedTasks.length > 0 && (
                                    <View style={styles.taskGroup}>
                                        <View style={styles.groupHeader}>
                                            <Text style={styles.groupTitle}>Not Completed</Text>
                                        </View>
                                        {notCompletedTasks.map(task => (
                                            <View key={task.id} style={styles.normalRow}>
                                                <TouchableOpacity style={styles.normalContent} onPress={() => onToggleTask(task.id)}>
                                                    <View style={styles.statusIcon}>
                                                        <MinusCircle size={18} color="rgba(255,255,255,0.4)" />
                                                    </View>
                                                    <Text style={styles.normalTextPending}>{task.text}</Text>
                                                </TouchableOpacity>
                                                {(!isPast || isToday) && (
                                                    <TouchableOpacity onPress={() => onEditTask(task)} style={styles.actionIcon}>
                                                        <Edit2 size={16} color="rgba(255,255,255,0.4)" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity onPress={() => onDeleteTask(task.id)} style={styles.actionIcon}>
                                                    <Trash2 size={16} color="rgba(239,68,68,0.6)" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.actionRow}>
                        {!isPast && (
                            <TouchableOpacity style={styles.addDayTaskBtn} onPress={() => setAddModalVisible(true)}>
                                <Plus color="#FFF" size={20} />
                                <Text style={styles.addDayTaskText}>Add Mission</Text>
                            </TouchableOpacity>
                        )}

                        {!hasLog && (
                            <TouchableOpacity style={styles.editLogBtn} onPress={onEditLog}>
                                <Calendar color="#AAA" size={18} />
                                <Text style={styles.editLogText}>
                                    {isPast ? "Retroactive Log" : "Log Day"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TaskInputModal
                        visible={isAddModalVisible}
                        onClose={() => setAddModalVisible(false)}
                        onAddTask={onAddTask}
                        title={`New Mission`}
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
    },
    detailModalContent: {
        backgroundColor: '#151821', // Dark productivity background
        borderRadius: 20,
        padding: 30, // 32px spec, adjusted slightly for mobile safety
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        width: '90%',
        alignSelf: 'center',
        maxWidth: 520, // max width from spec
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    badgeLine: {
        marginTop: 6,
    },
    dayBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    dayBadgeText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 4,
    },
    taskListContainer: {
        flexGrow: 0,
        marginBottom: 10,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontStyle: 'italic',
    },
    taskGroup: {
        marginBottom: 24,
    },
    groupHeader: {
        marginBottom: 12,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    groupSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginBottom: 8,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusIcon: {
        marginRight: 12,
    },
    streakText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    streakTextDone: {
        color: 'rgba(255,255,255,0.5)',
        textDecorationLine: 'line-through',
    },
    streakCount: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: 'bold',
    },
    normalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    normalRowDone: {
        backgroundColor: 'rgba(46,204,113,0.08)',
        borderColor: 'transparent',
    },
    normalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    normalTextDone: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    normalTextPending: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    actionIcon: {
        padding: 8,
        marginLeft: 4,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 12,
    },
    addDayTaskBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        flex: 1,
    },
    addDayTaskText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    editLogBtn: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        flex: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    editLogText: {
        color: '#AAA',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 14,
    },
    logSummaryContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)'
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
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    editSummaryText: {
        color: 'rgba(255,255,255,0.5)',
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
