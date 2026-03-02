import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';
import { Flame } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const { login, register, loginAsGuest } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [focusedInput, setFocusedInput] = useState(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        loginAsGuest();
    };

    return (
        <View style={styles.container}>
            {/* Static Radial Gradient Background */}
            <View style={StyleSheet.absoluteFill}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <RadialGradient
                            id="grad"
                            cx="50%"
                            cy="100%"
                            rx="80%"
                            ry="50%"
                            fx="50%"
                            fy="100%"
                            gradientUnits="userSpaceOnUse"
                        >
                            <Stop offset="0%" stopColor="rgba(249,115,22,0.12)" stopOpacity="1" />
                            <Stop offset="55%" stopColor="rgba(33,33,33,0.95)" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#212121" stopOpacity="1" />
                        </RadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100%" height="100%" fill="#212121" />
                    <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
                </Svg>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Flame color="#F97316" size={64} fill="#F97316" />
                        </View>
                        <Text style={styles.title}>StreakMaster</Text>
                        <Text style={styles.tagline}>Ignite your potential</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    focusedInput === 'email' && styles.inputFocused
                                ]}
                                placeholder="Enter email"
                                placeholderTextColor="rgba(229,231,235,0.45)"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                selectionColor="#F97316"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.input,
                                    focusedInput === 'password' && styles.inputFocused
                                ]}
                                placeholder="Enter password"
                                placeholderTextColor="rgba(229,231,235,0.45)"
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                                secureTextEntry
                                selectionColor="#F97316"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.ctaText}>
                                    {isLogin ? 'ACCESS YOUR POTENTIAL' : 'INITIATE SYSTEM'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchButtonText}>
                                {isLogin ? "New user? " : "Returning? "}
                                <Text style={styles.highlight}>
                                    {isLogin ? 'Create Account' : 'Login'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
                            <Text style={styles.guestButtonText}>Continue as Guest</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#212121', // Base color fallback
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 340,
        padding: SIZES.padding,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(229,231,235,0.65)',
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        color: '#E5E7EB',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    inputFocused: {
        borderColor: 'rgba(249,115,22,0.45)', // Focus Border
    },
    ctaButton: {
        backgroundColor: '#F97316',
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
    },
    ctaText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    switchButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchButtonText: {
        color: 'rgba(229,231,235,0.45)',
        fontSize: 13,
    },
    highlight: {
        color: '#F97316',
        fontWeight: '600',
    },
    guestButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 8,
    },
    guestButtonText: {
        color: 'rgba(229,231,235,0.45)',
        fontSize: 12,
        textDecorationLine: 'none', // Removed underline as per visual priority "low"
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 13,
        backgroundColor: 'rgba(239,68,68,0.1)',
        padding: 8,
        borderRadius: 8,
    }
});

export default LoginScreen;
