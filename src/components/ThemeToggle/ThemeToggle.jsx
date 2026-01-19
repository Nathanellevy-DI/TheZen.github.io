import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle - Premium claymorphism toggle switch
 * Feels like a physical, tactile switch molded from the surface
 * Inspired by teenage engineering / Apple design
 */
export function ThemeToggle() {
    const { theme, toggleTheme, isDark } = useTheme();

    // Spring physics for smooth, satisfying motion
    const springConfig = {
        type: 'spring',
        stiffness: 300,
        damping: 30,
    };

    // Play click sound (placeholder)
    const playClickSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = isDark ? 800 : 600;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported
        }
    };

    const handleToggle = () => {
        playClickSound();
        toggleTheme();
    };

    return (
        <button
            onClick={handleToggle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(); }}
            role="switch"
            aria-checked={isDark}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className={`
        relative w-16 h-8 rounded-full cursor-pointer
        transition-colors duration-300 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${isDark
                    ? 'bg-[#1a1a1a] focus-visible:ring-amber-400 focus-visible:ring-offset-[#1a1a1a]'
                    : 'bg-[#e8e8e8] focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-[#f4f4f4]'
                }
      `}
            style={{
                boxShadow: isDark
                    ? 'inset 4px 4px 8px #0a0a0a, inset -4px -4px 8px #2a2a2a'
                    : 'inset 4px 4px 8px #c8c8c8, inset -4px -4px 8px #ffffff',
            }}
        >
            {/* Track groove effect */}
            <div
                className={`
          absolute inset-1 rounded-full
          transition-colors duration-300
          ${isDark ? 'bg-[#151515]' : 'bg-[#e0e0e0]'}
        `}
                style={{
                    boxShadow: isDark
                        ? 'inset 2px 2px 4px #0a0a0a, inset -2px -2px 4px #1f1f1f'
                        : 'inset 2px 2px 4px #bebebe, inset -2px -2px 4px #ffffff',
                }}
            />

            {/* Thumb - The moving tactile button */}
            <motion.div
                className={`
          absolute top-1 w-6 h-6 rounded-full
          flex items-center justify-center
          transition-colors duration-300
        `}
                initial={false}
                animate={{
                    x: isDark ? 32 : 4,
                    scale: 1,
                }}
                whileTap={{ scale: 0.9 }}
                transition={springConfig}
                style={{
                    background: isDark
                        ? 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'
                        : 'linear-gradient(145deg, #ffffff, #e8e8e8)',
                    boxShadow: isDark
                        ? '4px 4px 8px #0a0a0a, -2px -2px 6px #3a3a3a, 0 0 12px rgba(251, 191, 36, 0.15)'
                        : '4px 4px 8px #bebebe, -4px -4px 8px #ffffff',
                }}
            >
                {/* Icon */}
                <motion.div
                    initial={false}
                    animate={{
                        rotate: isDark ? 360 : 0,
                        scale: 1,
                    }}
                    transition={springConfig}
                >
                    {isDark ? (
                        <Moon
                            size={14}
                            className="text-amber-400"
                            style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))' }}
                        />
                    ) : (
                        <Sun
                            size={14}
                            className="text-amber-500"
                        />
                    )}
                </motion.div>
            </motion.div>
        </button>
    );
}
