import { motion, AnimatePresence } from 'framer-motion';

/**
 * Drop Zone Component
 * Top commitment zone where dragging the circle starts the timer
 */
export function DropZone({ isActive, isHovered }) {
    return (
        <div className="absolute top-0 left-0 right-0 h-32 flex items-center justify-center pointer-events-none z-10">
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: isHovered ? 1.1 : 1,
                        }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25
                        }}
                        className="relative"
                    >
                        {/* Outer glow when hovered */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                                boxShadow: isHovered
                                    ? '0 0 40px rgba(26, 26, 26, 0.15), 0 0 80px rgba(26, 26, 26, 0.08)'
                                    : '0 0 20px rgba(26, 26, 26, 0.05)',
                            }}
                            style={{
                                width: 80,
                                height: 80,
                                transform: 'translate(-50%, -50%)',
                                left: '50%',
                                top: '50%',
                            }}
                        />

                        {/* Drop target circle */}
                        <motion.div
                            className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center"
                            animate={{
                                borderColor: isHovered ? '#1A1A1A' : '#C4C4C4',
                                backgroundColor: isHovered ? 'rgba(26, 26, 26, 0.05)' : 'transparent',
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Arrow indicator */}
                            <motion.svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                animate={{
                                    opacity: isHovered ? 1 : 0.4,
                                    scale: isHovered ? 1.2 : 1,
                                }}
                                className="text-ink"
                            >
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </motion.svg>
                        </motion.div>

                        {/* Label */}
                        <motion.span
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-ink-soft whitespace-nowrap"
                            animate={{ opacity: isHovered ? 1 : 0.5 }}
                        >
                            {isHovered ? 'Release to start' : 'Drop to begin'}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
