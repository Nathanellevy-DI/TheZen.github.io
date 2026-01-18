import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { Clock, Target, Flame, TrendingUp, Play, CheckCircle, History } from 'lucide-react';

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatCard({ icon: Icon, label, value, subtext }) {
    return (
        <motion.div
            className="bg-paper rounded-2xl p-3 shadow-clay-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-stone-dark mb-0.5">{label}</p>
                    <p className="text-xl font-medium text-ink">{value}</p>
                    {subtext && <p className="text-[10px] text-stone-dark mt-0.5">{subtext}</p>}
                </div>
                <div className="w-8 h-8 rounded-lg bg-stone flex items-center justify-center">
                    <Icon size={16} className="text-ink" />
                </div>
            </div>
        </motion.div>
    );
}

function WeekChart({ data }) {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const maxValue = Math.max(...data, 1);

    return (
        <div className="flex items-end justify-between gap-1.5 h-20 px-1">
            {data.map((value, i) => {
                const height = (value / maxValue) * 100;
                const isToday = i === new Date().getDay();
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <motion.div
                            className={`w-full rounded-t-md ${isToday ? 'bg-ink' : 'bg-stone'}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 4)}%` }}
                            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                        />
                        <span className={`text-[10px] ${isToday ? 'text-ink font-medium' : 'text-stone-dark'}`}>{days[i]}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Stats storage key
const STATS_KEY = 'focus_stats';

// Get default stats structure
function getDefaultStats() {
    return {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sessionsStarted: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
        lastSessionDate: null,
        history: [], // Array of { id, type, duration, timestamp, completed }
    };
}

export function FocusStats() {
    const [stats, setStats] = useState(() => {
        const stored = getStorageItem(STATS_KEY, null);
        return { ...getDefaultStats(), ...stored };
    });
    const [showHistory, setShowHistory] = useState(false);

    // Listen for storage changes (real-time updates)
    useEffect(() => {
        const handleStorageChange = () => {
            const stored = getStorageItem(STATS_KEY, null);
            if (stored) setStats({ ...getDefaultStats(), ...stored });
        };

        window.addEventListener('storage', handleStorageChange);
        // Also poll every 2 seconds for same-tab updates
        const interval = setInterval(handleStorageChange, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    const todayFocusTime = stats.weeklyData[new Date().getDay()] || 0;
    const avgSessionTime = stats.sessionsCompleted > 0
        ? Math.round(stats.totalFocusTime / stats.sessionsCompleted / 60)
        : 0;
    const completionRate = stats.sessionsStarted > 0
        ? Math.round((stats.sessionsCompleted / stats.sessionsStarted) * 100)
        : 0;

    // Get today's history
    const todayHistory = stats.history?.filter(h => h.timestamp?.startsWith(getTodayKey())) || [];
    const recentHistory = stats.history?.slice(0, 20) || [];

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-medium text-ink">Focus Stats</h2>
                    <p className="text-xs text-stone-dark">Real-time tracking</p>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg ${showHistory ? 'bg-ink text-paper' : 'bg-stone text-ink'}`}
                >
                    <History size={16} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={Clock} label="Today" value={formatDuration(todayFocusTime * 60)} subtext="focus time" />
                <StatCard icon={Target} label="Completed" value={stats.sessionsCompleted} subtext={`of ${stats.sessionsStarted} started`} />
                <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} subtext={`Best: ${stats.longestStreak}d`} />
                <StatCard icon={TrendingUp} label="Avg Session" value={`${avgSessionTime}m`} subtext={`${completionRate}% completion`} />
            </div>

            {/* Session History */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="bg-paper rounded-2xl p-4 shadow-clay-soft">
                            <h3 className="text-sm font-medium text-ink mb-3">Session History</h3>

                            {recentHistory.length === 0 ? (
                                <p className="text-xs text-stone-dark text-center py-4">No sessions yet</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {recentHistory.map((session, i) => (
                                        <div key={session.id || i} className="flex items-center gap-3 py-2 border-b border-stone last:border-0">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${session.completed ? 'bg-green-100' : 'bg-stone'}`}>
                                                {session.completed ? (
                                                    <CheckCircle size={12} className="text-green-600" />
                                                ) : (
                                                    <Play size={10} className="text-stone-dark" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-ink">
                                                    {session.completed ? 'Completed' : 'Started'} • {Math.round(session.duration / 60)}m
                                                </p>
                                                <p className="text-[10px] text-stone-dark">
                                                    {formatDate(session.timestamp)} at {formatTime(session.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Weekly Chart */}
            <div className="bg-paper rounded-2xl p-4 shadow-clay-soft">
                <h3 className="text-xs font-medium text-ink mb-3">This Week</h3>
                <WeekChart data={stats.weeklyData} />
                <div className="flex justify-between mt-2 text-[10px] text-stone-dark">
                    <span>Total: {formatDuration(stats.weeklyData.reduce((a, b) => a + b, 0) * 60)}</span>
                    <span>{stats.weeklyData.filter(d => d > 0).length} active days</span>
                </div>
            </div>

            {/* Total */}
            <div className="mt-4 text-center py-4 border-t border-stone">
                <p className="text-2xl font-light text-ink">{formatDuration(stats.totalFocusTime)}</p>
                <p className="text-xs text-stone-dark">total focus time</p>
            </div>

            {/* Today's Activity */}
            {todayHistory.length > 0 && (
                <div className="mt-4 p-3 bg-stone rounded-xl">
                    <p className="text-xs font-medium text-ink mb-2">Today's Activity</p>
                    <div className="flex items-center gap-4 text-xs text-stone-dark">
                        <span><Play size={10} className="inline mr-1" />{todayHistory.length} started</span>
                        <span><CheckCircle size={10} className="inline mr-1" />{todayHistory.filter(h => h.completed).length} completed</span>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Hook to record when timer starts
 */
export function useRecordStart() {
    return useCallback((durationSeconds) => {
        const stored = getStorageItem(STATS_KEY, null) || getDefaultStats();

        const newHistory = [
            {
                id: Date.now().toString(36),
                type: 'start',
                duration: durationSeconds,
                timestamp: new Date().toISOString(),
                completed: false,
            },
            ...(stored.history || []).slice(0, 99), // Keep last 100
        ];

        const newStats = {
            ...stored,
            sessionsStarted: (stored.sessionsStarted || 0) + 1,
            history: newHistory,
        };

        setStorageItem(STATS_KEY, newStats);
        return newStats;
    }, []);
}

/**
 * Hook to record completed session
 */
export function useRecordSession() {
    return useCallback((durationSeconds) => {
        const stored = getStorageItem(STATS_KEY, null) || getDefaultStats();

        const today = getTodayKey();
        const todayDayIndex = new Date().getDay();
        const durationMinutes = Math.round(durationSeconds / 60);

        const newWeeklyData = [...(stored.weeklyData || [0, 0, 0, 0, 0, 0, 0])];
        newWeeklyData[todayDayIndex] = (newWeeklyData[todayDayIndex] || 0) + durationMinutes;

        let newStreak = stored.currentStreak || 0;
        if (stored.lastSessionDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];
            if (stored.lastSessionDate === yesterdayKey) {
                newStreak = (stored.currentStreak || 0) + 1;
            } else {
                newStreak = 1;
            }
        }

        // Add to history
        const newHistory = [
            {
                id: Date.now().toString(36),
                type: 'complete',
                duration: durationSeconds,
                timestamp: new Date().toISOString(),
                completed: true,
            },
            ...(stored.history || []).slice(0, 99),
        ];

        const newStats = {
            ...stored,
            totalFocusTime: (stored.totalFocusTime || 0) + durationSeconds,
            sessionsCompleted: (stored.sessionsCompleted || 0) + 1,
            currentStreak: newStreak,
            longestStreak: Math.max(stored.longestStreak || 0, newStreak),
            weeklyData: newWeeklyData,
            lastSessionDate: today,
            history: newHistory,
        };

        setStorageItem(STATS_KEY, newStats);
        return newStats;
    }, []);
}
