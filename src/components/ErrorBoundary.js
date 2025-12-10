import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error: error, errorInfo: errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.scroll}>
                        <Text style={styles.title}>Something went wrong.</Text>
                        <Text style={styles.subtitle}>Application Crashed</Text>
                        <View style={styles.box}>
                            <Text style={styles.errorText}>{this.state.error && this.state.error.toString()}</Text>
                        </View>
                        <View style={styles.box}>
                            <Text style={styles.stackText}>{this.state.errorInfo && this.state.errorInfo.componentStack}</Text>
                        </View>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'center',
    },
    scroll: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        color: 'red',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 20,
    },
    box: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 5,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    errorText: {
        color: 'red',
        fontFamily: 'monospace',
    },
    stackText: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#333',
    },
});

export default ErrorBoundary;
