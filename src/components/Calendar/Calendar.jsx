import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storage';

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get days in month
 */
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get day of week for first day of month (0 = Sunday)
 */
function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

/**
 * Format date key for storage
 */
function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Validate event object
 */
function sanitizeEvent(event) {
    if (!event || typeof event !== 'object') return null;
    return {
        id: typeof event.id === 'string' ? event.id : generateId(),
        title: typeof event.title === 'string' ? event.title.slice(0, 100) : '',
        time: typeof event.time === 'string' ? event.time : '',
        date: typeof event.date === 'string' ? event.date : '',
    };
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calendar Component - Meeting/Event tracker
 */
export function Calendar() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState(() => {
        const stored = getStorageItem('calendar_events', {});
        return typeof stored === 'object' ? stored : {};
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', time: '' });

    // Save events to storage
    useEffect(() => {
        setStorageItem('calendar_events', events);
    }, [events]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const handleDateClick = (day) => {
        const dateKey = formatDateKey(currentYear, currentMonth, day);
        setSelectedDate(dateKey);
        setShowAddForm(false);
    };

    const addEvent = useCallback(() => {
        if (!newEvent.title.trim() || !selectedDate) return;

        const event = sanitizeEvent({
            id: generateId(),
            title: newEvent.title.trim(),
            time: newEvent.time,
            date: selectedDate,
        });

        if (event) {
            setEvents(prev => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), event],
            }));
            setNewEvent({ title: '', time: '' });
            setShowAddForm(false);
        }
    }, [newEvent, selectedDate]);

    const deleteEvent = useCallback((dateKey, eventId) => {
        setEvents(prev => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).filter(e => e.id !== eventId),
        }));
    }, []);

    const getEventsForDate = (dateKey) => events[dateKey] || [];

    const isToday = (day) => {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    // Generate calendar grid
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    return (
        <div className="w-full max-w-md mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-ink">Calendar</h2>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={prevMonth}
                    className="p-2 rounded-full hover:bg-stone transition-colors"
                >
                    <ChevronLeft size={20} className="text-ink" />
                </button>
                <h3 className="text-lg font-medium text-ink">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-full hover:bg-stone transition-colors"
                >
                    <ChevronRight size={20} className="text-ink" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map(day => (
                    <div key={day} className="text-center text-xs text-stone-dark py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-6">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const dayEvents = getEventsForDate(dateKey);
                    const hasEvents = dayEvents.length > 0;
                    const isSelected = selectedDate === dateKey;

                    return (
                        <motion.button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${isToday(day)
                                    ? 'bg-ink text-paper'
                                    : isSelected
                                        ? 'bg-stone-dark text-ink'
                                        : 'hover:bg-stone text-ink'
                                }`}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-sm font-medium">{day}</span>
                            {hasEvents && (
                                <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday(day) ? 'bg-paper' : 'bg-ink'
                                    }`} />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Date Events */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-paper rounded-2xl p-4 shadow-clay-soft"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-ink">
                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </h4>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Add Event Form */}
                        <AnimatePresence>
                            {showAddForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 overflow-hidden"
                                >
                                    <div className="space-y-3 p-3 bg-stone rounded-xl">
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value.slice(0, 100) }))}
                                            placeholder="Meeting title..."
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-ink placeholder-stone-dark outline-none"
                                            maxLength={100}
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center gap-2 bg-paper rounded-lg px-3 py-2">
                                                <Clock size={16} className="text-stone-dark" />
                                                <input
                                                    type="time"
                                                    value={newEvent.time}
                                                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                                                    className="flex-1 bg-transparent text-ink outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={addEvent}
                                                disabled={!newEvent.title.trim()}
                                                className="px-4 py-2 bg-ink text-paper rounded-lg disabled:opacity-30"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Events List */}
                        <div className="space-y-2">
                            {getEventsForDate(selectedDate).length === 0 ? (
                                <p className="text-sm text-stone-dark text-center py-4">
                                    No meetings scheduled
                                </p>
                            ) : (
                                getEventsForDate(selectedDate).map(event => (
                                    <motion.div
                                        key={event.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-between p-3 bg-stone rounded-xl"
                                    >
                                        <div>
                                            <p className="font-medium text-ink">{event.title}</p>
                                            {event.time && (
                                                <p className="text-sm text-stone-dark flex items-center gap-1 mt-1">
                                                    <Clock size={12} />
                                                    {event.time}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteEvent(selectedDate, event.id)}
                                            className="p-2 text-stone-dark hover:text-ink transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upcoming Events */}
            {!selectedDate && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-stone-dark">Upcoming</h4>
                    {Object.entries(events)
                        .filter(([date]) => new Date(date) >= new Date(formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())))
                        .sort(([a], [b]) => new Date(a) - new Date(b))
                        .slice(0, 5)
                        .flatMap(([date, dateEvents]) =>
                            dateEvents.map(event => (
                                <div key={event.id} className="flex items-center gap-3 p-3 bg-paper rounded-xl shadow-clay-soft">
                                    <div className="w-12 h-12 bg-stone rounded-xl flex flex-col items-center justify-center">
                                        <span className="text-xs text-stone-dark">
                                            {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-medium text-ink">
                                            {new Date(date).getDate()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-ink">{event.title}</p>
                                        {event.time && (
                                            <p className="text-sm text-stone-dark">{event.time}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    {Object.keys(events).length === 0 && (
                        <p className="text-sm text-stone-dark text-center py-8">
                            Tap a date to add meetings
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
