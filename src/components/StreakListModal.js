import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Trash2, Plus } from 'lucide-react-native';
import { COLORS, SIZES } from '../constants/theme';

const StreakListModal = ({ visible, onClose, streaks, onAddStreak, onDeleteStreak }) => {
    // ... renderItem ...
    const renderItem = ({ item }) => (
        <View style={styles.streakItem}>
            <View style={styles.streakLeft}>
                <View style={styles.streakInfo}>
                    <Text style={[styles.streakName, item.completed && { color: COLORS.accent }]}>{item.text}</Text>
                    <Text style={styles.streakCount}>{item.streak || 0} days</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => onDeleteStreak && onDeleteStreak(item.id)} style={styles.deleteBtn}>
                <Trash2 size={16} color="#333" />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Active Streaks</Text>
                            </View>

                            {/* List */}
                            <FlatList
                                data={streaks}
                                keyExtractor={item => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No active streaks.</Text>
                                }
                            />

                            {/* Footer Action */}
                            <View style={styles.footer}>
                                <TouchableOpacity onPress={onAddStreak} style={styles.addBtn}>
                                    <Plus size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                                    <Text style={styles.addBtnText}>New Streak</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    // ... existing ...
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        height: '50%',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#E5E7EB',
        textAlign: 'center',
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    streakItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    streakLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakInfo: {
    },
    streakName: {
        fontSize: 15,
        color: '#E5E7EB',
        fontWeight: '500',
    },
    streakCount: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    deleteBtn: {
        padding: 8,
    },
    emptyText: {
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
    footer: {
        marginTop: 10,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        alignItems: 'flex-end', // Bottom Right
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    addBtnText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    }
});

export default StreakListModal;
