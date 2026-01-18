/**
 * Math utilities for radial drag gesture
 * Converts touch coordinates to timer values
 */

/**
 * Calculate angle from center point (0 = top, clockwise)
 * @param {number} touchX - Touch X coordinate
 * @param {number} touchY - Touch Y coordinate
 * @param {number} centerX - Circle center X
 * @param {number} centerY - Circle center Y
 * @returns {number} Angle in radians (0 to 2π)
 */
export function getAngleFromCenter(touchX, touchY, centerX, centerY) {
    const dx = touchX - centerX;
    const dy = touchY - centerY;

    // atan2 with -dy to start from top (12 o'clock position)
    let angle = Math.atan2(dx, -dy);

    // Normalize to 0–2π
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    return angle;
}

/**
 * Convert angle to minutes (0-60)
 * @param {number} angle - Angle in radians
 * @param {number} maxMinutes - Maximum minutes (default 60)
 * @returns {number} Minutes value
 */
export function angleToMinutes(angle, maxMinutes = 60) {
    const minutes = (angle / (2 * Math.PI)) * maxMinutes;
    return Math.max(0, Math.min(maxMinutes, minutes));
}

/**
 * Snap value to nearest increment
 * @param {number} value - Value to snap
 * @param {number} increment - Snap increment (default 5)
 * @returns {number} Snapped value
 */
export function snapToIncrement(value, increment = 5) {
    return Math.round(value / increment) * increment;
}

/**
 * Convert minutes to angle in radians
 * @param {number} minutes - Minutes value
 * @param {number} maxMinutes - Maximum minutes (default 60)
 * @returns {number} Angle in radians
 */
export function minutesToAngle(minutes, maxMinutes = 60) {
    return (minutes / maxMinutes) * 2 * Math.PI;
}

/**
 * Check if point is on circle edge (for radial drag detection)
 * @param {number} touchX - Touch X
 * @param {number} touchY - Touch Y
 * @param {number} centerX - Circle center X
 * @param {number} centerY - Circle center Y
 * @param {number} radius - Circle radius
 * @param {number} threshold - Edge threshold (0-1, default 0.3 = 30% from edge)
 * @returns {boolean} True if touch is on edge
 */
export function isOnCircleEdge(touchX, touchY, centerX, centerY, radius, threshold = 0.3) {
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const innerBound = radius * (1 - threshold);
    const outerBound = radius * 1.1; // Allow slight overshoot

    return distance >= innerBound && distance <= outerBound;
}

/**
 * Calculate velocity from movement delta
 * @param {number} deltaX - X movement
 * @param {number} deltaY - Y movement
 * @param {number} deltaTime - Time in ms
 * @returns {number} Velocity in px/s
 */
export function calculateVelocity(deltaX, deltaY, deltaTime) {
    if (deltaTime <= 0) return 0;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return (distance / deltaTime) * 1000;
}

/**
 * Format minutes as MM:SS display
 * @param {number} totalSeconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clamp value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
