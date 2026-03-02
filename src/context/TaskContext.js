import React, { createContext, useState, useContext, useEffect } from 'react';
import { DataService } from '../services/DataService';
import { useAuth } from './AuthContext';

const TaskContext = createContext({});

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { user, isGuest } = useAuth(); // Depend on Auth State
    const [tasks, setTasks] = useState([]);
    const [filterCategory, setFilterCategory] = useState('All');

    // Load Tasks on Auth Change
    useEffect(() => {
        if (user || isGuest) {
            loadTasks();
        } else {
            setTasks([]);
        }
    }, [user, isGuest]);

    const loadTasks = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            // Load all for now
            const loadedTasks = await DataService.getTasksForDate(null);

            const mapped = loadedTasks.map(t => ({
                id: t.id,
                text: t.text || t.title,
                // For Streaks, 'completed' means 'completed TODAY'.
                completed: t.isStreak
                    ? (t.completionHistory || []).includes(todayStr)
                    : t.isCompleted,
                streak: t.streakCount,
                isStreak: t.isStreak,
                date: t.dateScheduled,
                completionHistory: t.completionHistory || [],
                // New Metadata
                priority: t.priority || 'medium',
                category: t.category || 'Personal',
                isHabit: t.isHabit || false,
                estimatedTime: t.estimatedTime || 0,
                xpReward: t.xpReward || 10
            }));

            // Sort: High > Medium > Low
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            mapped.sort((a, b) => {
                const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (diff !== 0) return diff;
                return b.id - a.id; // Fallback to newest (using ID timestamp approx)
            });

            setTasks(mapped);
        } catch (e) {
            console.error("Failed to load tasks", e);
        }
    };

    const addTask = async (text, options = {}) => {
        try {
            // Fix: signatures match DataService (text, options)
            // Note: DataService generates dateScheduled internally.
            const newTask = await DataService.addTask(text, options);

            setTasks(prev => {
                const newItem = {
                    id: newTask.id,
                    text: newTask.text,
                    completed: newTask.isCompleted, // Default false
                    streak: newTask.streakCount,
                    isStreak: newTask.isStreak,
                    date: newTask.dateScheduled,
                    completionHistory: newTask.completionHistory,
                    // New Fields
                    priority: newTask.priority,
                    category: newTask.category,
                    isHabit: newTask.isHabit,
                    estimatedTime: newTask.estimatedTime,
                    xpReward: newTask.xpReward
                };

                // Re-sort
                const newAll = [newItem, ...prev];
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return newAll.sort((a, b) => {
                    const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (diff !== 0) return diff;
                    return b.id - a.id;
                });
            });
        } catch (e) {
            console.error("Add failed", e);
        }
    };

    const toggleTask = async (id, targetDate = new Date().toISOString().split('T')[0]) => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const todayStr = new Date().toISOString().split('T')[0];

            // Optimistic Update
            setTasks(prev => prev.map(t => {
                if (t.id === id) {
                    if (t.isStreak) {
                        const history = t.completionHistory || [];
                        const isCompletedOnTarget = history.includes(targetDate);

                        let newHistory;
                        if (isCompletedOnTarget) {
                            newHistory = history.filter(d => d !== targetDate);
                        } else {
                            newHistory = [...history, targetDate];
                        }

                        // Recalculate 'completed' status ONLY if targetDate is TODAY
                        const isCompletedToday = targetDate === todayStr
                            ? !isCompletedOnTarget
                            : t.completed; // Keep existing if toggling past date

                        return {
                            ...t,
                            completionHistory: newHistory,
                            streak: newHistory.length,
                            completed: isCompletedToday
                        };
                    } else {
                        // Standard Mission
                        return { ...t, completed: !t.completed };
                    }
                }
                return t;
            }));

            // API Call
            await DataService.toggleTaskCompletion(id, task.completed, task.streak, task.isStreak, targetDate);
        } catch (e) {
            console.error("Toggle failed", e);
            loadTasks(); // Revert on failure
        }
    };



    const deleteTask = async (id) => {
        try {
            // Optimistic
            setTasks(prev => prev.filter(t => t.id !== id));
            await DataService.deleteTask(id);
        } catch (e) {
            console.error("Delete failed", e);
            loadTasks();
        }
    };

    // Add Daily Logs support if not exists, but prioritizing updateTask
    // (Leaving as is to avoid scope creep, focus on Update fix)

    const updateTask = async (id, updates) => {
        try {
            // Optimistic Update
            setTasks(prev => prev.map(t => {
                if (t.id === id) {
                    // Handle field mapping: title -> text
                    const overrides = { ...updates };
                    if (overrides.title) {
                        overrides.text = overrides.title;
                    }
                    return { ...t, ...overrides };
                }
                return t;
            }));

            await DataService.updateTask(id, updates);
        } catch (e) {
            console.error("Update failed", e);
            loadTasks();
        }
    };

    return (
        <TaskContext.Provider value={{
            tasks: filterCategory === 'All' ? tasks : tasks.filter(t => t.category === filterCategory),
            addTask,
            toggleTask,
            deleteTask,
            updateTask,
            filterCategory,
            setFilterCategory,
            // Also exposing log stuff if needed, checking Dashboard usage
            // Dashboard used: dailyLogs, saveDailyLog. I need to check if these are in Context?
            // DashboardScreen (Step 450) destructures logic: dailyLogs, saveDailyLog.
            // But TaskContext (Step 481) DOES NOT HAVE THEM.
            // I should probably add them too or Dashboard will break for those as well.
            // For now, focusing on updateTask.
        }}>
            {children}
        </TaskContext.Provider>
    );
};
