import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import ScreenWrapper from '../components/ScreenWrapper';
import { DataService } from '../services/DataService';
import { ArrowLeft, User, Shield, BookOpen, Heart, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CHART_SIZE = 220;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 20;

const EvolutionScreen = ({ navigation }) => {
    const [identities, setIdentities] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const id = await DataService.getIdentities();
        setIdentities(id);
    };

    // Calculate Level & Progress
    const getLevelInfo = (xp) => {
        // Simple scale: Level = floor(xp / 200) + 1? 
        // Or Log scale? 
        // Let's do triangular numbers: 0, 100, 300, 600, 1000...
        // Threshold for level N = 100 * (N-1)*N/2 ? No that's complex.
        // Let's use: Next Level = CurrentLevel * 150 + 100 base.
        // 0-100 (Lvl 1), 101-300 (Lvl 2), 301-600 (Lvl 3).

        let level = 1;
        let threshold = 100;
        let prevThreshold = 0;

        while (xp >= threshold) {
            level++;
            prevThreshold = threshold;
            threshold += (level * 100);
        }

        const nextXP = threshold;
        const currentLevelXP = xp - prevThreshold;
        const requiredXP = nextXP - prevThreshold;
        const progress = currentLevelXP / requiredXP;

        let rank = "Novice";
        if (level > 3) rank = "Specialist";
        if (level > 7) rank = "Elite";
        if (level > 15) rank = "Master";
        if (level > 30) rank = "Legend";

        return { level, rank, progress, nextXP, currentLevelXP, requiredXP };
    };

    // Radar Chart Logic
    const stats = [
        { label: 'Athlete', key: 'athlete_xp', color: '#EF4444', icon: Activity },
        { label: 'Scholar', key: 'scholar_xp', color: '#3B82F6', icon: BookOpen },
        { label: 'Stoic', key: 'disciplined_xp', color: '#10B981', icon: Shield },
        { label: 'Social', key: 'social_xp', color: '#F59E0B', icon: Heart },
    ];

    const getPoints = () => {
        // Max Scale defaults to 1000 XP for chart visualization or max of user's highest
        const values = stats.map(s => identities[s.key] || 0);
        const maxVal = Math.max(...values, 500); // Minimum scale 500

        return stats.map((s, i) => {
            const val = identities[s.key] || 0;
            const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
            const r = (val / maxVal) * RADIUS;
            const x = CENTER + r * Math.cos(angle);
            const y = CENTER + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#FFF" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Establish Identity</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Radar Chart */}
                <View style={styles.chartContainer}>
                    <Svg height={CHART_SIZE} width={CHART_SIZE}>
                        {/* Grid Webs */}
                        {[0.25, 0.5, 0.75, 1].map(scale => (
                            <Polygon
                                key={scale}
                                points={stats.map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
                                    const r = RADIUS * scale;
                                    return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
                                }).join(' ')}
                                stroke="#333"
                                strokeWidth="1"
                                fill="none"
                            />
                        ))}

                        {/* Data Polygon */}
                        <Polygon
                            points={getPoints()}
                            fill="rgba(59, 130, 246, 0.3)"
                            stroke={COLORS.accent}
                            strokeWidth="2"
                        />

                        {/* Axis Lines */}
                        {stats.map((_, i) => {
                            const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
                            return (
                                <Line
                                    key={i}
                                    x1={CENTER}
                                    y1={CENTER}
                                    x2={CENTER + RADIUS * Math.cos(angle)}
                                    y2={CENTER + RADIUS * Math.sin(angle)}
                                    stroke="#333"
                                    strokeWidth="1"
                                />
                            );
                        })}
                    </Svg>
                    {/* Labels overlay */}
                    <Text style={[styles.chartLabel, { top: 0 }]}>Athlete</Text>
                    <Text style={[styles.chartLabel, { right: 0, top: CENTER - 10 }]}>Scholar</Text>
                    <Text style={[styles.chartLabel, { bottom: 0 }]}>Stoic</Text>
                    <Text style={[styles.chartLabel, { left: 0, top: CENTER - 10 }]}>Social</Text>
                </View>

                {/* Identity Cards */}
                <View style={styles.listContainer}>
                    {stats.map(stat => {
                        const xp = identities[stat.key] || 0;
                        const info = getLevelInfo(xp);
                        const Icon = stat.icon;

                        return (
                            <View key={stat.key} style={styles.identityCard}>
                                <View style={[styles.iconBox, { backgroundColor: `${stat.color}20` }]}>
                                    <Icon size={24} color={stat.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={styles.cardTitle}>{stat.label}</Text>
                                        <Text style={[styles.cardRank, { color: stat.color }]}>{info.rank} • Lvl {info.level}</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${info.progress * 100}%`, backgroundColor: stat.color }]} />
                                    </View>
                                    <Text style={styles.xpText}>{xp} XP <Text style={{ color: '#444' }}>/ {info.requiredXP + xp - info.currentLevelXP}</Text></Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: { marginRight: 15 },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: 20,
        backgroundColor: '#212121',
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        paddingVertical: 20,
        position: 'relative',
    },
    chartLabel: {
        position: 'absolute',
        fontSize: 13,
        fontWeight: '600',
        color: '#E5E7EB',
        zIndex: 10,
    },
    listContainer: {
        marginBottom: 40,
        gap: 12,
    },
    identityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E5E7EB',
    },
    cardRank: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 6,
    },
    progressBarFill: {
        height: '100%',
    },
    xpText: {
        fontSize: 12,
        color: '#A0AEC0',
        marginTop: 6,
    }
});

export default EvolutionScreen;
