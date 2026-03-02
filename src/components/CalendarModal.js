import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, X, CheckCircle2, FileText, Activity, XCircle } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { COLORS } from '../constants/theme';
import { DataService } from '../services/DataService';



const { width, height } = Dimensions.get('window');
const PANEL_WIDTH = width < 600 ? width * 0.85 : width * 0.40; // Intelligent responsive width based on "40%" intent

const CalendarPanel = ({ visible, onClose, tasks = [], onEditLog }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayLog, setDayLog] = useState(null);
    const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current; // Start off-screen (right)

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: visible ? 0 : PANEL_WIDTH,
            duration: 180, // Spec: 180ms
            easing: Easing.out(Easing.ease), // Spec: ease_out
            useNativeDriver: true,
        }).start();
    }, [visible]);

    // Fetch Log on Date Change
    useEffect(() => {
        const fetchLog = async () => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const log = await DataService.getDailyLog(dateStr);
            setDayLog(log);
        };
        fetchLog();
    }, [selectedDate]);

    const navPrev = () => setCurrentDate(subMonths(currentDate, 1));
    const navNext = () => setCurrentDate(addMonths(currentDate, 1));

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const getDayStatus = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return tasks.some(t => {
            if (t.isStreak) return (t.completionHistory || []).includes(dayStr);
            return t.date === dayStr && t.completed;
        }) ? 'completed' : 'none';
    };

    // Derived Logic for Selected Day
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => {
        // Debug
        // console.log(`Task: ${t.text || t.title}, Date: ${t.date}, Streak: ${t.isStreak}, Selected: ${selectedDateStr}`);

        // Normal Tasks: Enrolled on that specific date
        if (!t.isStreak) return t.date === selectedDateStr;

        // Streaks: Show if they existed on that date (Created on or before)
        // Check if t.date (creation date) <= selectedDateStr
        // Fallback: If streak has no numeric date, assume active? Or use id? 
        // Let's rely on date presence.
        return t.date <= selectedDateStr;
    }).map(t => {
        // Augment task with 'completed' status for THIS specific day
        if (t.isStreak) {
            const isCompletedDay = (t.completionHistory || []).includes(selectedDateStr);
            return { ...t, completed: isCompletedDay };
        }
        return t;
    });

    if (!visible && slideAnim._value === PANEL_WIDTH) return null; // Optimization? Or just let it hide.

    return (
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.monthTitle}>{format(currentDate, 'MMMM yyyy')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtext}>Review past execution. No edits.</Text>

                <View style={styles.navRow}>
                    <TouchableOpacity onPress={navPrev} hitSlop={10}>
                        <ChevronLeft size={24} color="#E5E7EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navNext} hitSlop={10}>
                        <ChevronRight size={24} color="#E5E7EB" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.weekRow}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={styles.weekText}>{d}</Text>
                        ))}
                    </View>
                    <View style={styles.grid}>
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isDayToday = isToday(day);
                            const isSelected = isSameDay(day, selectedDate);
                            const status = getDayStatus(day);

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.dayCell,
                                        !isCurrentMonth && { opacity: 0.2 }
                                    ]}
                                    onPress={() => setSelectedDate(day)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.dayContent,
                                        isDayToday && styles.todayIndicator,
                                        isSelected && styles.selectedIndicator
                                    ]}>
                                        <Text style={[
                                            styles.dayText,
                                            isDayToday && styles.dayTextToday,
                                            isSelected && styles.dayTextSelected
                                        ]}>
                                            {format(day, 'd')}
                                        </Text>
                                        {status === 'completed' && !isSelected && (
                                            <View style={styles.indicatorDot} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Day Detail Section */}
                <View style={styles.detailSection}>
                    <Text style={styles.detailDate}>{format(selectedDate, 'EEEE, MMMM do')}</Text>

                    {/* Missions */}
                    <Text style={styles.sectionTitle}>Missions on the Day</Text>
                    {dayTasks.length > 0 ? (
                        dayTasks.map((t, i) => (
                            <View key={i} style={styles.taskItem}>
                                {t.completed ? (
                                    <CheckCircle2 size={16} color={COLORS.accent} style={{ marginRight: 8 }} />
                                ) : (
                                    <XCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                )}
                                <Text style={[styles.taskText, !t.completed && { color: '#9CA3AF', textDecorationLine: 'line-through' }]} numberOfLines={1}>
                                    {t.text || t.title}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyTasks}>No missions recorded.</Text>
                    )}

                    {/* Log Data */}
                    <View style={{ marginTop: 20 }}>
                        {dayLog ? (
                            <View style={styles.logCard}>
                                <View style={styles.logHeader}>
                                    <Activity size={16} color={COLORS.accent} />
                                    <Text style={styles.logScore}>Score: {dayLog.day_score || 0}</Text>
                                    <TouchableOpacity onPress={() => onEditLog(selectedDate, dayLog)} style={styles.editLogBtn}>
                                        <FileText size={14} color="#6B7280" />
                                        <Text style={styles.editLogText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                                {dayLog.win_1 ? (
                                    <View style={styles.logItem}>
                                        <Text style={styles.logLabel}>Win</Text>
                                        <Text style={styles.logValue}>{dayLog.win_1}</Text>
                                    </View>
                                ) : null}
                                {dayLog.learn_1 ? (
                                    <View style={styles.logItem}>
                                        <Text style={styles.logLabel}>Learn</Text>
                                        <Text style={styles.logValue}>{dayLog.learn_1}</Text>
                                    </View>
                                ) : null}
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => onEditLog(selectedDate, null)} style={styles.createLogBtn}>
                                <FileText size={16} color={COLORS.accent} />
                                <Text style={styles.createLogText}>Create Log</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    panel: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: PANEL_WIDTH,
        backgroundColor: '#212121',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.05)',
        zIndex: 1000, // Above everything
        padding: 20,
        paddingTop: 50, // Safe Area
        shadowColor: "#000",
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    monthTitle: {
        fontSize: 24, // Increased from 18
        fontWeight: '700',
        color: '#E5E7EB',
    },
    subtext: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    gridContainer: {
        marginBottom: 30,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    weekText: {
        width: '14.28%',
        textAlign: 'center',
        color: '#4B5563',
        fontSize: 11,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    dayContent: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    todayIndicator: {
        borderWidth: 1,
        borderColor: '#F97316', // Subtle ring
    },
    selectedIndicator: {
        backgroundColor: 'rgba(249,115,22,0.2)', // Orange tint
        borderWidth: 1,
        borderColor: '#F97316',
    },
    dayText: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    dayTextToday: {
        color: '#F97316',
        fontWeight: '600',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    indicatorDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#E5E7EB',
        position: 'absolute',
        bottom: 5,
    },
    // Detail View Styles
    detailSection: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 20,
    },
    detailDate: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 16,
    },
    logCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    logScore: {
        color: COLORS.accent,
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 14,
    },
    logItem: {
        marginBottom: 8,
    },
    logLabel: {
        fontSize: 10,
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    logValue: {
        fontSize: 13,
        color: '#E5E7EB',
        fontStyle: 'italic',
    },
    emptyLog: {
        color: '#6B7280',
        fontStyle: 'italic',
        fontSize: 13,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        fontWeight: '600',
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskText: {
        color: '#E5E7EB',
        fontSize: 13,
    },
    emptyTasks: {
        color: '#6B7280',
        fontSize: 13,
    },
    editLogBtn: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    editLogText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    createLogBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(249,115,22,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 20,
        alignSelf: 'flex-start', // Compact width
        borderWidth: 1,
        borderColor: 'rgba(249,115,22,0.3)',
    },
    createLogText: {
        color: COLORS.accent,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default CalendarPanel;
