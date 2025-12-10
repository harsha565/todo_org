import { db, auth } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
    getDoc,
    setDoc
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_TASKS_KEY = "streakmaster_local_tasks";
const LOCAL_USER_KEY = "streakmaster_local_user";

// Helper to check Auth State
const isAuth = () => auth.currentUser != null;
const getUid = () => auth.currentUser?.uid;

export const DataService = {

    // --- TASK MANAGEMENT ---

    addTask: async (title, date, isStreak = false) => {
        const newTask = {
            title,
            isCompleted: false,
            dateScheduled: date, // YYYY-MM-DD
            order: Date.now(),
            streakCount: isStreak ? 0 : null,
            completionHistory: isStreak ? [] : null, // Store dates of completion
            isStreak,
            icon: "🔥",
            createdAt: new Date().toISOString()
        };

        if (isAuth()) {
            // FIRESTORE
            try {
                const tasksRef = collection(db, "users", getUid(), "tasks");
                const docRef = await addDoc(tasksRef, newTask);
                console.log("Document written with ID: ", docRef.id);
                return { id: docRef.id, ...newTask };
            } catch (e) {
                console.error("Error adding document: ", e);
                throw e;
            }
        } else {
            // ASYNC STORAGE
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            const tasks = stored ? JSON.parse(stored) : [];
            const localTask = { id: Date.now().toString(), ...newTask };
            tasks.unshift(localTask); // Add to top
            await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
            return localTask;
        }
    },

    getTasksForDate: async (date) => { // date format: YYYY-MM-DD or partial check
        if (isAuth()) {
            // FIRESTORE
            // Note: Simple query. For production, index "dateScheduled" + "order"
            const q = query(
                collection(db, "users", getUid(), "tasks"),
                orderBy("order", "desc") // Show newest first
            );
            const snapshot = await getDocs(q);
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side filter for specific date if needed, or simply return all for now to maintain streak list
            // For now, returning ALL tasks to populate the list, client can filter daily view
            return tasks;
        } else {
            // ASYNC STORAGE
            try {
                const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
                const tasks = stored ? JSON.parse(stored) : [];
                return Array.isArray(tasks) ? tasks : [];
            } catch (e) {
                console.error("Failed to parse local tasks", e);
                return []; // Return empty on corruption
            }
        }
    },

    toggleTaskCompletion: async (taskId, currentStatus, currentStreak, isStreak, targetDate) => {
        // targetDate format: "YYYY-MM-DD"

        if (isAuth()) {
            // FIRESTORE
            const taskRef = doc(db, "users", getUid(), "tasks", taskId);

            if (isStreak) {
                // Fetch current doc to get history
                const taskSnap = await getDoc(taskRef);
                if (taskSnap.exists()) {
                    const data = taskSnap.data();
                    let history = data.completionHistory || [];
                    const alreadyCompleted = history.includes(targetDate);

                    let newHistory;
                    if (alreadyCompleted) {
                        newHistory = history.filter(d => d !== targetDate); // Remove
                    } else {
                        newHistory = [...history, targetDate]; // Add
                    }

                    // Recalculate streak count (consecutive days ending yesterday/today) - simplified for now to just length or basic count
                    // For now, let's trust the context to calculate valid streak, or just use history length
                    const newStreakCount = newHistory.length;

                    await updateDoc(taskRef, {
                        completionHistory: newHistory,
                        streakCount: newStreakCount
                    });
                    return { id: taskId, completionHistory: newHistory, streakCount: newStreakCount, isStreak: true };
                }
            } else {
                // NORMAL MISSION (Toggle Boolean)
                const newStatus = !currentStatus;
                await updateDoc(taskRef, { isCompleted: newStatus });
                return { id: taskId, isCompleted: newStatus, isStreak: false };
            }

        } else {
            // ASYNC STORAGE
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            let tasks = stored ? JSON.parse(stored) : [];
            let updatedTask = null;

            tasks = tasks.map(t => {
                if (t.id === taskId) {
                    if (isStreak) {
                        let history = t.completionHistory || [];
                        const alreadyCompleted = history.includes(targetDate);
                        let newHistory = alreadyCompleted
                            ? history.filter(d => d !== targetDate)
                            : [...history, targetDate];

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
            // FIRESTORE
            await deleteDoc(doc(db, "users", getUid(), "tasks", taskId));
        } else {
            // ASYNC STORAGE
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            let tasks = stored ? JSON.parse(stored) : [];
            tasks = tasks.filter(t => t.id !== taskId);
            await AsyncStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
        }
    },

    // --- STREAK & ANALYTICS ---

    calculateDailyProgress: async (dateStr) => {
        // Fetch tasks for date
        let tasks = [];
        if (isAuth()) {
            const q = query(
                collection(db, "users", getUid(), "tasks"),
                where("dateScheduled", "==", dateStr)
            );
            const snapshot = await getDocs(q);
            tasks = snapshot.docs.map(doc => doc.data());
        } else {
            const stored = await AsyncStorage.getItem(LOCAL_TASKS_KEY);
            const allTasks = stored ? JSON.parse(stored) : [];
            tasks = allTasks.filter(t => t.dateScheduled === dateStr);
        }

        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.isCompleted).length;
        return Math.round((completed / tasks.length) * 100);
    }
};
