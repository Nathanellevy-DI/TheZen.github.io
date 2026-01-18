import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * Breathing patterns
 */
const PATTERNS = {
    calm: { inhale: 4, hold: 4, exhale: 4, holdOut: 0, name: 'Box Breathing' },
    relaxed: { inhale: 4, hold: 7, exhale: 8, holdOut: 0, name: '4-7-8 Relaxing' },
    energize: { inhale: 6, hold: 0, exhale: 2, holdOut: 0, name: 'Energizing' },
};

/**
 * BreathingExercise - Guided breathing visualization
 * Responsive layout that fits any screen
 */
export function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('ready'); // ready, inhale, hold, exhale, holdOut
    const [pattern, setPattern] = useState('calm');
    const [cycleCount, setCycleCount] = useState(0);
    const [scale, setScale] = useState(1);

    const currentPattern = PATTERNS[pattern];

    const getPhaseText = () => {
        switch (phase) {
            case 'ready': return 'Tap to begin';
            case 'inhale': return 'Breathe in';
            case 'hold': return 'Hold';
            case 'exhale': return 'Breathe out';
            case 'holdOut': return 'Hold';
            default: return '';
        }
    };

    const getPhaseDuration = () => {
        switch (phase) {
            case 'inhale': return currentPattern.inhale;
            case 'hold': return currentPattern.hold;
            case 'exhale': return currentPattern.exhale;
            case 'holdOut': return currentPattern.holdOut;
            default: return 0;
        }
    };

    const nextPhase = useCallback(() => {
        setPhase(current => {
            switch (current) {
                case 'ready':
                case 'holdOut':
                    setCycleCount(c => c + (current === 'holdOut' ? 1 : 0));
                    return 'inhale';
                case 'inhale':
                    return currentPattern.hold > 0 ? 'hold' : 'exhale';
                case 'hold':
                    return 'exhale';
                case 'exhale':
                    return currentPattern.holdOut > 0 ? 'holdOut' : 'inhale';
                default:
                    return 'inhale';
            }
        });
    }, [currentPattern]);

    useEffect(() => {
        if (!isActive || phase === 'ready') return;

        const duration = getPhaseDuration();
        if (duration === 0) {
            nextPhase();
            return;
        }

        // Update scale based on phase
        if (phase === 'inhale') {
            setScale(1.5);
        } else if (phase === 'exhale') {
            setScale(1);
        }

        const timer = setTimeout(nextPhase, duration * 1000);
        return () => clearTimeout(timer);
    }, [isActive, phase, nextPhase]);

    const handleStart = () => {
        if (isActive) {
            setIsActive(false);
            setPhase('ready');
            setScale(1);
            setCycleCount(0);
        } else {
            setIsActive(true);
            setPhase('inhale');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center py-8">
            {/* Pattern selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-12 px-4">
                {Object.entries(PATTERNS).map(([key, p]) => (
                    <button
                        key={key}
                        onClick={() => {
                            setPattern(key);
                            if (isActive) {
                                setIsActive(false);
                                setPhase('ready');
                                setScale(1);
                            }
                        }}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${pattern === key
                                ? 'bg-ink text-paper'
                                : 'bg-stone text-ink hover:bg-stone-dark'
                            }`}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Breathing circle */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer ring animation */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-stone opacity-30"
                    animate={{
                        scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Main circle */}
                <motion.button
                    onClick={handleStart}
                    className="w-48 h-48 rounded-full bg-paper shadow-clay flex flex-col items-center justify-center cursor-pointer"
                    animate={{
                        scale: scale,
                    }}
                    transition={{
                        duration: getPhaseDuration() || 0.3,
                        ease: phase === 'inhale' ? 'easeOut' : 'easeIn',
                    }}
                    whileTap={{ scale: scale * 0.98 }}
                >
                    <motion.span
                        className="text-xl font-light text-ink text-center px-4"
                        key={phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {getPhaseText()}
                    </motion.span>

                    {isActive && getPhaseDuration() > 0 && (
                        <motion.span
                            className="text-3xl font-light text-ink mt-2 timer-font"
                            key={`${phase}-${getPhaseDuration()}`}
                        >
                            {getPhaseDuration()}s
                        </motion.span>
                    )}
                </motion.button>
            </div>

            {/* Cycle counter */}
            {cycleCount > 0 && (
                <motion.div
                    className="mt-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-2xl font-light text-ink">{cycleCount}</p>
                    <p className="text-sm text-stone-dark">cycles</p>
                </motion.div>
            )}

            {/* Instructions */}
            <motion.div
                className="mt-8 text-center text-xs text-stone-dark px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2 }}
            >
                {isActive ? 'tap to stop' : 'follow the circle as it expands and contracts'}
            </motion.div>
        </div>
    );
}
