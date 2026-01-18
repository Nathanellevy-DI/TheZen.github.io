import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
    getAngleFromCenter,
    angleToMinutes,
    snapToIncrement,
    isOnCircleEdge,
    formatTime,
} from '../../utils/math';
import { RippleContainer, useRipples } from '../Feedback/Ripple';

/**
 * Spring physics configuration
 */
const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30,
    mass: 1.2,
    restDelta: 0.001,
};

/**
 * TimerCircle Component
 * Fixed touch handling for mobile - prevents accidental pauses
 */
export function TimerCircle({
    duration,
    remaining,
    status,
    onDurationChange,
    onDragStart,
    onDragEnd,
    onEnterDropZone,
    onExitDropZone,
    onFlickCancel,
    onLongPress,
    onTap,
}) {
    const circleRef = useRef(null);
    const { ripples, addRipple } = useRipples();

    // Touch state
    const [isDragging, setIsDragging] = useState(false);
    const [isInDropZone, setIsInDropZone] = useState(false);
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
    const hasMoved = useRef(false);
    const longPressTimerRef = useRef(null);
    const longPressTriggeredRef = useRef(false);

    // Motion values
    const scale = useMotionValue(1);
    const y = useMotionValue(0);
    const springScale = useSpring(scale, SPRING_CONFIG);
    const springY = useSpring(y, SPRING_CONFIG);

    // Progress for visual arc
    const progress = duration > 0 ? remaining / duration : 0;

    // Circle dimensions
    const circleSize = Math.min(260, window.innerWidth * 0.65);
    const radius = circleSize / 2;

    // Get circle center
    const getCircleCenter = useCallback(() => {
        if (!circleRef.current) return { x: 0, y: 0 };
        const rect = circleRef.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }, []);

    // Check if in drop zone
    const checkDropZone = useCallback((clientY) => clientY < 120, []);

    // Get touch/mouse position
    const getEventPos = (e) => {
        if (e.touches?.[0]) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches?.[0]) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    // Handle touch start
    const handleTouchStart = useCallback((e) => {
        if (status === 'settings') return;
        e.preventDefault(); // Prevent default to avoid double-firing

        const pos = getEventPos(e);
        touchStartRef.current = { x: pos.x, y: pos.y, time: Date.now() };
        hasMoved.current = false;
        longPressTriggeredRef.current = false;

        // Add ripple
        const rect = circleRef.current?.getBoundingClientRect();
        if (rect) {
            addRipple(pos.x - rect.left, pos.y - rect.top, 80);
        }

        const center = getCircleCenter();
        const onEdge = isOnCircleEdge(pos.x, pos.y, center.x, center.y, radius, 0.35);

        if (onEdge && (status === 'idle' || status === 'adjusting')) {
            setIsDragging(true);
            onDragStart?.();
            scale.set(1.02);
        } else if (status === 'idle') {
            // Long press for settings
            longPressTimerRef.current = setTimeout(() => {
                longPressTriggeredRef.current = true;
                onLongPress?.();
            }, 500);
        }
    }, [status, getCircleCenter, radius, addRipple, onDragStart, onLongPress, scale]);

    // Handle touch move
    const handleTouchMove = useCallback((e) => {
        const pos = getEventPos(e);

        // Track movement
        const dx = pos.x - touchStartRef.current.x;
        const dy = pos.y - touchStartRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            hasMoved.current = true;
            // Cancel long press
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
        }

        if (!isDragging) return;

        const center = getCircleCenter();
        const angle = getAngleFromCenter(pos.x, pos.y, center.x, center.y);
        const minutes = angleToMinutes(angle, 60);
        const snapped = snapToIncrement(minutes, 5);
        onDurationChange?.(Math.max(5, snapped));

        // Check drop zone
        const inDropZone = checkDropZone(pos.y);
        if (inDropZone !== isInDropZone) {
            setIsInDropZone(inDropZone);
            if (inDropZone) {
                onEnterDropZone?.();
                y.set(-50);
                scale.set(0.95);
            } else {
                onExitDropZone?.();
                y.set(0);
                scale.set(1.02);
            }
        }
    }, [isDragging, getCircleCenter, onDurationChange, checkDropZone, isInDropZone, onEnterDropZone, onExitDropZone, y, scale]);

    // Handle touch end
    const handleTouchEnd = useCallback((e) => {
        // Clear long press
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        const pos = getEventPos(e);
        const dx = pos.x - touchStartRef.current.x;
        const dy = pos.y - touchStartRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - touchStartRef.current.time;

        // Check for flick (running state only)
        if (status === 'running' && dy < -50) {
            const velocity = Math.abs(dy / elapsed) * 1000;
            if (velocity > 800) {
                onFlickCancel?.();
                return;
            }
        }

        // Handle drag end
        if (isDragging) {
            setIsDragging(false);
            scale.set(1);
            y.set(0);
            onDragEnd?.(isInDropZone);
            setIsInDropZone(false);
            return;
        }

        // Tap detection - only if didn't move much and wasn't a long press
        // Also require a minimum touch duration to avoid accidental taps
        if (!hasMoved.current && !longPressTriggeredRef.current && dist < 15 && elapsed > 50 && elapsed < 300) {
            onTap?.();
        }
    }, [status, isDragging, isInDropZone, onDragEnd, onFlickCancel, onTap, scale, y]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    // Progress arc
    const progressArc = useCallback(() => {
        if (status !== 'running' && status !== 'paused') return '';

        const angle = progress * 2 * Math.PI;
        const r = radius - 8;
        const cx = radius;
        const cy = radius;

        if (progress >= 1) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
        }
        if (progress <= 0) return '';

        const endX = cx + r * Math.sin(angle);
        const endY = cy - r * Math.cos(angle);
        const largeArc = angle > Math.PI ? 1 : 0;

        return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
    }, [progress, radius, status]);

    // Duration arc
    const durationArc = useCallback(() => {
        if (status !== 'idle' && status !== 'adjusting' && status !== 'committing') return '';

        const minutes = duration / 60;
        const angle = (minutes / 60) * 2 * Math.PI;
        const r = radius - 8;
        const cx = radius;
        const cy = radius;

        if (minutes >= 60) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
        }

        const endX = cx + r * Math.sin(angle);
        const endY = cy - r * Math.cos(angle);
        const largeArc = angle > Math.PI ? 1 : 0;

        return `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
    }, [duration, radius, status]);

    const displayTime = formatTime(status === 'running' || status === 'paused' ? remaining : duration);
    const displayMinutes = Math.ceil((status === 'running' || status === 'paused' ? remaining : duration) / 60);

    return (
        <div
            className="relative flex items-center justify-center touch-none"
            style={{ width: circleSize, height: circleSize }}
        >
            <motion.div
                ref={circleRef}
                className="relative clay cursor-pointer select-none"
                style={{
                    width: circleSize,
                    height: circleSize,
                    scale: springScale,
                    y: springY,
                }}
                animate={{
                    boxShadow: status === 'running'
                        ? [
                            '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(0,0,0,0.05)',
                            '12px 12px 24px rgba(0,0,0,0.1), -12px -12px 24px rgba(255,255,255,0.95), inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 4px rgba(0,0,0,0.03)',
                        ]
                        : undefined,
                }}
                transition={status === 'running' ? { duration: 2, repeat: Infinity, repeatType: 'reverse' } : undefined}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={isDragging ? handleTouchMove : undefined}
                onMouseUp={handleTouchEnd}
                onMouseLeave={isDragging ? handleTouchEnd : undefined}
            >
                <RippleContainer ripples={ripples} />

                {/* Progress/Duration Arc */}
                <svg
                    className="absolute inset-0 pointer-events-none"
                    width={circleSize}
                    height={circleSize}
                >
                    <circle
                        cx={radius}
                        cy={radius}
                        r={radius - 8}
                        fill="none"
                        stroke="#E0E0E0"
                        strokeWidth="3"
                    />
                    <motion.path
                        d={status === 'running' || status === 'paused' ? progressArc() : durationArc()}
                        fill="none"
                        stroke="#1A1A1A"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <motion.div
                        className="timer-font text-4xl font-light text-ink"
                        animate={{
                            opacity: status === 'completed' ? [1, 0.5, 1] : 1,
                        }}
                        transition={status === 'completed' ? { duration: 1, repeat: Infinity } : undefined}
                    >
                        {displayTime}
                    </motion.div>

                    <motion.div className="text-xs text-ink-soft mt-2 uppercase tracking-widest">
                        {status === 'idle' && 'tap to start'}
                        {status === 'adjusting' && `${displayMinutes} min`}
                        {status === 'committing' && 'release to start'}
                        {status === 'running' && 'focusing'}
                        {status === 'paused' && 'paused · tap to resume'}
                        {status === 'completed' && 'complete!'}
                    </motion.div>
                </div>

                {/* Edge indicator */}
                {(status === 'idle' || status === 'adjusting') && (
                    <motion.div
                        className="absolute rounded-full border-2 border-dashed border-stone-dark pointer-events-none"
                        style={{
                            width: circleSize - 20,
                            height: circleSize - 20,
                            left: 10,
                            top: 10,
                        }}
                        animate={{
                            opacity: isDragging ? 0.8 : 0.2,
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
}
