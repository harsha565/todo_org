import { db, auth } from './firebase';
import {
    collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, setDoc, orderBy, deleteDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

const LOCAL_TASKS_KEY = "streakmaster_tasks";
const LOCAL_LOGS_KEY = "streakmaster_daily_logs";

const getUid = () => auth.currentUser ? auth.currentUser.uid : null;
const isAuth = () => !!auth.currentUser;

export const DataService = {

    addTask: async (text, options = {}) => {
        const task = {
            text,
            completed: false,
            isStreak: options.isStreak || false,
            isHabit: options.isHabit || false,
            category: options.category || 'Personal',
            priority: options.priority || 'medium',
            estimatedTime: options.estimatedTime || 15,
            dateScheduled: format(new Date(), 'yyyy-MM-dd'), // Local Date
            createdAt: new Date().toISOString(),
            xpReward: options.priority === 'high' ? 20 : (options.priority === 'low' ? 5 : 10),
            order: Date.now()
        };

        if (isAuth()) {
            const docRef = await addDoc(collection(db, "users", getUid(), "tasks"), task);
            return { id: docRef.id, ...task };
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            const tasks = stored ? JSON.parse(stored) : [];
            const newTask = { id: Date.now().toString(), ...task };
            tasks.unshift(newTask);
            await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
            return newTask;
        }
    },

    getTasksForDate: async (dateStr) => {
        if (isAuth()) {
            try {
                const q = query(collection(db, "users", getUid(), "tasks"), orderBy("order", "desc"));
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) { console.error(e); return []; }
        } else {
            try {
                const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
                return stored ? JSON.parse(stored) : [];
            } catch (e) { return []; }
        }
    },

    toggleTaskCompletion: async (taskId, currentStatus, currentStreak, isStreak, targetDate) => {
        if (isAuth()) {
            const taskRef = doc(db, "users", getUid(), "tasks", taskId);

            if (isStreak) {
                const taskSnap = await getDoc(taskRef);
                if (taskSnap.exists()) {
                    const data = taskSnap.data();
                    let history = data.completionHistory || [];
                    const alreadyCompleted = history.includes(targetDate);
                    const newHistory = alreadyCompleted ? history.filter(d => d !== targetDate) : [...history, targetDate];
                    const newStreakCount = newHistory.length;

                    await updateDoc(taskRef, { completionHistory: newHistory, streakCount: newStreakCount });
                    return { id: taskId, completionHistory: newHistory, streakCount: newStreakCount, isStreak: true };
                }
            } else {
                const newStatus = !currentStatus;
                await updateDoc(taskRef, { isCompleted: newStatus });

                const snap = await getDoc(taskRef);
                if (snap.exists()) {
                    const t = snap.data();
                    const xp = t.xpReward || 10;
                    const cat = t.category || 'Personal';
                    await DataService.updateIdentityXP(cat, newStatus ? xp : -xp);
                }
                return { id: taskId, isCompleted: newStatus, isStreak: false };
            }
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            let tasks = stored ? JSON.parse(stored) : [];
            let updatedTask = null;

            const target = tasks.find(t => t.id === taskId);
            if (target && !isStreak) {
                const newStatus = !target.isCompleted;
                const xp = target.xpReward || 10;
                const cat = target.category || 'Personal';
                await DataService.updateIdentityXP(cat, newStatus ? xp : -xp);
            }

            tasks = tasks.map(t => {
                if (t.id === taskId) {
                    if (isStreak) {
                        let history = t.completionHistory || [];
                        const alreadyCompleted = history.includes(targetDate);
                        let newHistory = alreadyCompleted ? history.filter(d => d !== targetDate) : [...history, targetDate];
                        updatedTask = { ...t, completionHistory: newHistory, streakCount: newHistory.length };
                        return updatedTask;
                    } else {
                        updatedTask = { ...t, isCompleted: !t.isCompleted };
                        return updatedTask;
                    }
                }
                return t;
            });
            await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
            return updatedTask;
        }
    },

    deleteTask: async (taskId) => {
        if (isAuth()) {
            await deleteDoc(doc(db, "users", getUid(), "tasks", taskId));
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            if (stored) {
                const tasks = JSON.parse(stored).filter(t => t.id !== taskId);
                await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
            }
        }
    },

    updateTask: async (taskId, updates) => {
        if (isAuth()) {
            await updateDoc(doc(db, "users", getUid(), "tasks", taskId), updates);
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            if (stored) {
                const tasks = JSON.parse(stored).map(t => t.id === taskId ? { ...t, ...updates } : t);
                await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
            }
        }
    },

    saveDailyLog: async (data) => {
        const date = data.date;
        if (isAuth()) {
            const docRef = doc(db, "users", getUid(), "dailyLogs", date);
            await setDoc(docRef, data, { merge: true });
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_LOGS_KEY);
            const logs = stored ? JSON.parse(stored) : {};
            logs[date] = { ...(logs[date] || {}), ...data };
            await AsyncStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
        }
        await DataService.updateUserStats(data);
    },

    getDailyLog: async (date) => {
        if (isAuth()) {
            try {
                const docRef = doc(db, "users", getUid(), "dailyLogs", date);
                const snap = await getDoc(docRef);
                return snap.exists() ? snap.data() : null;
            } catch (e) { return null; }
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_LOGS_KEY);
            const logs = stored ? JSON.parse(stored) : {};
            return logs[date] || null;
        }
    },

    getDataInRange: async (startStr, endStr) => {
        let logs = [];
        let tasks = [];

        if (isAuth()) {
            try {
                const logsQ = query(collection(db, "users", getUid(), "dailyLogs"), where("date", ">=", startStr), where("date", "<=", endStr));
                const logsSnap = await getDocs(logsQ);
                logs = logsSnap.docs.map(d => d.data());

                const tasksQ = query(collection(db, "users", getUid(), "tasks"), where("dateScheduled", ">=", startStr), where("dateScheduled", "<=", endStr));
                const tasksSnap = await getDocs(tasksQ);
                tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) { console.error(e); }
        } else {
            try {
                const storedLogs = await AsyncStorage.getItem(LOCAL_LOGS_KEY);
                const allLogs = storedLogs ? JSON.parse(storedLogs) : {};
                logs = Object.values(allLogs).filter(l => l.date >= startStr && l.date <= endStr);
                const storedTasks = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
                const allTasks = storedTasks ? JSON.parse(storedTasks) : [];
                tasks = allTasks.filter(t => t.dateScheduled >= startStr && t.dateScheduled <= endStr);
            } catch (e) { console.error(e); }
        }
        return { logs, tasks };
    },

    getWeeklyData: async () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const { logs, tasks } = await DataService.getDataInRange(startStr, endStr);
        return { logs, tasks, startStr, endStr };
    },

    getUserStats: async () => {
        if (isAuth()) {
            try {
                const docRef = doc(db, "users", getUid());
                const snap = await getDoc(docRef);
                return snap.exists() ? (snap.data().stats || {}) : {};
            } catch (e) { return {}; }
        } else {
            const stored = await AsyncStorage.getItem("streakmaster_stats");
            return stored ? JSON.parse(stored) : {};
        }
    },

    updateUserStats: async (todaysLog) => {
        const currentStats = await DataService.getUserStats();
        let { current_streak, longest_streak, last_active_date } = currentStats;
        current_streak = current_streak || 0;
        longest_streak = longest_streak || 0;

        const today = new Date().toISOString().split('T')[0];

        if (todaysLog.day_score >= 70) {
            if (last_active_date) {
                const daysDiff = differenceInCalendarDays(parseISO(today), parseISO(last_active_date));
                if (daysDiff === 1) {
                    current_streak += 1;
                } else if (daysDiff > 1) {
                    current_streak = 1;
                }
            } else {
                current_streak = 1;
            }
            last_active_date = today;
            if (current_streak > longest_streak) longest_streak = current_streak;
        }

        const newStats = { ...currentStats, current_streak, longest_streak, last_active_date };

        if (isAuth()) {
            await updateDoc(doc(db, "users", getUid()), { stats: newStats });
        } else {
            await AsyncStorage.setItem("streakmaster_stats", JSON.stringify(newStats));
        }
        return newStats;
    },

    getIdentities: async () => {
        if (isAuth()) {
            try {
                const docRef = doc(db, "users", getUid());
                const snap = await getDoc(docRef);
                return snap.exists() ? (snap.data().identities || {}) : {};
            } catch (e) { return {}; }
        } else {
            const stored = await AsyncStorage.getItem("streakmaster_identities");
            return stored ? JSON.parse(stored) : {};
        }
    },

    updateIdentityXP: async (category, xpAmount) => {
        const map = {
            'Health': 'athlete_xp',
            'Skill/Work': 'scholar_xp',
            'Discipline': 'disciplined_xp',
            'Personal': 'social_xp'
        };
        const key = map[category];
        if (!key) return;

        let identities = await DataService.getIdentities();
        let currentXP = identities[key] || 0;
        let newXP = currentXP + xpAmount;
        if (newXP < 0) newXP = 0;
        identities[key] = newXP;

        if (isAuth()) {
            await setDoc(doc(db, "users", getUid()), { identities }, { merge: true });
        } else {
            await AsyncStorage.setItem("streakmaster_identities", JSON.stringify(identities));
        }
    },

    getOrSetDailyQuote: async (dateStr, timeFrame, pool) => {
        const key = `daily_quote_${dateStr}_${timeFrame}`;
        try {
            const stored = await AsyncStorage.getItem(key);
            if (stored) return stored;

            const newQuote = pool[Math.floor(Math.random() * pool.length)];
            await AsyncStorage.setItem(key, newQuote);
            return newQuote;
        } catch (e) {
            return pool[0];
        }
    }
};
