/**
 * Secure localStorage utilities with validation and sanitization
 * OWASP compliant - no eval, proper type checking
 */

const STORAGE_PREFIX = 'zen_timer_';
const MAX_VALUE_LENGTH = 1000; // Prevent storage quota attacks

/**
 * Validate and sanitize storage key
 * @param {string} key - Storage key
 * @returns {string} Sanitized key
 */
function sanitizeKey(key) {
    if (typeof key !== 'string') {
        throw new Error('Storage key must be a string');
    }
    // Only allow alphanumeric and underscores
    return STORAGE_PREFIX + key.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Safely get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Parsed value or default
 */
export function getStorageItem(key, defaultValue = null) {
    try {
        const sanitizedKey = sanitizeKey(key);
        const item = localStorage.getItem(sanitizedKey);

        if (item === null) {
            return defaultValue;
        }

        // Length check to prevent parsing huge malicious payloads
        if (item.length > MAX_VALUE_LENGTH) {
            console.warn('Storage value exceeds max length, returning default');
            return defaultValue;
        }

        const parsed = JSON.parse(item);
        return parsed;
    } catch (error) {
        console.warn('Error reading from localStorage:', error.message);
        return defaultValue;
    }
}

/**
 * Safely set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export function setStorageItem(key, value) {
    try {
        const sanitizedKey = sanitizeKey(key);
        const stringified = JSON.stringify(value);

        // Prevent storing excessively large values
        if (stringified.length > MAX_VALUE_LENGTH) {
            console.warn('Value too large to store');
            return false;
        }

        localStorage.setItem(sanitizedKey, stringified);
        return true;
    } catch (error) {
        console.warn('Error writing to localStorage:', error.message);
        return false;
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeStorageItem(key) {
    try {
        const sanitizedKey = sanitizeKey(key);
        localStorage.removeItem(sanitizedKey);
    } catch (error) {
        console.warn('Error removing from localStorage:', error.message);
    }
}

/**
 * Validate timer settings object
 * @param {object} settings - Settings to validate
 * @returns {object} Validated settings with safe defaults
 */
export function validateTimerSettings(settings) {
    const defaults = {
        soundEnabled: true,
        theme: 'light',
        defaultDuration: 25,
    };

    if (!settings || typeof settings !== 'object') {
        return defaults;
    }

    return {
        soundEnabled: typeof settings.soundEnabled === 'boolean'
            ? settings.soundEnabled
            : defaults.soundEnabled,
        theme: ['light', 'dark'].includes(settings.theme)
            ? settings.theme
            : defaults.theme,
        defaultDuration: Number.isInteger(settings.defaultDuration) &&
            settings.defaultDuration >= 1 &&
            settings.defaultDuration <= 120
            ? settings.defaultDuration
            : defaults.defaultDuration,
    };
}
