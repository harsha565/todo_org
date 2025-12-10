import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Flame } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
    const { login, register, loginAsGuest } = useAuth(); // Assuming 'register' is exposed in AuthContext
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // Toggle between Login/Register
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Flame color={COLORS.accent} size={64} fill={COLORS.accent} />
                        </View>
                        <Text style={styles.title}>StreakMaster</Text>
                        <Text style={styles.subtitle}>{isLogin ? 'Ignite your potential.' : 'Start your journey.'}</Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <Text style={styles.errorText}>{error}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={COLORS.secondaryText}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                selectionColor={COLORS.accent}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={COLORS.secondaryText}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                selectionColor={COLORS.accent}
                            />
                        </View>

                        <TouchableOpacity style={styles.loginButton} onPress={handleSubmit} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.loginButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchButtonText}>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <Text style={styles.highlight}>
                                    {isLogin ? 'Sign Up' : 'Login'}
                                </Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
                            <Text style={styles.guestButtonText}>Continue as Guest</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 320,
        padding: SIZES.padding,
        justifyContent: 'center',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        marginBottom: 20,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.secondaryText,
        marginTop: 10,
        letterSpacing: 1,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.text,
        marginBottom: 8,
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: COLORS.cardBg,
        borderRadius: SIZES.radius,
        padding: 14,
        color: COLORS.text,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#333',
    },
    loginButton: {
        backgroundColor: COLORS.accent,
        padding: 16,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    loginButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    guestButton: {
        padding: 16,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#333',
    },
    guestButtonText: {
        color: COLORS.secondaryText,
        fontSize: 14,
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchButtonText: {
        color: COLORS.secondaryText,
        fontSize: 14,
    },
    highlight: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 20,
        textAlign: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: 10,
        borderRadius: 5,
        overflow: 'hidden',
    }
});

export default LoginScreen;
