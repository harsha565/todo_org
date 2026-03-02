import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, LogOut, Check } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper'; // Use Wrapper here too for consistency!

const SettingsScreen = ({ navigation }) => {
    const { logout, user } = useAuth();
    const { themes, activeThemeId, setTheme } = useTheme();

    const handleLogout = () => {
        logout();
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Section */}
                <View style={styles.section}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.email ? user.email[0].toUpperCase() : 'G'}</Text>
                        </View>
                        <View>
                            <Text style={styles.email}>{user?.email || 'Guest User'}</Text>
                            <Text style={styles.accountType}>{user ? 'Premium Member' : 'Guest Account'}</Text>
                        </View>
                    </View>
                </View>

                {/* Theme Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Appearance</Text>
                    <Text style={styles.sectionSubtitle}>Choose your vibe</Text>

                    <View style={styles.themeGrid}>
                        {themes.map((theme) => (
                            <TouchableOpacity
                                key={theme.id}
                                style={[
                                    styles.themeOption,
                                    activeThemeId === theme.id && styles.themeOptionActive
                                ]}
                                onPress={() => setTheme(theme.id)}
                            >
                                <View style={[styles.colorPreview, { backgroundColor: theme.preview }]} />
                                <Text style={styles.themeName}>{theme.name}</Text>
                                {activeThemeId === theme.id && (
                                    <View style={styles.checkIcon}>
                                        <Check size={12} color="#000" strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={COLORS.error} size={20} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
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
        backgroundColor: '#212121',
        paddingBottom: 40,
    },
    section: {
        marginBottom: 28,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    email: {
        color: '#F0F0F0',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 6,
    },
    accountType: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    sectionTitle: {
        color: '#F0F0F0',
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 20,
        fontWeight: '400',
    },
    themeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    themeOptionActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(59,130,246,0.15)',
    },
    colorPreview: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    themeName: {
        color: '#E5E7EB',
        fontSize: 13,
        fontWeight: '500',
    },
    checkIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 3,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.danger,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 40,
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default SettingsScreen;
