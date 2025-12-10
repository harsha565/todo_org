import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBCzKOV3ALwNowM9XzO5MB9tt6dcuQBRSY",
    authDomain: "streakmaker-bb222.firebaseapp.com",
    projectId: "streakmaker-bb222",
    storageBucket: "streakmaker-bb222.firebasestorage.app",
    messagingSenderId: "219115537520",
    appId: "1:219115537520:web:cce9e1a797189f5e3c20b5",
    measurementId: "G-MXRPZB8MSV"
};

const app = initializeApp(firebaseConfig);

let auth;

if (Platform.OS === 'web') {
    // Web: Use standard browser persistence
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence);
} else {
    // Mobile: Use AsyncStorage
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

const db = getFirestore(app);

export { auth, db };
