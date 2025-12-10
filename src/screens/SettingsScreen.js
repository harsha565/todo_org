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
    },
    section: {
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#222',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: COLORS.accent,
    },
    avatarText: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    email: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    accountType: {
        color: COLORS.secondaryText,
        fontSize: 12,
        marginTop: 4,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    sectionSubtitle: {
        color: COLORS.secondaryText,
        fontSize: 12,
        marginBottom: 15,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    themeOption: {
        width: '48%',
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    themeOptionActive: {
        borderColor: COLORS.accent,
        backgroundColor: '#222',
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#555',
        marginRight: 10,
    },
    themeName: {
        color: COLORS.secondaryText,
        fontSize: 12,
        fontWeight: '600',
    },
    checkIcon: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: COLORS.accent,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 0, 0, 0.3)',
        padding: 18,
        borderRadius: 15,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#500',
        marginTop: 10,
    },
    logoutText: {
        color: COLORS.error,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default SettingsScreen;
