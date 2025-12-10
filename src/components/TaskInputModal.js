import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { X } from 'lucide-react-native';

const TaskInputModal = ({ visible, onClose, onAddTask, title = "New Mission" }) => {
    const [taskText, setTaskText] = useState('');

    const handleSubmit = () => {
        if (taskText.trim()) {
            onAddTask(taskText);
            setTaskText('');
            onClose();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X color={COLORS.secondaryText} size={24} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="What needs to be done?"
                        placeholderTextColor={COLORS.secondaryText}
                        value={taskText}
                        onChangeText={setTaskText}
                        autoFocus
                        multiline
                        onSubmitEditing={handleSubmit}
                    />

                    <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                        <Text style={styles.addButtonText}>Add Mission</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: SIZES.padding,
        borderTopWidth: 1,
        borderColor: '#333',
        minHeight: 250,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: COLORS.cardBg,
        borderRadius: SIZES.radius,
        padding: 15,
        color: COLORS.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addButton: {
        backgroundColor: COLORS.accent,
        padding: 16,
        borderRadius: SIZES.radius,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default TaskInputModal;
