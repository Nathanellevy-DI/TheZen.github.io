import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { getStorageItem, setStorageItem, validateTimerSettings } from '../../utils/storage';

/**
 * Settings Overlay Component
 * Blurred overlay revealed on long-press
 */
export function SettingsOverlay({ isOpen, onClose, settings, onSettingsChange }) {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSettingChange = (key, value) => {
        const newSettings = { ...localSettings, [key]: value };
        const validated = validateTimerSettings(newSettings);
        setLocalSettings(validated);
        onSettingsChange(validated);
        setStorageItem('settings', validated);
    };

    const durations = [5, 10, 15, 20, 25, 30, 45, 60];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 glass-overlay z-40"
                        onClick={onClose}
                    />

                    {/* Settings Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-paper rounded-3xl p-6 shadow-clay">
                            {/* Header */}
                            <h2 className="text-lg font-medium text-ink mb-6 text-center">
                                Settings
                            </h2>

                            {/* Sound Toggle */}
                            <div className="flex items-center justify-between py-4 border-b border-stone">
                                <span className="text-ink-soft">Sound</span>
                                <button
                                    onClick={() => handleSettingChange('soundEnabled', !localSettings.soundEnabled)}
                                    className={`w-12 h-7 rounded-full transition-all duration-300 ${localSettings.soundEnabled
                                            ? 'bg-ink'
                                            : 'bg-stone'
                                        }`}
                                >
                                    <motion.div
                                        className="w-5 h-5 bg-paper rounded-full shadow-clay-soft"
                                        animate={{
                                            x: localSettings.soundEnabled ? 24 : 4
                                        }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                </button>
                            </div>

                            {/* Default Duration */}
                            <div className="py-4">
                                <span className="text-ink-soft block mb-3">Default Duration</span>
                                <div className="flex flex-wrap gap-2">
                                    {durations.map((dur) => (
                                        <button
                                            key={dur}
                                            onClick={() => handleSettingChange('defaultDuration', dur)}
                                            className={`px-3 py-2 rounded-xl text-sm transition-all duration-200 ${localSettings.defaultDuration === dur
                                                    ? 'bg-ink text-paper shadow-lg'
                                                    : 'bg-stone text-ink hover:bg-stone-dark'
                                                }`}
                                        >
                                            {dur}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Close hint */}
                            <p className="text-xs text-stone-dark text-center mt-6">
                                Tap outside to close
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
