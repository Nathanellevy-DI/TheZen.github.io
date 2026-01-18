import { motion } from 'framer-motion';
import { Clock, CheckSquare, BarChart2, Wind } from 'lucide-react';

/**
 * BottomNav - Gesture-friendly bottom navigation with iOS safe area
 */
export function BottomNav({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'timer', icon: Clock, label: 'Focus' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'stats', icon: BarChart2, label: 'Stats' },
        { id: 'breathe', icon: Wind, label: 'Breathe' },
    ];

    return (
        <nav className="flex-shrink-0 bg-paper/90 backdrop-blur-lg border-t border-stone/30">
            <div className="flex items-center justify-around max-w-md mx-auto py-2 px-safe">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center gap-1 py-2 px-4 min-w-[64px]"
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    className="absolute inset-x-2 top-0 h-0.5 bg-ink rounded-full"
                                    layoutId="activeTab"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}

                            <motion.div
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    y: isActive ? -2 : 0,
                                }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <Icon
                                    size={22}
                                    className={`transition-colors ${isActive ? 'text-ink' : 'text-stone-dark'
                                        }`}
                                />
                            </motion.div>

                            <span className={`text-xs transition-colors ${isActive ? 'text-ink font-medium' : 'text-stone-dark'
                                }`}>
                                {tab.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
            {/* Safe area spacer for iOS home indicator */}
            <div className="pb-safe" />
        </nav>
    );
}
