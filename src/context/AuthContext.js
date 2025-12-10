import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '../services/AuthService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Safety Timeout: If Firebase takes > 5s, force stop loading
                const timeoutId = setTimeout(() => {
                    if (isMounted && loading) {
                        console.warn("Auth check timed out, forcing load completion");
                        setLoading(false);
                    }
                }, 5000);

                const unsubscribe = await AuthService.checkUser((result) => {
                    clearTimeout(timeoutId);
                    if (!isMounted) return;

                    if (result?.type === 'auth') {
                        setUser(result.user);
                        setIsGuest(false);
                    } else if (result?.type === 'guest') {
                        setUser(null);
                        setIsGuest(true);
                    } else {
                        setUser(null);
                        setIsGuest(false);
                    }
                    setLoading(false);
                });
                return unsubscribe;
            } catch (e) {
                console.error("Auth Init Error", e);
                if (isMounted) setLoading(false);
            }
        };

        const subPromise = initAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (email, password) => {
        await AuthService.loginWithEmail(email, password);
    };

    const register = async (email, password) => {
        await AuthService.registerWithEmail(email, password);
    };

    const loginAsGuest = async () => {
        await AuthService.enableGuestMode();
        setIsGuest(true);
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
        setIsGuest(false);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isGuest,
            loading,
            login,
            register,
            loginAsGuest,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
