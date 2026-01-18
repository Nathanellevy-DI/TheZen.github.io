import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { Clock, Target, Flame, TrendingUp } from 'lucide-react';

/**
 * Format seconds to hours and minutes
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

/**
 * Get today's date key for storage
 */
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

/**
 * StatCard - Individual stat display
 */
function StatCard({ icon: Icon, label, value, subtext, color = 'ink' }) {
    return (
        <motion.div
            className="bg-paper rounded-2xl p-4 shadow-clay-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-stone-dark mb-1">{label}</p>
                    <p className="text-2xl font-medium text-ink">{value}</p>
                    {subtext && (
                        <p className="text-xs text-stone-dark mt-1">{subtext}</p>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                    <Icon size={20} className="text-ink" />
                </div>
            </div>
        </motion.div>
    );
}

/**
 * WeekChart - Simple week visualization
 */
function WeekChart({ data }) {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const maxValue = Math.max(...data, 1);

    return (
        <div className="flex items-end justify-between gap-2 h-24 px-2">
            {data.map((value, i) => {
                const height = (value / maxValue) * 100;
                const isToday = i === new Date().getDay();

                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                            className={`w-full rounded-t-lg ${isToday ? 'bg-ink' : 'bg-stone'
                                }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                        />
                        <span className={`text-xs ${isToday ? 'text-ink font-medium' : 'text-stone-dark'}`}>
                            {days[i]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * FocusStats - Productivity statistics dashboard
 */
export function FocusStats() {
    const [stats, setStats] = useState(() => {
        const stored = getStorageItem('focus_stats', null);
        return stored || {
            totalFocusTime: 0,
            sessionsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            weeklyData: [0, 0, 0, 0, 0, 0, 0],
            lastSessionDate: null,
        };
    });

    // Calculate derived stats
    const todayFocusTime = stats.weeklyData[new Date().getDay()] || 0;
    const avgSessionTime = stats.sessionsCompleted > 0
        ? Math.round(stats.totalFocusTime / stats.sessionsCompleted / 60)
        : 0;

    return (
        <div className="w-full max-w-md mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-medium text-ink">Focus Stats</h2>
                <p className="text-sm text-stone-dark">Your productivity at a glance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                    icon={Clock}
                    label="Today"
                    value={formatDuration(todayFocusTime * 60)}
                    subtext="focus time"
                />
                <StatCard
                    icon={Target}
                    label="Sessions"
                    value={stats.sessionsCompleted}
                    subtext="completed"
                />
                <StatCard
                    icon={Flame}
                    label="Streak"
                    value={`${stats.currentStreak} days`}
                    subtext={`Best: ${stats.longestStreak} days`}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Average"
                    value={`${avgSessionTime}m`}
                    subtext="per session"
                />
            </div>

            {/* Weekly Chart */}
            <div className="bg-paper rounded-2xl p-4 shadow-clay-soft">
                <h3 className="text-sm font-medium text-ink mb-4">This Week</h3>
                <WeekChart data={stats.weeklyData} />
                <div className="flex justify-between mt-3 text-xs text-stone-dark">
                    <span>Total: {formatDuration(stats.weeklyData.reduce((a, b) => a + b, 0) * 60)}</span>
                    <span>{stats.weeklyData.filter(d => d > 0).length} active days</span>
                </div>
            </div>

            {/* Total Stats */}
            <motion.div
                className="mt-6 text-center py-6 border-t border-stone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-3xl font-light text-ink mb-2">
                    {formatDuration(stats.totalFocusTime)}
                </p>
                <p className="text-sm text-stone-dark">total focus time</p>
            </motion.div>

            {/* Empty state */}
            {stats.sessionsCompleted === 0 && (
                <motion.div
                    className="text-center py-8 text-stone-dark"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-sm">Complete your first focus session to see stats</p>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Hook to record a completed focus session
 */
export function useRecordSession() {
    return (durationSeconds) => {
        const stored = getStorageItem('focus_stats', null) || {
            totalFocusTime: 0,
            sessionsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            weeklyData: [0, 0, 0, 0, 0, 0, 0],
            lastSessionDate: null,
        };

        const today = getTodayKey();
        const todayDayIndex = new Date().getDay();
        const durationMinutes = Math.round(durationSeconds / 60);

        // Update weekly data
        const newWeeklyData = [...stored.weeklyData];
        newWeeklyData[todayDayIndex] = (newWeeklyData[todayDayIndex] || 0) + durationMinutes;

        // Update streak
        let newStreak = stored.currentStreak;
        if (stored.lastSessionDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];

            if (stored.lastSessionDate === yesterdayKey) {
                newStreak = stored.currentStreak + 1;
            } else if (stored.lastSessionDate !== today) {
                newStreak = 1;
            }
        }

        const newStats = {
            totalFocusTime: stored.totalFocusTime + durationSeconds,
            sessionsCompleted: stored.sessionsCompleted + 1,
            currentStreak: newStreak,
            longestStreak: Math.max(stored.longestStreak, newStreak),
            weeklyData: newWeeklyData,
            lastSessionDate: today,
        };

        setStorageItem('focus_stats', newStats);
        return newStats;
    };
}
