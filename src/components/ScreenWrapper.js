import React from 'react';
import { View, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

const ScreenWrapper = ({ children, style }) => {
    return (
        <SafeAreaView style={[styles.container, style]}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {children}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    }
});

export default ScreenWrapper;
