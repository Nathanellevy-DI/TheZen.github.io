import { useRef, useCallback, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    getAngleFromCenter,
    angleToMinutes,
    snapToIncrement,
    minutesToAngle,
    isOnCircleEdge,
    formatTime,
    calculateVelocity
} from '../../utils/math';
import { RippleContainer, useRipples } from '../Feedback/Ripple';

/**
 * Spring physics configuration
 * Firm but weighted feel - like handling a meditation stone
 */
const SPRING_CONFIG = {
    stiffness: 300,
    damping: 30,
    mass: 1.2,
    restDelta: 0.001,
};

/**
 * TimerCircle Component
 * The central draggable fluid circle that represents the timer
 */
export function TimerCircle({
    duration,          // Current duration in seconds
    remaining,         // Remaining seconds (when running)
    status,            // Timer status
    onDurationChange,  // Callback when duration changes via radial drag
    onDragStart,       // Callback when drag starts
    onDragEnd,         // Callback when drag ends
    onEnterDropZone,   // Callback when entering drop zone
    onExitDropZone,    // Callback when exiting drop zone
    onFlickCancel,     // Callback for flick-up cancel gesture
    onLongPress,       // Callback for long press (settings)
    onTap,             // Callback for tap (pause/resume/acknowledge)
}) {
    const containerRef = useRef(null);
    const circleRef = useRef(null);
    const { ripples, addRipple, clearRipples } = useRipples();

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [isInDropZone, setIsInDropZone] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, time: 0 });
    const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });

    // Long press detection
    const longPressTimerRef = useRef(null);
    const longPressTriggeredRef = useRef(false);

    // Motion values for smooth animation
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useMotionValue(1);

    // Spring-animated versions
    const springX = useSpring(x, SPRING_CONFIG);
    const springY = useSpring(y, SPRING_CONFIG);
    const springScale = useSpring(scale, SPRING_CONFIG);

    // Progress for visual arc (0-1)
    const progress = duration > 0 ? remaining / duration : 0;

    // Calculate circle dimensions
    const circleSize = Math.min(280, window.innerWidth * 0.7);
    const radius = circleSize / 2;

    // Get center of circle in viewport
    const getCircleCenter = useCallback(() => {
        if (!circleRef.current) return { x: 0, y: 0 };
        const rect = circleRef.current.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }, []);

    // Check if position is in drop zone (top 120px of screen)
    const checkDropZone = useCallback((clientY) => {
        return clientY < 120;
    }, []);

    // Handle touch/mouse start
    const handlePointerDown = useCallback((e) => {
        if (status === 'settings') return;

        const touch = e.touches?.[0] || e;
        const { clientX, clientY } = touch;

        // Store start position for velocity calculation
        dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
        lastMoveRef.current = { x: clientX, y: clientY, time: Date.now() };
        longPressTriggeredRef.current = false;

        // Add ripple at touch point
        const rect = circleRef.current?.getBoundingClientRect();
        if (rect) {
            addRipple(clientX - rect.left, clientY - rect.top, 80);
        }

        const center = getCircleCenter();
        const onEdge = isOnCircleEdge(clientX, clientY, center.x, center.y, radius, 0.35);

        if (onEdge && (status === 'idle' || status === 'adjusting')) {
            // Edge drag for time adjustment
            setIsDragging(true);
            onDragStart?.();
            scale.set(1.02);
        } else if (status === 'idle') {
            // Center touch - start long press timer
            longPressTimerRef.current = setTimeout(() => {
                longPressTriggeredRef.current = true;
                onLongPress?.();
            }, 500);
        }
    }, [status, getCircleCenter, radius, addRipple, onDragStart, onLongPress, scale]);

    // Handle touch/mouse move
    const handlePointerMove = useCallback((e) => {
        const touch = e.touches?.[0] || e;
        const { clientX, clientY } = touch;

        // Cancel long press if moved too much
        const startDist = Math.sqrt(
            Math.pow(clientX - dragStartRef.current.x, 2) +
            Math.pow(clientY - dragStartRef.current.y, 2)
        );
        if (startDist > 10 && longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (!isDragging) return;

        const center = getCircleCenter();

        // Calculate new duration from angle
        const angle = getAngleFromCenter(clientX, clientY, center.x, center.y);
        const minutes = angleToMinutes(angle, 60);
        const snapped = snapToIncrement(minutes, 5);

        // Ensure minimum 5 minutes
        const finalMinutes = Math.max(5, snapped);
        onDurationChange?.(finalMinutes);

        // Track for velocity calculation
        lastMoveRef.current = { x: clientX, y: clientY, time: Date.now() };

        // Check drop zone
        const inDropZone = checkDropZone(clientY);
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

    // Handle touch/mouse end
    const handlePointerUp = useCallback((e) => {
        // Clear long press timer
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        // Check for flick gesture (running state only)
        if (status === 'running') {
            const now = Date.now();
            const deltaTime = now - lastMoveRef.current.time;
            const deltaY = dragStartRef.current.y - (e.changedTouches?.[0]?.clientY || e.clientY);
            const velocity = Math.abs(deltaY / deltaTime) * 1000;

            if (deltaY > 50 && velocity > 800) {
                onFlickCancel?.();
                return;
            }
        }

        // Handle tap for pause/resume/acknowledge
        if (!isDragging && !longPressTriggeredRef.current) {
            const moved = Math.sqrt(
                Math.pow((e.changedTouches?.[0]?.clientX || e.clientX) - dragStartRef.current.x, 2) +
                Math.pow((e.changedTouches?.[0]?.clientY || e.clientY) - dragStartRef.current.y, 2)
            );
            if (moved < 10) {
                onTap?.();
            }
        }

        if (isDragging) {
            setIsDragging(false);
            scale.set(1);
            y.set(0);
            onDragEnd?.(isInDropZone);
            setIsInDropZone(false);
        }
    }, [status, isDragging, isInDropZone, onDragEnd, onFlickCancel, onTap, scale, y]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    // Calculate arc path for progress display
    const progressArc = useCallback(() => {
        if (status !== 'running' && status !== 'paused') return '';

        const angle = progress * 2 * Math.PI;
        const r = radius - 8;
        const cx = radius;
        const cy = radius;

        const startX = cx;
        const startY = cy - r;
        const endX = cx + r * Math.sin(angle);
        const endY = cy - r * Math.cos(angle);

        const largeArc = angle > Math.PI ? 1 : 0;

        if (progress >= 1) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
        }

        return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
    }, [progress, radius, status]);

    // Duration arc for adjustment mode
    const durationArc = useCallback(() => {
        if (status !== 'idle' && status !== 'adjusting' && status !== 'committing') return '';

        const minutes = duration / 60;
        const angle = (minutes / 60) * 2 * Math.PI;
        const r = radius - 8;
        const cx = radius;
        const cy = radius;

        const startX = cx;
        const startY = cy - r;
        const endX = cx + r * Math.sin(angle);
        const endY = cy - r * Math.cos(angle);

        const largeArc = angle > Math.PI ? 1 : 0;

        if (minutes >= 60) {
            return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`;
        }

        return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
    }, [duration, radius, status]);

    // Format display time
    const displayTime = formatTime(status === 'running' || status === 'paused' ? remaining : duration);
    const displayMinutes = Math.ceil((status === 'running' || status === 'paused' ? remaining : duration) / 60);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center justify-center"
            style={{ width: circleSize, height: circleSize }}
        >
            <motion.div
                ref={circleRef}
                className="relative clay cursor-grab active:cursor-grabbing"
                style={{
                    width: circleSize,
                    height: circleSize,
                    x: springX,
                    y: springY,
                    scale: springScale,
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
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
            >
                {/* Ripple effects container */}
                <RippleContainer ripples={ripples} />

                {/* Progress/Duration Arc */}
                <svg
                    className="absolute inset-0 -rotate-0 pointer-events-none"
                    width={circleSize}
                    height={circleSize}
                >
                    {/* Background track */}
                    <circle
                        cx={radius}
                        cy={radius}
                        r={radius - 8}
                        fill="none"
                        stroke="#E0E0E0"
                        strokeWidth="3"
                    />

                    {/* Active arc */}
                    <motion.path
                        d={status === 'running' || status === 'paused' ? progressArc() : durationArc()}
                        fill="none"
                        stroke="#1A1A1A"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Time display */}
                    <motion.div
                        className="timer-font text-5xl font-light text-ink"
                        animate={{
                            opacity: status === 'completed' ? [1, 0.5, 1] : 1,
                        }}
                        transition={status === 'completed' ? { duration: 1, repeat: Infinity } : undefined}
                    >
                        {displayTime}
                    </motion.div>

                    {/* Status label */}
                    <motion.div
                        className="text-xs text-ink-soft mt-2 uppercase tracking-widest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {status === 'idle' && 'drag edge to set'}
                        {status === 'adjusting' && `${displayMinutes} min`}
                        {status === 'committing' && 'release to start'}
                        {status === 'running' && 'focusing'}
                        {status === 'paused' && 'paused'}
                        {status === 'completed' && 'complete'}
                    </motion.div>

                    {/* Gesture hints */}
                    {status === 'running' && (
                        <motion.div
                            className="absolute bottom-8 text-xs text-stone-dark"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 2 }}
                        >
                            flick up to cancel
                        </motion.div>
                    )}
                </div>

                {/* Edge indicator for drag affordance */}
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
                            opacity: isDragging ? 0.8 : 0.3,
                            scale: isDragging ? 1.02 : 1,
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
}
