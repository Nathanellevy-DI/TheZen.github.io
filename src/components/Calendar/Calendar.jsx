import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Video, ExternalLink, Tag } from 'lucide-react';
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

// Predefined color palette - distinct, visually pleasing colors
const COLOR_PALETTE = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
];

const LOCATION_TYPES = [
    { id: 'zoom', label: 'Zoom', icon: Video },
    { id: 'google-meet', label: 'Meet', icon: Video },
    { id: 'in-person', label: 'In Person', icon: MapPin },
];

const EVENT_TYPES = [
    { id: 'meeting', label: 'Meeting' },
    { id: 'important-date', label: 'Important Date' },
];

// Default categories
const DEFAULT_CATEGORIES = [
    { id: 'meeting', name: 'Meeting', color: '#3B82F6' },
    { id: 'important', name: 'Important', color: '#EF4444' },
    { id: 'personal', name: 'Personal', color: '#10B981' },
];

function getNextColor(usedColors) {
    for (const color of COLOR_PALETTE) {
        if (!usedColors.includes(color)) return color;
    }
    // If all colors used, generate a random one
    return `hsl(${Math.random() * 360}, 70%, 50%)`;
}

export function Calendar() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState(() => getStorageItem('calendar_events', {}));
    const [categories, setCategories] = useState(() => {
        const stored = getStorageItem('calendar_categories', null);
        return stored || DEFAULT_CATEGORIES;
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [eventType, setEventType] = useState('meeting');
    const [newEvent, setNewEvent] = useState({
        title: '',
        time: '',
        notes: '',
        locationType: 'zoom',
        locationDetail: '',
        categoryId: 'meeting',
    });

    useEffect(() => { setStorageItem('calendar_events', events); }, [events]);
    useEffect(() => { setStorageItem('calendar_categories', categories); }, [categories]);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else { setCurrentMonth(m => m - 1); }
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else { setCurrentMonth(m => m + 1); }
    };

    const handleDateClick = (day) => {
        setSelectedDate(formatDateKey(currentYear, currentMonth, day));
        setShowAddForm(false);
    };

    const resetForm = () => {
        setNewEvent({ title: '', time: '', notes: '', locationType: 'zoom', locationDetail: '', categoryId: 'meeting' });
        setEventType('meeting');
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) return;
        const usedColors = categories.map(c => c.color);
        const newCat = {
            id: generateId(),
            name: newCategoryName.trim().slice(0, 30),
            color: getNextColor(usedColors),
        };
        setCategories(prev => [...prev, newCat]);
        setNewCategoryName('');
        setShowCategoryForm(false);
    };

    const deleteCategory = (catId) => {
        if (categories.length <= 1) return;
        setCategories(prev => prev.filter(c => c.id !== catId));
    };

    const addEvent = useCallback(() => {
        if (!newEvent.title.trim() || !selectedDate) return;

        const event = {
            id: generateId(),
            title: newEvent.title.trim().slice(0, 100),
            date: selectedDate,
            categoryId: newEvent.categoryId,
            type: eventType,
            ...(eventType === 'meeting' && {
                time: newEvent.time,
                notes: newEvent.notes.trim().slice(0, 500),
                locationType: newEvent.locationType,
                locationDetail: newEvent.locationDetail.trim().slice(0, 200),
            }),
            ...(eventType === 'important-date' && {
                notes: newEvent.notes.trim().slice(0, 500),
            }),
        };

        setEvents(prev => ({
            ...prev,
            [selectedDate]: [...(prev[selectedDate] || []), event],
        }));
        resetForm();
        setShowAddForm(false);
    }, [newEvent, selectedDate, eventType]);

    const deleteEvent = (dateKey, eventId) => {
        setEvents(prev => ({
            ...prev,
            [dateKey]: (prev[dateKey] || []).filter(e => e.id !== eventId),
        }));
    };

    const getEventsForDate = (dateKey) => events[dateKey] || [];
    const getCategoryById = (id) => categories.find(c => c.id === id) || categories[0];
    const isToday = (day) => day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-ink">Calendar</h2>
                <button
                    onClick={() => setShowCategoryForm(true)}
                    className="text-xs text-stone-dark flex items-center gap-1"
                >
                    <Tag size={12} /> Categories
                </button>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-1 text-xs text-ink-soft">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                    </div>
                ))}
            </div>

            {/* Category Manager */}
            <AnimatePresence>
                {showCategoryForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="p-3 bg-stone rounded-xl space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value.slice(0, 30))}
                                    placeholder="New category name"
                                    className="flex-1 bg-paper rounded-lg px-3 py-2 text-sm text-ink outline-none"
                                />
                                <button onClick={addCategory} className="px-3 py-2 bg-ink text-paper rounded-lg text-sm">
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center gap-1 bg-paper rounded-lg px-2 py-1 text-xs">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                        {categories.length > 1 && (
                                            <button onClick={() => deleteCategory(cat.id)} className="ml-1 text-stone-dark">
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowCategoryForm(false)} className="text-xs text-stone-dark">
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-2"><ChevronLeft size={18} className="text-ink" /></button>
                <span className="text-sm font-medium text-ink">{MONTH_NAMES[currentMonth]} {currentYear}</span>
                <button onClick={nextMonth} className="p-2"><ChevronRight size={18} className="text-ink" /></button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d, i) => <div key={i} className="text-center text-xs text-stone-dark">{d}</div>)}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
                {calendarDays.map((day, idx) => {
                    if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;

                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const dayEvents = getEventsForDate(dateKey);
                    const isSelected = selectedDate === dateKey;

                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${isToday(day) ? 'bg-ink text-paper' : isSelected ? 'bg-stone-dark text-ink' : 'hover:bg-stone text-ink'
                                }`}
                        >
                            {day}
                            {dayEvents.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {dayEvents.slice(0, 3).map((ev, i) => (
                                        <div
                                            key={i}
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: isToday(day) ? '#F4F4F4' : getCategoryById(ev.categoryId)?.color || '#3B82F6' }}
                                        />
                                    ))}
                                </div>
                            )}
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
                            <button onClick={() => setShowAddForm(true)} className="w-7 h-7 rounded-full bg-ink text-paper flex items-center justify-center">
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Add Form */}
                        <AnimatePresence>
                            {showAddForm && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                                    <div className="space-y-2 p-3 bg-stone rounded-xl">
                                        {/* Event Type Toggle */}
                                        <div className="flex gap-2 mb-2">
                                            {EVENT_TYPES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setEventType(t.id)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${eventType === t.id ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Title */}
                                        <input
                                            type="text"
                                            value={newEvent.title}
                                            onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                                            placeholder={eventType === 'meeting' ? 'Meeting title' : 'Event name'}
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-sm text-ink outline-none"
                                        />

                                        {/* Category */}
                                        <select
                                            value={newEvent.categoryId}
                                            onChange={(e) => setNewEvent(p => ({ ...p, categoryId: e.target.value }))}
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-sm text-ink outline-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>

                                        {eventType === 'meeting' && (
                                            <>
                                                {/* Time */}
                                                <div className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2">
                                                    <Clock size={14} className="text-stone-dark" />
                                                    <input type="time" value={newEvent.time} onChange={(e) => setNewEvent(p => ({ ...p, time: e.target.value }))} className="flex-1 bg-transparent text-sm text-ink outline-none" />
                                                </div>

                                                {/* Location Type */}
                                                <div className="flex gap-1">
                                                    {LOCATION_TYPES.map(loc => (
                                                        <button key={loc.id} onClick={() => setNewEvent(p => ({ ...p, locationType: loc.id }))} className={`flex-1 py-1.5 rounded-lg text-xs ${newEvent.locationType === loc.id ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}>
                                                            {loc.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Location Detail */}
                                                <div className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2">
                                                    {newEvent.locationType === 'in-person' ? <MapPin size={14} className="text-stone-dark" /> : <ExternalLink size={14} className="text-stone-dark" />}
                                                    <input
                                                        type="text"
                                                        value={newEvent.locationDetail}
                                                        onChange={(e) => setNewEvent(p => ({ ...p, locationDetail: e.target.value }))}
                                                        placeholder={newEvent.locationType === 'in-person' ? 'Address' : 'Meeting link'}
                                                        className="flex-1 bg-transparent text-sm text-ink outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* Notes */}
                                        <textarea
                                            value={newEvent.notes}
                                            onChange={(e) => setNewEvent(p => ({ ...p, notes: e.target.value }))}
                                            placeholder="Notes"
                                            rows={2}
                                            className="w-full bg-paper rounded-lg px-3 py-2 text-sm text-ink outline-none resize-none"
                                        />

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button onClick={() => { resetForm(); setShowAddForm(false); }} className="flex-1 py-2 text-xs text-stone-dark">Cancel</button>
                                            <button onClick={addEvent} disabled={!newEvent.title.trim()} className="flex-1 py-2 bg-ink text-paper rounded-lg text-xs disabled:opacity-30">Add</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Events List */}
                        <div className="space-y-2">
                            {getEventsForDate(selectedDate).length === 0 && !showAddForm ? (
                                <p className="text-xs text-stone-dark text-center py-4">No events</p>
                            ) : (
                                getEventsForDate(selectedDate).map(event => {
                                    const cat = getCategoryById(event.categoryId);
                                    return (
                                        <div key={event.id} className="p-3 bg-stone rounded-xl">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }} />
                                                        <p className="font-medium text-ink text-sm">{event.title}</p>
                                                    </div>
                                                    {event.time && <p className="text-xs text-stone-dark mt-1"><Clock size={10} className="inline mr-1" />{event.time}</p>}
                                                    {event.locationType && (
                                                        <p className="text-xs text-stone-dark mt-1">
                                                            {event.locationType === 'in-person' ? <MapPin size={10} className="inline mr-1" /> : <Video size={10} className="inline mr-1" />}
                                                            {event.locationDetail && (event.locationType === 'in-person' ? event.locationDetail : <a href={event.locationDetail} target="_blank" rel="noopener" className="underline">Join</a>)}
                                                        </p>
                                                    )}
                                                    {event.notes && <p className="text-xs text-ink-soft mt-2">{event.notes}</p>}
                                                </div>
                                                <button onClick={() => deleteEvent(selectedDate, event.id)} className="p-1 text-stone-dark"><X size={12} /></button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
