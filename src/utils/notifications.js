/**
 * Notification utilities for Zen app
 * Handles browser notifications for timer and meetings
 */

// Check if notifications are supported
export function isNotificationSupported() {
    return 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission() {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission; // 'granted', 'denied', or 'default'
}

// Request notification permission
export async function requestNotificationPermission() {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('Notifications were denied');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

// Show a notification
export function showNotification(title, options = {}) {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        console.warn('Cannot show notification - not permitted');
        return null;
    }

    const defaultOptions = {
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
        ...options,
    };

    try {
        const notification = new Notification(title, defaultOptions);

        notification.onclick = () => {
            window.focus();
            notification.close();
            if (options.onClick) options.onClick();
        };

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        return notification;
    } catch (error) {
        console.error('Error showing notification:', error);
        return null;
    }
}

// Timer complete notification
export function notifyTimerComplete(durationMinutes) {
    return showNotification('Focus Session Complete! 🎉', {
        body: `You completed a ${durationMinutes} minute focus session. Great work!`,
        tag: 'timer-complete',
        requireInteraction: true,
    });
}

// Meeting reminder notification
export function notifyMeetingReminder(meeting, minutesBefore) {
    const timeText = minutesBefore === 0 ? 'now' : `in ${minutesBefore} minutes`;
    return showNotification(`Meeting ${timeText}`, {
        body: meeting.title,
        tag: `meeting-${meeting.id}`,
        requireInteraction: true,
    });
}

// Schedule a notification for a specific time
export function scheduleNotification(title, options, scheduledTime) {
    const now = Date.now();
    const delay = scheduledTime - now;

    if (delay <= 0) {
        // Already passed, show immediately
        return showNotification(title, options);
    }

    const timeoutId = setTimeout(() => {
        showNotification(title, options);
    }, delay);

    return timeoutId;
}

// Cancel a scheduled notification
export function cancelScheduledNotification(timeoutId) {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
}
