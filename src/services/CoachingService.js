import { DataService } from './DataService';
import { differenceInCalendarDays, subDays, parseISO } from 'date-fns';

export const CoachingService = {

    generateBriefing: async () => {
        try {
            // 1. Fetch Context Data
            const { logs, startStr, endStr } = await DataService.getWeeklyData();
            const stats = await DataService.getUserStats();

            // Sort logs by date descending (newest first)
            const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            const distinctLogs = sortedLogs; // Assuming unique dates already

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const yesterday = subDays(today, 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const todayLog = distinctLogs.find(l => l.date === todayStr);
            const yesterdayLog = distinctLogs.find(l => l.date === yesterdayStr);

            // 2. Evaluate Rules (Priority Order)

            // A. Comeback Praise (Immediate Positive Feedback)
            // IF yesterday was missed (no log or 0 score) AND today has good score (> 70)
            if (todayLog && todayLog.day_score > 70) {
                const wasYesterdayBad = !yesterdayLog || yesterdayLog.day_score === 0;
                if (wasYesterdayBad) {
                    return {
                        message: "Greatest glory is rising after a fall. Welcome back, Commander.",
                        icon: "🛡️",
                        type: "comeback"
                    };
                }
            }

            // B. Momentum Boost (High Performance)
            // IF current_streak > 5 AND (today > 85 OR last log > 85)
            const recentHighLog = distinctLogs[0]; // Most recent
            if (stats.current_streak > 5 && recentHighLog && recentHighLog.day_score > 85) {
                return {
                    message: "Unstoppable momentum. You are outperforming 90% of your past self.",
                    icon: "🔥",
                    type: "momentum"
                };
            }

            // C. Burnout Warning (Health Check)
            // IF last 3 logs exist AND avg energy < 2
            const last3Logs = distinctLogs.slice(0, 3);
            if (last3Logs.length === 3) {
                const avgEnergy = last3Logs.reduce((sum, l) => sum + (l.energy || 0), 0) / 3;
                if (avgEnergy < 2.5) { // Slightly higher threshold to trigger more easily for testing
                    return {
                        message: "Your battery is low. Tomorrow, focus ONLY on 1 High-Priority mission and rest.",
                        icon: "⚡",
                        type: "warning"
                    };
                }
            }

            // D. Consistency Check (Correction)
            // IF missions missed > 3 this week (simple proxy: days without logs or low score days)
            // Let's count days with score < 50 in the last 7 days
            const poorDays = 7 - distinctLogs.filter(l => l.day_score >= 50).length; // Very rough
            // Better: active logs in last 7 days
            const activeDays = distinctLogs.length;
            if (activeDays < 4) { // Missed > 3 days
                return {
                    message: "Consistency is the quiet engine of success. Let's hit just one small win today.",
                    icon: "🧱",
                    type: "consistency"
                };
            }

            // E. Default / Daily Stoic
            const quotes = [
                "The obstacle is the way.",
                "Discipline is freedom.",
                "Focus on what you can control.",
                "Amor Fati - Love your fate.",
                "One mission at a time.",
                "Actions speak louder than plans."
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

            return {
                message: randomQuote,
                icon: "⚓",
                type: "neutral"
            };

        } catch (e) {
            console.error("Briefing Error", e);
            return {
                message: "Ready to conquer?",
                icon: "⚔️",
                type: "default"
            };
        }
    }
};
