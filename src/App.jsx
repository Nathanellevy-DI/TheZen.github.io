import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZenTimer } from './components/ZenTimer';
import { TodoList } from './components/TodoList/TodoList';
import { FocusStats, useRecordSession } from './components/Stats/FocusStats';
import { BreathingExercise } from './components/Breathing/BreathingExercise';
import { BottomNav } from './components/Navigation/BottomNav';
import './index.css';

/**
 * Page transition variants
 */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Main App - Productivity suite with tab navigation
 * Responsive for desktop and iOS PWA
 */
function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const recordSession = useRecordSession();

  const handleSessionComplete = useCallback((durationSeconds) => {
    recordSession(durationSeconds);
  }, [recordSession]);

  return (
    <div className="w-full h-screen bg-paper overflow-hidden flex flex-col">
      {/* Safe area spacer for iOS notch/dynamic island */}
      <div className="pt-safe flex-shrink-0" />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'timer' && (
            <motion.div
              key="timer"
              className="h-full"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <ZenTimer onSessionComplete={handleSessionComplete} />
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              className="min-h-full py-4 px-safe"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <TodoList />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              className="min-h-full py-4 px-safe"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <FocusStats />
            </motion.div>
          )}

          {activeTab === 'breathe' && (
            <motion.div
              key="breathe"
              className="h-full px-safe"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <BreathingExercise />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation with safe area */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
