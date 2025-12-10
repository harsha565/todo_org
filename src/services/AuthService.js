import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, db } from "./firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc, getDoc } from "firebase/firestore";

const GUEST_KEY = "streakmaster_is_guest";

export const AuthService = {
    // Check if user is logged in or guest
    checkUser: async (callback) => {
        // Firebase Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                callback({ type: 'auth', user });
            } else {
                // Check local storage for guest mode
                const isGuest = await AsyncStorage.getItem(GUEST_KEY);
                if (isGuest === 'true') {
                    callback({ type: 'guest' });
                } else {
                    callback(null);
                }
            }
        });
        return unsubscribe;
    },

    loginWithEmail: async (email, password) => {
        try {
            await AsyncStorage.removeItem(GUEST_KEY); // Clear guest flag
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    },

    registerWithEmail: async (email, password) => {
        try {
            await AsyncStorage.removeItem(GUEST_KEY);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Initialize User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: new Date(),
                globalStreak: 0,
                lastActiveDate: new Date().toISOString().split('T')[0]
            });

            return user;
        } catch (error) {
            throw error;
        }
    },

    enableGuestMode: async () => {
        await AsyncStorage.setItem(GUEST_KEY, 'true');
        return { type: 'guest' };
    },

    logout: async () => {
        await signOut(auth);
        await AsyncStorage.removeItem(GUEST_KEY);
    }
};
