import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Video, ExternalLink } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storage';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const LOCATION_TYPES = [
    { id: 'zoom', label: 'Zoom', icon: Video },
    { id: 'google-meet', label: 'Google Meet', icon: Video },
    { id: 'in-person', label: 'In Person', icon: MapPin },
];

function sanitizeEvent(event) {
    if (!event || typeof event !== 'object') return null;
    return {
        id: typeof event.id === 'string' ? event.id : generateId(),
        title: typeof event.title === 'string' ? event.title.slice(0, 100) : '',
        time: typeof event.time === 'string' ? event.time : '',
        date: typeof event.date === 'string' ? event.date : '',
        notes: typeof event.notes === 'string' ? event.notes.slice(0, 500) : '',
        locationType: LOCATION_TYPES.some(l => l.id === event.locationType) ? event.locationType : 'zoom',
        locationDetail: typeof event.locationDetail === 'string' ? event.locationDetail.slice(0, 200) : '',
    };
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    const [newEvent, setNewEvent] = useState({
        title: '',
        time: '',
        notes: '',
        locationType: 'zoom',
        locationDetail: '',
    });

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

    const resetForm = () => {
        setNewEvent({
            title: '',
            time: '',
            notes: '',
            locationType: 'zoom',
            locationDetail: '',
        });
    };

    const addEvent = useCallback(() => {
        if (!newEvent.title.trim() || !selectedDate) return;

        const event = sanitizeEvent({
            id: generateId(),
            title: newEvent.title.trim(),
            time: newEvent.time,
            date: selectedDate,
            notes: newEvent.notes.trim(),
            locationType: newEvent.locationType,
            locationDetail: newEvent.locationDetail.trim(),
        });

        if (event) {
            setEvents(prev => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), event],
            }));
            resetForm();
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
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

    const getLocationLabel = (type) => LOCATION_TYPES.find(l => l.id === type)?.label || type;

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-ink">Calendar</h2>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-full hover:bg-stone">
                    <ChevronLeft size={20} className="text-ink" />
                </button>
                <h3 className="text-base font-medium text-ink">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-stone">
                    <ChevronRight size={20} className="text-ink" />
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((day, i) => (
                    <div key={i} className="text-center text-xs text-stone-dark py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
                {calendarDays.map((day, index) => {
                    if (day === null) return <div key={`e-${index}`} className="aspect-square" />;

                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const hasEvents = getEventsForDate(dateKey).length > 0;
                    const isSelected = selectedDate === dateKey;

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${isToday(day) ? 'bg-ink text-paper' : isSelected ? 'bg-stone-dark text-ink' : 'hover:bg-stone text-ink'
                                }`}
                        >
                            {day}
                            {hasEvents && <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday(day) ? 'bg-paper' : 'bg-ink'}`} />}
                        </button>
                    );
                })}
            </div>

            {/* Selected Date Events */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-paper rounded-2xl p-4 shadow-clay-soft"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-ink text-sm">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
                                        {/* Title */}
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value.slice(0, 100) }))}
                                            placeholder="Meeting title"
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-ink placeholder-stone-dark outline-none text-sm"
                                        />

                                        {/* Time */}
                                        <div className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2">
                                            <Clock size={16} className="text-stone-dark" />
                                            <input
                                                type="time"
                                                value={newEvent.time}
                                                onChange={(e) => setNewEvent(p => ({ ...p, time: e.target.value }))}
                                                className="flex-1 bg-transparent text-ink outline-none text-sm"
                                            />
                                        </div>

                                        {/* Location Type */}
                                        <div className="flex gap-2">
                                            {LOCATION_TYPES.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    type="button"
                                                    onClick={() => setNewEvent(p => ({ ...p, locationType: loc.id }))}
                                                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${newEvent.locationType === loc.id
                                                            ? 'bg-ink text-paper'
                                                            : 'bg-paper text-ink'
                                                        }`}
                                                >
                                                    {loc.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Location Detail (Link or Address) */}
                                        <div className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2">
                                            {newEvent.locationType === 'in-person' ? (
                                                <MapPin size={16} className="text-stone-dark flex-shrink-0" />
                                            ) : (
                                                <ExternalLink size={16} className="text-stone-dark flex-shrink-0" />
                                            )}
                                            <input
                                                type={newEvent.locationType === 'in-person' ? 'text' : 'url'}
                                                value={newEvent.locationDetail}
                                                onChange={(e) => setNewEvent(p => ({ ...p, locationDetail: e.target.value.slice(0, 200) }))}
                                                placeholder={newEvent.locationType === 'in-person' ? 'Address or location name' : 'Meeting link'}
                                                className="flex-1 bg-transparent text-ink placeholder-stone-dark outline-none text-sm"
                                            />
                                        </div>

                                        {/* Notes */}
                                        <textarea
                                            value={newEvent.notes}
                                            onChange={(e) => setNewEvent(p => ({ ...p, notes: e.target.value.slice(0, 500) }))}
                                            placeholder="Notes (optional)"
                                            rows={2}
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-ink placeholder-stone-dark outline-none text-sm resize-none"
                                        />

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { resetForm(); setShowAddForm(false); }}
                                                className="flex-1 py-2 text-sm text-stone-dark"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={addEvent}
                                                disabled={!newEvent.title.trim()}
                                                className="flex-1 py-2 bg-ink text-paper rounded-lg text-sm disabled:opacity-30"
                                            >
                                                Add Meeting
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Events List */}
                        <div className="space-y-2">
                            {getEventsForDate(selectedDate).length === 0 && !showAddForm ? (
                                <p className="text-sm text-stone-dark text-center py-4">No meetings</p>
                            ) : (
                                getEventsForDate(selectedDate).map(event => (
                                    <div key={event.id} className="p-3 bg-stone rounded-xl">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-ink text-sm">{event.title}</p>
                                                {event.time && (
                                                    <p className="text-xs text-stone-dark flex items-center gap-1 mt-1">
                                                        <Clock size={10} /> {event.time}
                                                    </p>
                                                )}
                                                <p className="text-xs text-stone-dark flex items-center gap-1 mt-1">
                                                    {event.locationType === 'in-person' ? <MapPin size={10} /> : <Video size={10} />}
                                                    {getLocationLabel(event.locationType)}
                                                    {event.locationDetail && (
                                                        event.locationType === 'in-person' ? (
                                                            <span className="ml-1 truncate max-w-[120px]">• {event.locationDetail}</span>
                                                        ) : (
                                                            <a href={event.locationDetail} target="_blank" rel="noopener noreferrer" className="ml-1 underline">
                                                                Join
                                                            </a>
                                                        )
                                                    )}
                                                </p>
                                                {event.notes && (
                                                    <p className="text-xs text-ink-soft mt-2 whitespace-pre-wrap">{event.notes}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => deleteEvent(selectedDate, event.id)}
                                                className="p-1 text-stone-dark hover:text-ink"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
