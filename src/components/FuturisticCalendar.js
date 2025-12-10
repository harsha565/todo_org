import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { COLORS, SIZES } from '../constants/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

const DateCell = ({ date, isCurrentMonth, isSelected, onSelect, progress = 0 }) => {
    const radius = 18;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <TouchableOpacity
            style={[
                styles.cell,
                !isCurrentMonth && styles.cellOutside,
                isSelected && styles.cellSelected
            ]}
            onPress={() => onSelect(date)}
        >
            {/* Progress Ring */}
            <View style={styles.ringWrapper}>
                <Svg width={44} height={44}>
                    {/* Background Circle */}
                    <Circle
                        cx="22"
                        cy="22"
                        r={radius}
                        stroke="#222"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle (only if progress > 0) */}
                    {progress > 0 && (
                        <Circle
                            cx="22"
                            cy="22"
                            r={radius}
                            stroke={COLORS.accent}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="22, 22"
                        />
                    )}
                </Svg>
                <View style={styles.dateTextWrapper}>
                    <Text style={[styles.cellText, isSelected && styles.textSelected]}>
                        {format(date, 'd')}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const FuturisticCalendar = ({ selectedDate, onSelectDate, currentMonth, onMonthChange, tasks = [] }) => {
    // Helper to calculate progress for a specific day
    const getDailyProgress = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        // Filter tasks for this specific date
        // Logic:
        // 1. Streaks: Always exist. Check completionHistory for this date.
        // 2. Missions: Exist only if dateScheduled matches. Check isCompleted.

        let total = 0;
        let completed = 0;

        tasks.forEach(task => {
            if (task.isStreak) {
                total++;
                if (task.completionHistory && task.completionHistory.includes(dateStr)) {
                    completed++;
                }
            } else {
                // Normal Mission
                if (task.date === dateStr) {
                    total++;
                    if (task.completed) {
                        completed++;
                    }
                }
            }
        });

        if (total === 0) return 0;
        return (completed / total) * 100;
    };

    const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
    const prevMonth = () => onMonthChange(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={prevMonth}>
                    <ChevronLeft color={COLORS.text} size={28} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity onPress={nextMonth}>
                    <ChevronRight color={COLORS.text} size={28} />
                </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={styles.weekRow}>
                {weekDays.map(day => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
                {days.map((day, index) => {
                    const progress = getDailyProgress(day);
                    return (
                        <DateCell
                            key={index}
                            date={day}
                            isCurrentMonth={isSameMonth(day, monthStart)}
                            isSelected={isSameDay(day, selectedDate)}
                            onSelect={onSelectDate}
                            progress={progress}
                        />
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBg,
        borderRadius: SIZES.radius,
        padding: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    monthTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        color: COLORS.secondaryText,
        fontSize: 14,
        width: 44,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cell: {
        width: '14%', // 7 days
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 5,
    },
    cellOutside: {
        opacity: 0.3,
    },
    ringWrapper: {
        position: 'relative',
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateTextWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    textSelected: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
});

export default FuturisticCalendar;
