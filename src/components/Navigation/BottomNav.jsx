import { motion } from 'framer-motion';
import { Clock, CheckSquare, CalendarDays, BarChart2, Wind, StickyNote } from 'lucide-react';

/**
 * BottomNav - Centered on all screen sizes including iPad
 */
export function BottomNav({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'timer', icon: Clock, label: 'Focus' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'notes', icon: StickyNote, label: 'Notes' },
        { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
        { id: 'stats', icon: BarChart2, label: 'Stats' },
        { id: 'breathe', icon: Wind, label: 'Breathe' },
    ];

    return (
        <nav className="flex-shrink-0 bg-paper/90 backdrop-blur-lg border-t border-stone/30 w-full">
            {/* Centered container with max-width */}
            <div className="w-full flex justify-center">
                <div className="flex items-center justify-around w-full max-w-md py-2 px-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;

                        return (
                            <motion.button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[50px]"
                                whileTap={{ scale: 0.95 }}
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute inset-x-1 top-0 h-0.5 bg-ink rounded-full"
                                        layoutId="activeTab"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}

                                <motion.div
                                    animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    <Icon size={20} className={`transition-colors ${isActive ? 'text-ink' : 'text-stone-dark'}`} />
                                </motion.div>

                                <span className={`text-[10px] transition-colors ${isActive ? 'text-ink font-medium' : 'text-stone-dark'}`}>
                                    {tab.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
            {/* Safe area spacer */}
            <div className="pb-safe" />
        </nav>
    );
}
