import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTasks } from '../context/TaskContext';
import FuturisticCalendar from '../components/FuturisticCalendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ArrowLeft, X, Plus, Check, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import Svg, { Circle } from 'react-native-svg';
import TaskInputModal from '../components/TaskInputModal';

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

const DayDetailModal = ({ visible, date, onClose, tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [isAddModalVisible, setAddModalVisible] = useState(false);

    // Explicit 60% Height to satisfy "50 to 75%" requirement
    const modalHeight = SCREEN_HEIGHT * 0.6;

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
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <View key={task.id} style={styles.modalTaskRow}>
                                    <TouchableOpacity
                                        style={styles.taskContent}
                                        onPress={() => onToggleTask(task.id)}
                                    >
                                        <View style={[styles.checkbox, task.completed && styles.checkboxActive]}>
                                            {task.completed && <Check size={14} color="#000" strokeWidth={3} />}
                                        </View>
                                        <Text style={[styles.modalTaskText, task.completed && styles.textLineThrough]}>{task.text}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteBtn}
                                        onPress={() => onDeleteTask(task.id)}
                                    >
                                        <Trash2 size={18} color={COLORS.error || '#ff4444'} />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.placeholderText}>No missions for this day.</Text>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={styles.addDayTaskBtn} onPress={() => setAddModalVisible(true)}>
                        <Plus color="#000" size={20} />
                        <Text style={styles.addDayTaskText}>Add Mission</Text>
                    </TouchableOpacity>

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
    const { tasks, addTask, toggleTask, deleteTask } = useTasks();

    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setDetailVisible(true);
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
    const dailyTasks = (tasks || []).map(task => {
        let isDisplayed = false;
        let isCompletedForDay = false;

        if (task.isStreak) {
            isDisplayed = true;
            if (task.completionHistory && task.completionHistory.includes(formattedSelectedDate)) {
                isCompletedForDay = true;
            }
        } else {
            if (task.date === formattedSelectedDate) {
                isDisplayed = true;
                isCompletedForDay = task.completed;
            }
        }

        if (!isDisplayed) return null;

        return {
            ...task,
            completed: isCompletedForDay
        };
    }).filter(Boolean);

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>History</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.splitLayout}>
                    <View style={styles.calendarSection}>
                        <FuturisticCalendar
                            selectedDate={selectedDate}
                            onSelectDate={handleDateSelect}
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                            tasks={tasks}
                        />
                    </View>

                    <View style={styles.overviewSection}>
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
    calendarSection: {
        width: '48%',
    },
    overviewSection: {
        width: '48%',
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
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.accent,
    },
});

export default CalendarScreen;
