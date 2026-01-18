import { useReducer, useCallback } from 'react';

/**
 * Timer State Machine
 * States: idle, adjusting, committing, running, paused, completed, settings
 */

const INITIAL_STATE = {
    status: 'idle',       // idle | adjusting | committing | running | paused | completed | settings
    duration: 25 * 60,    // Duration in seconds (default 25 min)
    remaining: 25 * 60,   // Remaining seconds
    startTime: null,      // When timer started
    pausedAt: null,       // When paused
};

function timerReducer(state, action) {
    switch (action.type) {
        case 'START_ADJUST':
            return { ...state, status: 'adjusting' };

        case 'SET_DURATION': {
            // Validate duration (1-120 minutes)
            const minutes = Math.max(1, Math.min(120, action.minutes));
            const seconds = minutes * 60;
            return {
                ...state,
                duration: seconds,
                remaining: seconds,
            };
        }

        case 'END_ADJUST':
            return { ...state, status: 'idle' };

        case 'ENTER_DROP_ZONE':
            return { ...state, status: 'committing' };

        case 'EXIT_DROP_ZONE':
            return { ...state, status: 'adjusting' };

        case 'COMMIT':
            return {
                ...state,
                status: 'running',
                startTime: Date.now(),
                remaining: state.duration,
            };

        case 'TICK':
            if (state.status !== 'running') return state;
            const newRemaining = Math.max(0, state.remaining - 1);
            if (newRemaining === 0) {
                return { ...state, status: 'completed', remaining: 0 };
            }
            return { ...state, remaining: newRemaining };

        case 'PAUSE':
            if (state.status !== 'running') return state;
            return {
                ...state,
                status: 'paused',
                pausedAt: Date.now(),
            };

        case 'RESUME':
            if (state.status !== 'paused') return state;
            return {
                ...state,
                status: 'running',
                pausedAt: null,
            };

        case 'CANCEL':
            return {
                ...INITIAL_STATE,
                duration: state.duration,
                remaining: state.duration,
            };

        case 'RESET':
            return INITIAL_STATE;

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
