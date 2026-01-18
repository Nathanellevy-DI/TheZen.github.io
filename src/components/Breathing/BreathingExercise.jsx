import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

const PATTERNS = {
    calm: { inhale: 4, hold: 4, exhale: 4, holdOut: 0, name: 'Box' },
    relaxed: { inhale: 4, hold: 7, exhale: 8, holdOut: 0, name: '4-7-8' },
    energize: { inhale: 6, hold: 0, exhale: 2, holdOut: 0, name: 'Energy' },
};

/**
 * BreathingExercise - Fixed touch handling
 */
export function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('ready');
    const [pattern, setPattern] = useState('calm');
    const [cycleCount, setCycleCount] = useState(0);
    const [scale, setScale] = useState(1);
    const timerRef = useRef(null);

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

    const getPhaseDuration = useCallback(() => {
        switch (phase) {
            case 'inhale': return currentPattern.inhale;
            case 'hold': return currentPattern.hold;
            case 'exhale': return currentPattern.exhale;
            case 'holdOut': return currentPattern.holdOut;
            default: return 0;
        }
    }, [phase, currentPattern]);

    const nextPhase = useCallback(() => {
        setPhase(current => {
            switch (current) {
                case 'ready':
                    return 'inhale';
                case 'holdOut':
                    setCycleCount(c => c + 1);
                    return 'inhale';
                case 'inhale':
                    return currentPattern.hold > 0 ? 'hold' : 'exhale';
                case 'hold':
                    return 'exhale';
                case 'exhale':
                    setCycleCount(c => c + 1);
                    return currentPattern.holdOut > 0 ? 'holdOut' : 'inhale';
                default:
                    return 'inhale';
            }
        });
    }, [currentPattern]);

    // Phase timer
    useEffect(() => {
        if (!isActive || phase === 'ready') return;

        const duration = getPhaseDuration();

        // Update scale
        if (phase === 'inhale') {
            setScale(1.4);
        } else if (phase === 'exhale') {
            setScale(1);
        }

        if (duration === 0) {
            nextPhase();
            return;
        }

        timerRef.current = setTimeout(nextPhase, duration * 1000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isActive, phase, getPhaseDuration, nextPhase]);

    // Handle circle tap
    const handleCircleTap = useCallback(() => {
        if (isActive) {
            // Stop
            setIsActive(false);
            setPhase('ready');
            setScale(1);
            setCycleCount(0);
            if (timerRef.current) clearTimeout(timerRef.current);
        } else {
            // Start
            setIsActive(true);
            setPhase('inhale');
            setCycleCount(0);
        }
    }, [isActive]);

    // Handle pattern change
    const handlePatternChange = useCallback((key) => {
        setPattern(key);
        if (isActive) {
            setIsActive(false);
            setPhase('ready');
            setScale(1);
            setCycleCount(0);
            if (timerRef.current) clearTimeout(timerRef.current);
        }
    }, [isActive]);

    return (
        <div className="w-full max-w-sm mx-auto flex flex-col items-center">
            {/* Pattern selector */}
            <div className="flex gap-2 mb-10">
                {Object.entries(PATTERNS).map(([key, p]) => (
                    <button
                        key={key}
                        onClick={() => handlePatternChange(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${pattern === key
                                ? 'bg-ink text-paper'
                                : 'bg-stone text-ink active:bg-stone-dark'
                            }`}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Breathing circle */}
            <div className="relative w-56 h-56 flex items-center justify-center">
                {/* Outer ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-stone"
                    animate={{
                        opacity: isActive ? [0.2, 0.4, 0.2] : 0.2,
                        scale: isActive ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />

                {/* Main circle - using onClick for better compatibility */}
                <motion.div
                    onClick={handleCircleTap}
                    className="w-44 h-44 rounded-full bg-paper shadow-clay flex flex-col items-center justify-center cursor-pointer active:shadow-clay-pressed"
                    animate={{ scale }}
                    transition={{
                        duration: getPhaseDuration() || 0.3,
                        ease: phase === 'inhale' ? 'easeOut' : 'easeIn',
                    }}
                    style={{ touchAction: 'manipulation' }}
                >
                    <motion.span
                        className="text-lg font-light text-ink text-center"
                        key={phase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {getPhaseText()}
                    </motion.span>

                    {isActive && getPhaseDuration() > 0 && (
                        <span className="text-2xl font-light text-ink mt-1 timer-font">
                            {getPhaseDuration()}s
                        </span>
                    )}
                </motion.div>
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
            <div className="mt-8 text-center text-xs text-stone-dark">
                {isActive ? 'tap circle to stop' : 'follow the expanding circle'}
            </div>
        </div>
    );
}
