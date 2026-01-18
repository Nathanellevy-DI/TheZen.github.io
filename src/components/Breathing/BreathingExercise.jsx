import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

const PATTERNS = {
    calm: { inhale: 4, hold: 4, exhale: 4, holdOut: 0, name: 'Box' },
    relaxed: { inhale: 4, hold: 7, exhale: 8, holdOut: 0, name: '4-7-8' },
    energize: { inhale: 6, hold: 0, exhale: 2, holdOut: 0, name: 'Energy' },
};

export function BreathingExercise() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('ready');
    const [pattern, setPattern] = useState('calm');
    const [cycleCount, setCycleCount] = useState(0);
    const [circleScale, setCircleScale] = useState(1);
    const timerRef = useRef(null);

    const currentPattern = PATTERNS[pattern];

    const getPhaseText = () => {
        if (phase === 'ready') return 'TAP TO START';
        if (phase === 'inhale') return 'BREATHE IN';
        if (phase === 'hold') return 'HOLD';
        if (phase === 'exhale') return 'BREATHE OUT';
        return '';
    };

    const getPhaseDuration = useCallback(() => {
        if (phase === 'inhale') return currentPattern.inhale;
        if (phase === 'hold') return currentPattern.hold;
        if (phase === 'exhale') return currentPattern.exhale;
        if (phase === 'holdOut') return currentPattern.holdOut;
        return 0;
    }, [phase, currentPattern]);

    const goToNextPhase = useCallback(() => {
        setPhase(current => {
            if (current === 'ready') return 'inhale';
            if (current === 'inhale') return currentPattern.hold > 0 ? 'hold' : 'exhale';
            if (current === 'hold') return 'exhale';
            if (current === 'exhale') {
                setCycleCount(c => c + 1);
                return 'inhale';
            }
            return 'inhale';
        });
    }, [currentPattern]);

    useEffect(() => {
        if (!isActive || phase === 'ready') return;

        if (phase === 'inhale') setCircleScale(1.5);
        else if (phase === 'exhale') setCircleScale(1);

        const dur = getPhaseDuration();
        if (dur === 0) {
            goToNextPhase();
            return;
        }

        timerRef.current = setTimeout(goToNextPhase, dur * 1000);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isActive, phase, getPhaseDuration, goToNextPhase]);

    const toggleBreathing = () => {
        console.log('Toggle breathing, current isActive:', isActive);
        if (isActive) {
            setIsActive(false);
            setPhase('ready');
            setCircleScale(1);
            setCycleCount(0);
            if (timerRef.current) clearTimeout(timerRef.current);
        } else {
            setIsActive(true);
            setPhase('inhale');
        }
    };

    const selectPattern = (key) => {
        setPattern(key);
        setIsActive(false);
        setPhase('ready');
        setCircleScale(1);
        setCycleCount(0);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <div className="w-full max-w-sm mx-auto flex flex-col items-center py-4">
            {/* Pattern buttons */}
            <div className="flex gap-3 mb-10">
                {Object.entries(PATTERNS).map(([key, p]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => selectPattern(key)}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${pattern === key
                                ? 'bg-ink text-paper'
                                : 'bg-stone text-ink'
                            }`}
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Main breathing circle - USING BUTTON */}
            <button
                type="button"
                onClick={toggleBreathing}
                className="relative w-52 h-52 flex items-center justify-center focus:outline-none"
                style={{ touchAction: 'manipulation' }}
            >
                {/* Animated circle wrapper */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-paper flex items-center justify-center"
                    animate={{ scale: circleScale }}
                    transition={{
                        duration: getPhaseDuration() || 0.3,
                        ease: phase === 'inhale' ? 'easeOut' : 'easeIn',
                    }}
                    style={{
                        boxShadow: '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-base font-medium text-ink tracking-wide">
                            {getPhaseText()}
                        </span>
                        {isActive && getPhaseDuration() > 0 && (
                            <span className="text-3xl font-light text-ink mt-2 timer-font">
                                {getPhaseDuration()}s
                            </span>
                        )}
                    </div>
                </motion.div>
            </button>

            {/* Cycle counter */}
            {cycleCount > 0 && (
                <div className="mt-10 text-center">
                    <p className="text-3xl font-light text-ink">{cycleCount}</p>
                    <p className="text-sm text-stone-dark">cycles</p>
                </div>
            )}

            {/* Hint */}
            <p className="mt-8 text-sm text-stone-dark">
                {isActive ? 'Tap to stop' : 'Tap the circle to start breathing'}
            </p>
        </div>
    );
}
