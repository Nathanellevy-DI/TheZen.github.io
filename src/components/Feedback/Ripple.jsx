import { useState, useCallback } from 'react';

/**
 * Ripple touch feedback component
 * Creates expanding ripple effects at touch points
 */
export function Ripple({ x, y, size = 100 }) {
    return (
        <div
            className="ripple"
            style={{
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
            }}
        />
    );
}

/**
 * Hook for managing ripple effects
 */
export function useRipples() {
    const [ripples, setRipples] = useState([]);

    const addRipple = useCallback((x, y, size = 100) => {
        const id = Date.now() + Math.random();
        setRipples((prev) => [...prev, { id, x, y, size }]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
    }, []);

    const clearRipples = useCallback(() => {
        setRipples([]);
    }, []);

    return { ripples, addRipple, clearRipples };
}

/**
 * Ripple container component
 */
export function RippleContainer({ ripples }) {
    return (
        <div className="ripple-container">
            {ripples.map((ripple) => (
                <Ripple key={ripple.id} x={ripple.x} y={ripple.y} size={ripple.size} />
            ))}
        </div>
    );
}
