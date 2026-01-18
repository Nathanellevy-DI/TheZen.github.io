import { useState, useRef, useCallback } from 'react';

/**
 * Long press detection hook
 * @param {Function} onLongPress - Callback when long press detected
 * @param {number} delay - Delay in ms (default 500)
 * @param {number} moveThreshold - Max movement in px (default 10)
 */
export function useLongPress(onLongPress, delay = 500, moveThreshold = 10) {
    const [isPressed, setIsPressed] = useState(false);
    const timeoutRef = useRef(null);
    const startPosRef = useRef({ x: 0, y: 0 });
    const cancelledRef = useRef(false);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsPressed(false);
        cancelledRef.current = true;
    }, []);

    const handleStart = useCallback((e) => {
        const touch = e.touches?.[0] || e;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        cancelledRef.current = false;
        setIsPressed(true);

        timeoutRef.current = setTimeout(() => {
            if (!cancelledRef.current) {
                onLongPress?.();
            }
            setIsPressed(false);
        }, delay);
    }, [onLongPress, delay]);

    const handleMove = useCallback((e) => {
        if (!isPressed) return;

        const touch = e.touches?.[0] || e;
        const dx = touch.clientX - startPosRef.current.x;
        const dy = touch.clientY - startPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > moveThreshold) {
            cancel();
        }
    }, [isPressed, moveThreshold, cancel]);

    const handleEnd = useCallback(() => {
        cancel();
    }, [cancel]);

    return {
        isPressed,
        handlers: {
            onTouchStart: handleStart,
            onTouchMove: handleMove,
            onTouchEnd: handleEnd,
            onMouseDown: handleStart,
            onMouseMove: handleMove,
            onMouseUp: handleEnd,
            onMouseLeave: handleEnd,
        },
        cancel,
    };
}
