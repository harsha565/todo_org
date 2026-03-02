import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { X, Clock, Tag, Flag } from 'lucide-react-native';

const TaskInputModal = ({ visible, onClose, onAddTask, onUpdateTask, initialData, title }) => {
    const [text, setText] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('Personal');
    const [estimatedTime, setEstimatedTime] = useState('15');
    const [isHabit, setIsHabit] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialData) {
                setText(initialData.text || '');
                setPriority(initialData.priority || 'medium');
                setCategory(initialData.category || 'Personal');
                setEstimatedTime(initialData.estimatedTime ? String(initialData.estimatedTime) : '15');
                setIsHabit(initialData.isHabit || false);
            } else {
                // Reset defaults
                setText('');
                setPriority('medium');
                setCategory('Personal');
                setEstimatedTime('15');
                setIsHabit(false);
            }
        }
    }, [visible, initialData]);

    const handleSubmit = () => {
        if (!text.trim()) return;

        const taskData = {
            priority,
            category,
            estimatedTime: parseInt(estimatedTime) || 15,
            isHabit
        };

        if (initialData && onUpdateTask) {
            onUpdateTask(initialData.id, { text, ...taskData });
        } else {
            onAddTask(text, taskData);
        }
        onClose();
    };

    const priorities = ['low', 'medium', 'high'];
    const categories = ['Personal', 'Work', 'Health', 'Skill', 'Discipline'];

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title || 'New Mission'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color="#FFF" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Task Name */}
                        <Text style={styles.label}>Mission Directive</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Code the Login Screen"
                            placeholderTextColor={COLORS.secondaryText}
                            value={text}
                            onChangeText={setText}
                            autoFocus
                        />

                        {/* Priority */}
                        <Text style={styles.label}>Priority Level</Text>
                        <View style={styles.row}>
                            {priorities.map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.chip, priority === p && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}
                                    onPress={() => setPriority(p)}
                                >
                                    <Text style={[styles.chipText, priority === p && { color: '#000' }]}>{p.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Category */}
                        <Text style={styles.label}>Identity Core</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
                            {categories.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, category === c && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
                                    onPress={() => setCategory(c)}
                                >
                                    <Text style={[styles.chipText, category === c && { color: '#FFF' }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Time */}
                        <Text style={styles.label}>Est. Time (Min)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={estimatedTime}
                            onChangeText={setEstimatedTime}
                        />

                        {/* Habit Toggle */}
                        <TouchableOpacity
                            style={[styles.checkboxRow, isHabit && styles.activeRow]}
                            onPress={() => setIsHabit(!isHabit)}
                        >
                            <View style={[styles.checkbox, isHabit && styles.checkboxActive]} />
                            <Text style={styles.checkboxText}>Repeat Daily (Habit)</Text>
                        </TouchableOpacity>

                    </ScrollView>

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                        <Text style={styles.submitBtnText}>
                            {initialData ? 'Update Mission' : 'Initiate'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 28,
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        paddingBottom: 16,
    },
    label: {
        color: '#A0AEC0',
        marginTop: 18,
        marginBottom: 10,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#2A2A2A',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 10,
        fontSize: 16,
        fontWeight: '500',
        borderWidth: 1,
        borderColor: '#444',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#444',
        backgroundColor: '#2A2A2A',
    },
    chipText: {
        color: '#A0AEC0',
        fontSize: 13,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: COLORS.accent,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    submitBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 10,
        backgroundColor: '#2A2A2A',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#666',
        borderRadius: 4,
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    checkboxText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: '500',
    }
});

export default TaskInputModal;
