import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import Svg, { Path, Line, Rect, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { DataService } from '../services/DataService';
import { ArrowLeft } from 'lucide-react-native';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, isSameDay, getWeek, startOfWeek, endOfWeek } from 'date-fns';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 180;

// --- Helper Functions ---

const calculateStreak = (daysWithActivity) => {
    let maxStreak = 0;
    let currentStreak = 0;
    // Assuming daysWithActivity is sorted ascending strings YYYY-MM-DD
    for (let i = 0; i < daysWithActivity.length; i++) {
        if (i === 0) {
            currentStreak = 1;
        } else {
            const date1 = new Date(daysWithActivity[i - 1]);
            const date2 = new Date(daysWithActivity[i]);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
        }
    }
    return Math.max(maxStreak, currentStreak);
};

const calculateVariance = (values) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
};

const AnalyticsScreen = ({ navigation }) => {
    const [timeframe, setTimeframe] = useState('Weekly');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({ logs: [], tasks: [], range: [] });

    useEffect(() => {
        loadData();
    }, [timeframe]);

    const loadData = async () => {
        setLoading(true);
        let start, end;
        const now = new Date();

        if (timeframe === 'Daily') {
            start = now;
            end = now;
        } else if (timeframe === 'Weekly') {
            start = subDays(now, 6);
            end = now;
        } else if (timeframe === 'Monthly') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else if (timeframe === 'Yearly') {
            start = startOfYear(now);
            end = endOfYear(now);
        }

        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        // Generate full range of dates for charts
        const range = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));

        const result = await DataService.getDataInRange(startStr, endStr);
        setData({ ...result, range });
        setLoading(false);
    };

    // --- Data Processing ---

    // Metrics for all views
    const metrics = useMemo(() => {
        const dateMap = {};
        data.range.forEach(d => {
            dateMap[d] = {
                tasks: [],
                log: null,
                completedCount: 0,
                focus: 0
            };
        });

        data.tasks.forEach(t => {
            // Using dateScheduled for simplicity as per DataService
            const d = t.dateScheduled;
            // Also consider completionHistory for streaks if needed, 
            // but for "Execution" we stick to scheduled date or basic completion logic?
            // User requested "X / Y tasks completed TODAY" for daily.
            // For weekly: "days_executed / total_days".
            // Let's rely on tasks scheduled for that day.
            if (dateMap[d]) {
                dateMap[d].tasks.push(t);
                if (t.isCompleted) dateMap[d].completedCount++;
            }
        });

        data.logs.forEach(l => {
            if (dateMap[l.date]) {
                dateMap[l.date].log = l;
                dateMap[l.date].focus = l.focus || 0;
            }
        });

        const sortedDates = [...data.range];
        const dailyValues = sortedDates.map(d => dateMap[d]);
        const completedCounts = dailyValues.map(v => v.completedCount);
        const focusValues = dailyValues.map(v => v.focus);

        const activeDays = completedCounts.filter(c => c > 0).length;
        const totalDays = data.range.length;

        return {
            dateMap,
            sortedDates,
            dailyValues,
            completedCounts,
            focusValues,
            activeDays,
            totalDays
        };
    }, [data]);

    // --- Render Components ---

    const TimeframeSelector = () => (
        <View style={styles.selectorContainer}>
            {["Daily", "Weekly", "Monthly", "Yearly"].map(opt => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.selectorBtn, timeframe === opt && styles.selectorBtnActive]}
                    onPress={() => setTimeframe(opt)}
                >
                    <Text style={[styles.selectorText, timeframe === opt && styles.selectorTextActive]}>
                        {opt}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderDaily = () => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayData = metrics.dateMap[todayStr] || { tasks: [], completedCount: 0, log: null };
        const totalTasks = todayData.tasks.length;
        const completed = todayData.completedCount;

        // Time Distribution
        const categoryTime = {};
        let totalTime = 0;
        todayData.tasks.forEach(t => {
            if (t.isCompleted) {
                const time = t.estimatedTime || 0;
                categoryTime[t.category] = (categoryTime[t.category] || 0) + time;
                totalTime += time;
            }
        });
        const hasTimeData = totalTime > 0;

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                {/* 1) Execution Snapshot */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Execution Snapshot</Text>
                    <Text style={styles.bigText}>{completed} / {totalTasks} tasks completed today</Text>
                </View>

                {/* 2) Time Distribution */}
                {hasTimeData ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Time Distribution</Text>
                        <View style={[styles.barStack, { width: '80%' }]}>
                            {Object.entries(categoryTime).map(([cat, time], i) => (
                                <View key={cat} style={{
                                    width: `${(time / totalTime) * 100}%`,
                                    height: 20,
                                    backgroundColor: COLORS.text,
                                    opacity: 1 - (i * 0.15),
                                    marginRight: 2
                                }} />
                            ))}
                        </View>
                        <View style={styles.legendRow}>
                            {Object.entries(categoryTime).map(([cat, time], i) => (
                                <Text key={cat} style={styles.legendText}>{cat}: {Math.round((time / totalTime) * 100)}%</Text>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* 3) Notes */}
                {todayData.log && todayData.log.notes ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.bodyText}>{todayData.log.notes}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderWeekly = () => {
        // Keep existing layout but center it
        const avg = Math.round((metrics.completedCounts.reduce((a, b) => a + b, 0) / 7) * 10) / 10;
        let maxC = -1;
        let bestDate = null;
        metrics.sortedDates.forEach((d, i) => {
            if (metrics.completedCounts[i] > maxC) {
                maxC = metrics.completedCounts[i];
                bestDate = d;
            }
        });
        const bestDayLabel = bestDate ? format(new Date(bestDate), 'EEEE, MMM do') : "N/A";
        const points = metrics.completedCounts.map((val, i) => {
            const x = (i / 6) * CHART_WIDTH;
            const maxVal = Math.max(...metrics.completedCounts, 5);
            const y = CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT;
            return `${x},${y}`;
        }).join(' ');

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={[styles.row, { width: '100%' }]}>
                    <View style={styles.halfCard}>
                        <Text style={styles.cardLabel}>Execution Avg</Text>
                        <Text style={styles.neutralNum}>{avg}</Text>
                    </View>
                    <View style={styles.halfCard}>
                        <Text style={styles.cardLabel}>Best Day</Text>
                        <Text style={styles.factualText}>{bestDayLabel}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7-Day Performance Trend</Text>
                    <View style={styles.chartBox}>
                        <Svg height={CHART_HEIGHT} width={CHART_WIDTH}>
                            <Path
                                d={`M ${points}`}
                                stroke={COLORS.text}
                                strokeWidth="2"
                                fill="none"
                                opacity="0.7"
                            />
                        </Svg>
                        <View style={styles.xAxis}>
                            {metrics.sortedDates.map((d, i) => (
                                <Text key={d} style={styles.axisLabel}>{format(new Date(d), 'EEE')}</Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Energy vs Focus - Reusing logic but minimal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Energy vs Focus</Text>
                    <View style={styles.chartBox}>
                        <Svg height={100} width={CHART_WIDTH}>
                            {/* Focus Line */}
                            <Path
                                d={`M ${metrics.sortedDates.map((d, i) => {
                                    const f = metrics.dailyValues[i].focus || 0;
                                    return `${(i / 6) * CHART_WIDTH},${100 - (f / 5) * 100}`;
                                }).join(' L ')}`}
                                stroke={COLORS.text}
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="5, 5"
                            />
                            {/* Energy Line */}
                            <Path
                                d={`M ${metrics.sortedDates.map((d, i) => {
                                    const e = metrics.dailyValues[i].log ? metrics.dailyValues[i].log.energy : 0;
                                    return `${(i / 6) * CHART_WIDTH},${100 - (e / 5) * 100}`;
                                }).join(' L ')}`}
                                stroke={COLORS.text}
                                strokeWidth="2"
                                fill="none"
                            />
                        </Svg>
                        <View style={styles.legendRow}>
                            <Text style={[styles.legendText, { color: COLORS.text }]}>Energy (Solid)</Text>
                            <Text style={[styles.legendText, { color: COLORS.text, marginLeft: 10 }]}>Focus (Dashed)</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderMonthly = () => {
        // Breakdown into 4 weeks approx
        const weeks = {};
        metrics.sortedDates.forEach(d => {
            const w = getWeek(new Date(d));
            if (!weeks[w]) weeks[w] = [];
            weeks[w].push(metrics.dateMap[d].completedCount);
        });
        const weekAvgs = Object.values(weeks).map(arr => arr.reduce((a, b) => a + b, 0) / arr.length);

        const consistency = metrics.totalDays > 0 ? (metrics.activeDays / metrics.totalDays * 100).toFixed(0) : 0;

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                {/* 1) Weekly Averages */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Averages</Text>
                    <View style={[styles.chartBox, { height: 100, width: CHART_WIDTH, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }]}>
                        {weekAvgs.map((avg, i) => (
                            <View key={i} style={{ alignItems: 'center' }}>
                                <View style={{
                                    width: 20,
                                    height: Math.max(avg * 10, 2), // Min height 2
                                    backgroundColor: COLORS.text,
                                    opacity: 0.5
                                }} />
                                <Text style={styles.axisLabel}>W{i + 1}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 2) Consistency Indicator */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Consistency Indicator</Text>
                    <Text style={styles.bigText}>{consistency}% of days executed</Text>
                    <Text style={styles.factualText}>{metrics.activeDays} / {metrics.totalDays} Total Days</Text>
                </View>

                {/* 3) Focus Drift */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Focus Drift</Text>
                    <Svg height={60} width={CHART_WIDTH}>
                        <Path
                            d={`M ${metrics.focusValues.map((f, i) => {
                                const x = (i / Math.max(1, metrics.focusValues.length - 1)) * CHART_WIDTH;
                                const y = 60 - (f / 5) * 60;
                                return `${x},${y}`;
                            }).join(' L ')}`}
                            stroke={COLORS.text}
                            strokeWidth="1"
                            fill="none"
                        />
                    </Svg>
                </View>
            </View>
        );
    };

    const renderYearly = () => {
        const daysWithActivity = metrics.sortedDates.filter(d => metrics.dateMap[d].completedCount > 0);
        const streak = calculateStreak(daysWithActivity);
        const executionRatio = metrics.totalDays > 0 ? (metrics.activeDays / metrics.totalDays).toFixed(2) : "0.00";

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                {/* 1) Longest Streak */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Longest Streak</Text>
                    <Text style={styles.identityText}>{streak} Days</Text>
                </View>

                {/* 2) Execution Ratio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Execution Ratio</Text>
                    <Text style={styles.bigText}>{executionRatio}</Text>
                    <Text style={styles.factualText}>Days Executed / Total Days</Text>
                </View>

                {/* 3) Year Reflection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Year Reflection</Text>
                    <Text style={[styles.bodyText, { fontStyle: 'italic', opacity: 0.7 }]}>
                        No reflection recorded yet.
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <TimeframeSelector />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.text} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {timeframe === 'Daily' && renderDaily()}
                        {timeframe === 'Weekly' && renderWeekly()}
                        {timeframe === 'Monthly' && renderMonthly()}
                        {timeframe === 'Yearly' && renderYearly()}
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 10
    },
    backBtn: {
        position: 'absolute',
        left: 20,
        top: 25,
        zIndex: 10
    },
    selectorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 4
    },
    selectorBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    selectorBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    selectorText: {
        color: COLORS.secondaryText,
        fontSize: 12,
        fontWeight: '600'
    },
    selectorTextActive: {
        color: COLORS.text,
    },
    content: {
        padding: 20,
        paddingBottom: 50,
        alignItems: 'center', // Center content
    },
    section: {
        marginBottom: 30,
        width: '100%', // Full width sections
        alignItems: 'center', // Center content within section
    },
    sectionTitle: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10
    },
    bigText: {
        color: COLORS.text,
        fontSize: 24, // Kept big for impact
        fontWeight: '700' // Bolder
    },
    bodyText: {
        color: COLORS.text,
        fontSize: 14,
        lineHeight: 22
    },
    barStack: {
        flexDirection: 'row',
        height: 20,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    legendRow: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap'
    },
    legendText: {
        color: COLORS.secondaryText,
        fontSize: 10,
        marginRight: 15
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30
    },
    halfCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 12
    },
    cardLabel: {
        color: COLORS.secondaryText,
        fontSize: 10,
        marginBottom: 5
    },
    neutralNum: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '500'
    },
    factualText: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '400'
    },
    chartBox: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        padding: 10
    },
    xAxis: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5
    },
    axisLabel: {
        color: COLORS.secondaryText,
        fontSize: 8
    },
    identityText: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});

export default AnalyticsScreen;
