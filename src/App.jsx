import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZenTimer } from './components/ZenTimer';
import { TodoList } from './components/TodoList/TodoList';
import { Notes } from './components/Notes/Notes';
import { Calendar } from './components/Calendar/Calendar';
import { FocusStats, useRecordSession, useRecordStart } from './components/Stats/FocusStats';
import { BreathingExercise } from './components/Breathing/BreathingExercise';
import { BottomNav } from './components/Navigation/BottomNav';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import './index.css';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('timer');
  const recordSession = useRecordSession();
  const recordStart = useRecordStart();

  const handleSessionComplete = useCallback((durationSeconds) => {
    recordSession(durationSeconds);
  }, [recordSession]);

  const handleSessionStart = useCallback((durationSeconds) => {
    recordStart(durationSeconds);
  }, [recordStart]);

  const scrollableTabs = ['tasks', 'notes', 'calendar', 'stats'];
  const needsScroll = scrollableTabs.includes(activeTab);

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--theme-paper)', color: 'var(--theme-ink)' }}
    >
      {/* Top bar with theme toggle */}
      <div className="pt-safe flex-shrink-0 flex justify-end items-center px-4 py-2">
        <ThemeToggle />
      </div>

      <main className={`flex-1 overflow-hidden ${needsScroll ? 'scrollable' : ''}`}>
        <div className="app-container h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'timer' && (
              <motion.div key="timer" className="h-full flex items-center justify-center px-4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <ZenTimer onSessionComplete={handleSessionComplete} onSessionStart={handleSessionStart} />
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div key="tasks" className="py-4 px-4 pb-20" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <TodoList />
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div key="notes" className="py-4 px-4 pb-20 h-full" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Notes />
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div key="calendar" className="py-4 px-4 pb-20" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Calendar />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div key="stats" className="py-4 px-4 pb-20" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <FocusStats />
              </motion.div>
            )}

            {activeTab === 'breathe' && (
              <motion.div key="breathe" className="h-full flex items-center justify-center px-4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <BreathingExercise />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
