import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { X, CheckCircle } from 'lucide-react-native';

const DailyCheckInModal = ({ visible, onClose, onSave, completedCount, stats, initialData }) => {
    const [step, setStep] = useState(1);
    const [mood, setMood] = useState('😐');
    const [energy, setEnergy] = useState(3);
    const [focus, setFocus] = useState(3);
    const [win, setWin] = useState('');
    const [struggle, setStruggle] = useState('');
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
                setStruggle(initialData.learn_1 || ''); // Mapping learn to struggle/block input
                setFinalScore(initialData.day_score || 0);
            } else {
                setMood('😐');
                setEnergy(3);
                setFocus(3);
                setWin('');
                setStruggle('');
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
                struggle,
                day_score: finalScore,
            });
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X color="#FFF" size={24} />
                    </TouchableOpacity>

                    {step === 1 ? (
                        <ScrollView>
                            <Text style={styles.title}>Daily Reflection</Text>

                            <Text style={styles.label}>Mood</Text>
                            <View style={styles.row}>
                                {moods.map(m => (
                                    <TouchableOpacity key={m} onPress={() => setMood(m)} style={[styles.moodBtn, mood === m && styles.moodActive]}>
                                        <Text style={{ fontSize: 24 }}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Energy Level ({energy}/5)</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <TouchableOpacity key={n} onPress={() => setEnergy(n)} style={[styles.numBtn, energy === n && styles.numActive]}>
                                        <Text style={styles.btnText}>{n}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Focus Level ({focus}/5)</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <TouchableOpacity key={n} onPress={() => setFocus(n)} style={[styles.numBtn, focus === n && styles.numActive]}>
                                        <Text style={styles.btnText}>{n}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Biggest Win</Text>
                            <TextInput style={styles.input} value={win} onChangeText={setWin} placeholder="What went well?" placeholderTextColor="#666" />

                            <Text style={styles.label}>Biggest Struggle</Text>
                            <TextInput style={styles.input} value={struggle} onChangeText={setStruggle} placeholder="What blocked you?" placeholderTextColor="#666" />
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
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: '#111',
        borderRadius: 20,
        padding: 20,
        maxHeight: '90%',
        borderWidth: 1,
        borderColor: '#333'
    },
    closeBtn: {
        alignSelf: 'flex-end',
        marginBottom: 10
    },
    title: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    label: {
        color: '#888',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase',
        fontSize: 12
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    moodBtn: {
        padding: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#333'
    },
    moodActive: {
        backgroundColor: '#333',
        borderColor: COLORS.accent
    },
    numBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#333'
    },
    numActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold'
    },
    input: {
        backgroundColor: '#222',
        color: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10
    },
    submitBtn: {
        backgroundColor: COLORS.accent,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20
    },
    submitBtnText: {
        color: '#000',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    scoreTitle: {
        color: '#888',
        letterSpacing: 2,
        fontSize: 14,
        marginBottom: 20
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.accent,
        shadowOpacity: 0.5,
        shadowRadius: 20
    },
    scoreText: {
        fontSize: 48,
        color: '#FFF',
        fontWeight: '900'
    },
    resultMsg: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    }
});

export default DailyCheckInModal;
