import { useReducer, useCallback, useEffect, useRef } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

/**
 * Timer State Machine with localStorage persistence
 * Timer continues even when switching tabs/closing app
 */

const TIMER_STATE_KEY = 'active_timer';

const INITIAL_STATE = {
    status: 'idle',       // idle | adjusting | committing | running | paused | completed | settings
    duration: 25 * 60,    // Duration in seconds
    remaining: 25 * 60,   // Remaining seconds
    startTime: null,      // When timer started (timestamp)
    pausedAt: null,       // When paused (timestamp)
    endTime: null,        // When timer should complete (timestamp)
};

function calculateRemaining(state) {
    if (state.status === 'running' && state.endTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((state.endTime - now) / 1000));
        return remaining;
    }
    return state.remaining;
}

function timerReducer(state, action) {
    switch (action.type) {
        case 'RESTORE': {
            // Restore from saved state
            const saved = action.savedState;
            if (!saved) return state;

            // If was running, check if it should have completed
            if (saved.status === 'running' && saved.endTime) {
                const now = Date.now();
                if (now >= saved.endTime) {
                    return { ...saved, status: 'completed', remaining: 0 };
                }
                const remaining = Math.floor((saved.endTime - now) / 1000);
                return { ...saved, remaining };
            }
            return saved;
        }

        case 'START_ADJUST':
            return { ...state, status: 'adjusting' };

        case 'SET_DURATION': {
            const minutes = Math.max(1, Math.min(120, action.minutes));
            const seconds = minutes * 60;
            return { ...state, duration: seconds, remaining: seconds };
        }

        case 'END_ADJUST':
            return { ...state, status: 'idle' };

        case 'ENTER_DROP_ZONE':
            return { ...state, status: 'committing' };

        case 'EXIT_DROP_ZONE':
            return { ...state, status: 'adjusting' };

        case 'COMMIT': {
            const now = Date.now();
            return {
                ...state,
                status: 'running',
                startTime: now,
                endTime: now + (state.duration * 1000), // Calculate end time
                remaining: state.duration,
            };
        }

        case 'TICK':
            if (state.status !== 'running') return state;
            const newRemaining = calculateRemaining(state);
            if (newRemaining <= 0) {
                return { ...state, status: 'completed', remaining: 0 };
            }
            return { ...state, remaining: newRemaining };

        case 'PAUSE':
            if (state.status !== 'running') return state;
            return {
                ...state,
                status: 'paused',
                pausedAt: Date.now(),
                remaining: calculateRemaining(state),
                endTime: null, // Clear end time when paused
            };

        case 'RESUME': {
            if (state.status !== 'paused') return state;
            const now = Date.now();
            return {
                ...state,
                status: 'running',
                pausedAt: null,
                endTime: now + (state.remaining * 1000), // New end time from remaining
            };
        }

        case 'CANCEL':
        case 'RESET':
            return {
                ...INITIAL_STATE,
                duration: state.duration,
                remaining: state.duration,
            };

        case 'OPEN_SETTINGS':
            return { ...state, status: 'settings' };

        case 'CLOSE_SETTINGS':
            return { ...state, status: 'idle' };

        case 'COMPLETE_ACKNOWLEDGED':
            return {
                ...INITIAL_STATE,
                duration: state.duration,
                remaining: state.duration,
            };

        default:
            return state;
    }
}

export function useTimerState(initialDuration = 25) {
    const [state, dispatch] = useReducer(timerReducer, {
        ...INITIAL_STATE,
        duration: initialDuration * 60,
        remaining: initialDuration * 60,
    });

    const isInitialized = useRef(false);

    // Restore timer state on mount
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        const saved = getStorageItem(TIMER_STATE_KEY, null);
        if (saved && (saved.status === 'running' || saved.status === 'paused')) {
            dispatch({ type: 'RESTORE', savedState: saved });
        }
    }, []);

    // Save timer state whenever it changes
    useEffect(() => {
        if (!isInitialized.current) return;

        if (state.status === 'running' || state.status === 'paused') {
            setStorageItem(TIMER_STATE_KEY, state);
        } else {
            // Clear saved state when not running/paused
            setStorageItem(TIMER_STATE_KEY, null);
        }
    }, [state]);

    // Handle visibility change (tab switch, app background)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && state.status === 'running') {
                // Recalculate remaining time when tab becomes visible
                dispatch({ type: 'TICK' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [state.status]);

    const actions = {
        startAdjust: useCallback(() => dispatch({ type: 'START_ADJUST' }), []),
        setDuration: useCallback((minutes) => dispatch({ type: 'SET_DURATION', minutes }), []),
        endAdjust: useCallback(() => dispatch({ type: 'END_ADJUST' }), []),
        enterDropZone: useCallback(() => dispatch({ type: 'ENTER_DROP_ZONE' }), []),
        exitDropZone: useCallback(() => dispatch({ type: 'EXIT_DROP_ZONE' }), []),
        commit: useCallback(() => dispatch({ type: 'COMMIT' }), []),
        tick: useCallback(() => dispatch({ type: 'TICK' }), []),
        pause: useCallback(() => dispatch({ type: 'PAUSE' }), []),
        resume: useCallback(() => dispatch({ type: 'RESUME' }), []),
        cancel: useCallback(() => dispatch({ type: 'CANCEL' }), []),
        reset: useCallback(() => dispatch({ type: 'RESET' }), []),
        openSettings: useCallback(() => dispatch({ type: 'OPEN_SETTINGS' }), []),
        closeSettings: useCallback(() => dispatch({ type: 'CLOSE_SETTINGS' }), []),
        acknowledgeComplete: useCallback(() => dispatch({ type: 'COMPLETE_ACKNOWLEDGED' }), []),
    };

    return { state, actions };
}
