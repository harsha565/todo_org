import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const LoadingScreen = () => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent || '#FF4500'} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background || '#000',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default LoadingScreen;
