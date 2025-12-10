import React, { createContext, useState, useContext, useEffect } from 'react';
import { DataService } from '../services/DataService';
import { useAuth } from './AuthContext';

const TaskContext = createContext({});

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { user, isGuest } = useAuth(); // Depend on Auth State
    const [tasks, setTasks] = useState([]);

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
                text: t.title,
                // For Streaks, 'completed' means 'completed TODAY'.
                completed: t.isStreak
                    ? (t.completionHistory || []).includes(todayStr)
                    : t.isCompleted,
                streak: t.streakCount,
                isStreak: t.isStreak,
                date: t.dateScheduled,
                completionHistory: t.completionHistory || []
            }));
            setTasks(mapped);
        } catch (e) {
            console.error("Failed to load tasks", e);
        }
    };

    const addTask = async (text, isStreak = false) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const newTask = await DataService.addTask(text, today, isStreak);

            setTasks(prev => [{
                id: newTask.id,
                text: newTask.title,
                completed: newTask.isCompleted, // Default false
                streak: newTask.streakCount,
                isStreak: newTask.isStreak,
                date: newTask.dateScheduled,
                completionHistory: newTask.completionHistory
            }, ...prev]);
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

    return (
        <TaskContext.Provider value={{
            tasks,
            addTask,
            toggleTask,
            deleteTask
        }}>
            {children}
        </TaskContext.Provider>
    );
};
