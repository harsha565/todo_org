import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { X, CheckCircle } from 'lucide-react-native';

const CustomSlider = ({ value, onValueChange }) => {
    return (
        <View style={styles.sliderContainer}>
            <View style={{ flex: 1, position: 'relative', height: 40, justifyContent: 'center' }}>
                <View style={styles.sliderTrack}>
                    <View style={[styles.sliderProgress, { width: `${((value - 1) / 4) * 100}%` }]} />
                </View>
                <View style={styles.sliderSteps}>
                    {[1, 2, 3, 4, 5].map(val => (
                        <TouchableOpacity
                            key={val}
                            onPress={() => onValueChange(val)}
                            style={styles.sliderHitZone}
                            activeOpacity={0.8}
                        >
                            {value === val && <View style={styles.sliderThumb} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <Text style={styles.sliderValueBadge}>{value}</Text>
        </View>
    );
};

const DailyCheckInModal = ({ visible, onClose, onSave, completedCount, stats, initialData }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('😐');
    const [energy, setEnergy] = useState(3);
    const [focus, setFocus] = useState(3);
    const [win, setWin] = useState('');
    const [finalScore, setFinalScore] = useState(0);

    const moods = ['😠', '😔', '😐', '🙂', '🔥'];

    useEffect(() => {
        if (visible) {
            setStep(1);
            if (initialData) {
                setMood(initialData.mood || '😐');
                setEnergy(initialData.energy || 3);
                setFocus(initialData.focus || 3);
                setWin(initialData.win_1 || '');
                setFinalScore(initialData.day_score || 0);
            } else {
                setMood('😐');
                setEnergy(3);
                setFocus(3);
                setWin('');
            }
        }
    }, [visible, initialData]);

    const calculateScore = () => {
        // Simple formula
        // Base: Completed missions
        // Energy/Focus boost
        // Bonus for high priority (passed in stats)

        let score = 50; // Base score for showing up
        if (completedCount > 0) score += 20;
        score += (energy * 4); // max 20
        score += (focus * 4); // max 20
        // Cap at 100
        if (score > 100) score = 100;

        setFinalScore(score);
    };

    const handleNext = () => {
        if (step === 1) {
            calculateScore();
            setStep(2);
        } else {
            console.log("Submitting Log", { mood, energy, day_score: finalScore });
            onSave({
                mood,
                energy,
                focus,
                win,
                struggle: '', // Keeping signature backward compatible
                day_score: finalScore,
            });
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X color="rgba(255,255,255,0.5)" size={24} />
                    </TouchableOpacity>

                    {step === 1 ? (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.title}>Daily Reflection</Text>
                            <Text style={styles.subtitle}>Take 60 seconds to reset.</Text>

                            <Text style={styles.label}>Mood</Text>
                            <View style={styles.moodRow}>
                                {moods.map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => setMood(m)}
                                        style={[styles.moodBtn, mood === m && styles.moodActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ fontSize: 40 }}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Energy Level</Text>
                            <CustomSlider value={energy} onValueChange={setEnergy} />

                            <Text style={styles.label}>Focus Level</Text>
                            <CustomSlider value={focus} onValueChange={setFocus} />

                            <Text style={styles.label}>Biggest Win</Text>
                            <TextInput
                                style={styles.input}
                                value={win}
                                onChangeText={setWin}
                                placeholder="What went well today?"
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </ScrollView>
                    ) : (
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <Text style={styles.scoreTitle}>DAY SCORE</Text>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreText}>{finalScore}</Text>
                            </View>
                            <Text style={styles.resultMsg}>{finalScore > 80 ? "ELITE PERFORMANCE" : "SOLID EFFORT"}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.submitBtn} onPress={handleNext}>
                        <Text style={styles.submitBtnText}>{step === 1 ? "Calculate Score" : "Seal The Day"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        backgroundColor: '#12141B', // Minimal premium dark map
        borderRadius: 24,
        padding: 30, // spec wants 40px, but on mobile 30 is safer
        width: '90%',
        maxWidth: 640,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    closeBtn: {
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 10,
    },
    title: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 4,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 12,
        marginTop: 10,
        fontSize: 13,
        fontWeight: '500',
    },
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    moodBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'transparent',
    },
    moodActive: {
        backgroundColor: 'rgba(255,106,26,0.1)',
        borderWidth: 2,
        borderColor: '#FF6A1A',
        transform: [{ scale: 1.05 }],
    },
    // Custom Slider Styles
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    sliderTrack: {
        position: 'absolute',
        left: 15,
        right: 15,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
    },
    sliderProgress: {
        height: '100%',
        backgroundColor: '#FF6A1A',
        borderRadius: 2,
    },
    sliderSteps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    sliderHitZone: {
        width: 30,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderThumb: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FF6A1A',
        shadowColor: '#FF6A1A',
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
    },
    sliderValueBadge: {
        color: '#FF6A1A',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 15,
        width: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#1A1D26',
        color: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 30,
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        height: 100, // accommodate 4 rows
    },
    submitBtn: {
        backgroundColor: '#FF6A1A',
        height: 48,
        width: '60%',
        alignSelf: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        marginTop: 10,
        shadowColor: 'rgba(255,106,26,0.5)',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
    scoreTitle: {
        color: '#9CA3AF',
        letterSpacing: 2,
        fontSize: 12,
        marginBottom: 20,
        fontWeight: '600',
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(249,115,22,0.1)', // Subtle glow
    },
    scoreText: {
        fontSize: 42,
        color: '#FFF',
        fontWeight: '800',
    },
    resultMsg: {
        color: '#E5E7EB',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    }
});

export default DailyCheckInModal;
