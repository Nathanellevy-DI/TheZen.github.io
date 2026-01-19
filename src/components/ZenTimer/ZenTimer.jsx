import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TimerCircle } from './TimerCircle';
import { DropZone } from './DropZone';
import { SettingsOverlay } from '../Settings/SettingsOverlay';
import { useTimerState } from '../../hooks/useTimerState';
import { getStorageItem, setStorageItem, validateTimerSettings } from '../../utils/storage';
import { notifyTimerComplete, requestNotificationPermission } from '../../utils/notifications';

/**
 * Quick preset durations in minutes
 */
const PRESETS = [5, 15, 25, 45, 60];

/**
 * ZenTimer - Main orchestrator component
 * Fully responsive with proper spacing
 */
export function ZenTimer({ onSessionComplete, onSessionStart }) {
    // Load settings from storage
    const [settings, setSettings] = useState(() => {
        const stored = getStorageItem('settings', null);
        return validateTimerSettings(stored);
    });

    // Timer state machine
    const { state, actions } = useTimerState(settings.defaultDuration);

    // Drop zone visibility
    const [showDropZone, setShowDropZone] = useState(false);
    const [dropZoneHovered, setDropZoneHovered] = useState(false);

    // Timer interval ref
    const timerIntervalRef = useRef(null);

    // Handle duration change from radial drag
    const handleDurationChange = useCallback((minutes) => {
        actions.setDuration(minutes);
    }, [actions]);

    // Handle preset selection
    const handlePresetSelect = useCallback((minutes) => {
        actions.setDuration(minutes);
    }, [actions]);

    // Handle drag start
    const handleDragStart = useCallback(() => {
        actions.startAdjust();
        setShowDropZone(true);
    }, [actions]);

    // Handle drag end
    const handleDragEnd = useCallback((inDropZone) => {
        if (inDropZone) {
            actions.commit();
            setShowDropZone(false);
            setDropZoneHovered(false);
        } else {
            actions.endAdjust();
            setShowDropZone(false);
            setDropZoneHovered(false);
        }
    }, [actions]);

    // Handle enter/exit drop zone
    const handleEnterDropZone = useCallback(() => {
        actions.enterDropZone();
        setDropZoneHovered(true);
    }, [actions]);

    const handleExitDropZone = useCallback(() => {
        actions.exitDropZone();
        setDropZoneHovered(false);
    }, [actions]);

    // Handle flick cancel
    const handleFlickCancel = useCallback(() => {
        actions.cancel();
    }, [actions]);

    // Handle long press for settings
    const handleLongPress = useCallback(() => {
        if (state.status === 'idle') {
            actions.openSettings();
        }
    }, [state.status, actions]);

    // Handle tap for pause/resume/start
    const handleTap = useCallback(() => {
        if (state.status === 'idle') {
            // Quick tap to start in idle mode
            if (onSessionStart) {
                onSessionStart(state.duration);
            }
            actions.commit();
        } else if (state.status === 'running') {
            actions.pause();
        } else if (state.status === 'paused') {
            actions.resume();
        } else if (state.status === 'completed') {
            actions.acknowledgeComplete();
        }
    }, [state.status, state.duration, actions, onSessionStart]);

    // Handle settings change
    const handleSettingsChange = useCallback((newSettings) => {
        setSettings(newSettings);
    }, []);

    // Timer tick effect
    useEffect(() => {
        if (state.status === 'running') {
            timerIntervalRef.current = setInterval(() => {
                actions.tick();
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [state.status, actions]);

    // Completion effect (sound/notification)
    useEffect(() => {
        if (state.status === 'completed') {
            // Record session
            if (onSessionComplete) {
                onSessionComplete(state.duration);
            }

            // Show notification
            const durationMinutes = Math.round(state.duration / 60);
            notifyTimerComplete(durationMinutes);

            if (settings.soundEnabled) {
                // Play a subtle completion tone using Web Audio API
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 440; // A4 note
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 1);
                } catch (e) {
                    // Audio not supported, fail silently
                }
            }
        }
    }, [state.status, state.duration, settings.soundEnabled, onSessionComplete]);

    // Request notification permission when timer starts
    useEffect(() => {
        if (state.status === 'running') {
            requestNotificationPermission();
        }
    }, [state.status]);

    const currentMinutes = Math.round(state.duration / 60);
    const showPresets = state.status === 'idle';

    return (
        <div className="relative w-full max-w-md mx-auto flex flex-col items-center py-8">
            {/* Subtle background pattern */}
            <div
                className="fixed inset-0 opacity-30 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #E0E0E0 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Drop Zone */}
            <DropZone isActive={showDropZone} isHovered={dropZoneHovered} />

            {/* Preset buttons - shown in idle mode */}
            <AnimatePresence>
                {showPresets && (
                    <motion.div
                        className="flex flex-wrap justify-center gap-2 mb-8 px-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {PRESETS.map((mins) => (
                            <motion.button
                                key={mins}
                                onClick={() => handlePresetSelect(mins)}
                                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${currentMinutes === mins
                                    ? 'bg-ink text-paper shadow-lg'
                                    : 'bg-paper shadow-clay-soft text-ink hover:shadow-clay'
                                    }`}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                {mins}m
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Timer Circle */}
            <div className="relative z-10">
                <TimerCircle
                    duration={state.duration}
                    remaining={state.remaining}
                    status={state.status}
                    onDurationChange={handleDurationChange}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onEnterDropZone={handleEnterDropZone}
                    onExitDropZone={handleExitDropZone}
                    onFlickCancel={handleFlickCancel}
                    onLongPress={handleLongPress}
                    onTap={handleTap}
                />
            </div>

            {/* Status indicator */}
            <AnimatePresence>
                {state.status === 'idle' && (
                    <motion.div
                        className="mt-8 text-sm text-ink-soft text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 0.6, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <p>tap circle to start</p>
                        <p className="text-xs mt-1 text-stone-dark">or drag edge for custom time</p>
                    </motion.div>
                )}
                {state.status === 'running' && (
                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <p className="text-sm text-ink-soft opacity-60">tap to pause</p>
                        <button
                            onClick={() => actions.cancel()}
                            className="mt-3 px-4 py-2 text-xs text-stone-dark bg-stone rounded-lg hover:bg-stone-dark hover:text-ink transition-colors"
                        >
                            Reset Timer
                        </button>
                    </motion.div>
                )}
                {state.status === 'paused' && (
                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <p className="text-sm text-ink-soft opacity-60">tap to resume</p>
                        <button
                            onClick={() => actions.cancel()}
                            className="mt-3 px-4 py-2 text-xs text-stone-dark bg-stone rounded-lg hover:bg-stone-dark hover:text-ink transition-colors"
                        >
                            Reset Timer
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Overlay */}
            <SettingsOverlay
                isOpen={state.status === 'settings'}
                onClose={actions.closeSettings}
                settings={settings}
                onSettingsChange={handleSettingsChange}
            />
        </div>
    );
}
