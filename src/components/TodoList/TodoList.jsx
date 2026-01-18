import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { Check, Trash2, Plus } from 'lucide-react';

/**
 * Generate a unique ID for todos
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate and sanitize todo item
 */
function sanitizeTodo(todo) {
    if (!todo || typeof todo !== 'object') return null;

    return {
        id: typeof todo.id === 'string' ? todo.id : generateId(),
        text: typeof todo.text === 'string' ? todo.text.slice(0, 200) : '',
        completed: typeof todo.completed === 'boolean' ? todo.completed : false,
        createdAt: typeof todo.createdAt === 'number' ? todo.createdAt : Date.now(),
    };
}

/**
 * TodoItem - Individual todo with swipe-to-complete gesture
 */
function TodoItem({ item, onToggle, onDelete }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSwipeEnd = (e, info) => {
        if (info.offset.x > 100) {
            onToggle(item.id);
        } else if (info.offset.x < -100) {
            setIsDeleting(true);
            setTimeout(() => onDelete(item.id), 200);
        }
    };

    return (
        <Reorder.Item
            value={item}
            id={item.id}
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: isDeleting ? 0 : 1,
                y: 0,
                x: isDeleting ? -200 : 0,
            }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {/* Swipe indicators behind */}
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <div className="text-green-600 opacity-30">
                    <Check size={20} />
                </div>
                <div className="text-red-500 opacity-30">
                    <Trash2 size={20} />
                </div>
            </div>

            <motion.div
                className={`relative bg-paper rounded-2xl p-4 mb-3 cursor-grab active:cursor-grabbing ${item.completed ? 'shadow-clay-pressed' : 'shadow-clay-soft'
                    }`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={handleSwipeEnd}
                whileDrag={{ scale: 1.02 }}
            >
                <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                        onClick={() => onToggle(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed
                                ? 'bg-ink border-ink'
                                : 'border-stone-dark hover:border-ink'
                            }`}
                    >
                        {item.completed && <Check size={14} className="text-paper" />}
                    </button>

                    {/* Text */}
                    <span className={`flex-1 text-ink transition-all ${item.completed ? 'line-through opacity-50' : ''
                        }`}>
                        {item.text}
                    </span>

                    {/* Delete button */}
                    <button
                        onClick={() => {
                            setIsDeleting(true);
                            setTimeout(() => onDelete(item.id), 200);
                        }}
                        className="p-2 text-stone-dark hover:text-ink transition-colors opacity-0 hover:opacity-100"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </motion.div>
        </Reorder.Item>
    );
}

/**
 * TodoList - Gesture-driven task list
 */
export function TodoList() {
    const [todos, setTodos] = useState(() => {
        const stored = getStorageItem('todos', []);
        return Array.isArray(stored)
            ? stored.map(sanitizeTodo).filter(Boolean)
            : [];
    });

    const [newTodoText, setNewTodoText] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);

    // Save to storage when todos change
    useEffect(() => {
        setStorageItem('todos', todos);
    }, [todos]);

    const addTodo = useCallback(() => {
        const trimmed = newTodoText.trim();
        if (!trimmed || trimmed.length > 200) return;

        const newTodo = sanitizeTodo({
            id: generateId(),
            text: trimmed,
            completed: false,
            createdAt: Date.now(),
        });

        if (newTodo) {
            setTodos(prev => [newTodo, ...prev]);
            setNewTodoText('');
            setIsAddingNew(false);
        }
    }, [newTodoText]);

    const toggleTodo = useCallback((id) => {
        setTodos(prev => prev.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    }, []);

    const deleteTodo = useCallback((id) => {
        setTodos(prev => prev.filter(todo => todo.id !== id));
    }, []);

    const handleReorder = useCallback((newOrder) => {
        setTodos(newOrder);
    }, []);

    const completedCount = todos.filter(t => t.completed).length;
    const totalCount = todos.length;

    return (
        <div className="w-full max-w-md mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-medium text-ink">Tasks</h2>
                    <p className="text-sm text-stone-dark">
                        {completedCount}/{totalCount} completed
                    </p>
                </div>

                {/* Add button */}
                <motion.button
                    onClick={() => setIsAddingNew(true)}
                    className="w-12 h-12 rounded-full bg-paper shadow-clay flex items-center justify-center text-ink hover:shadow-clay-hover transition-shadow"
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={24} />
                </motion.button>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="mb-6">
                    <div className="h-2 bg-stone rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-ink rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>
            )}

            {/* New todo input */}
            <AnimatePresence>
                {isAddingNew && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="bg-paper rounded-2xl p-4 shadow-clay-soft">
                            <input
                                type="text"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value.slice(0, 200))}
                                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                                placeholder="What needs to be done?"
                                className="w-full bg-transparent text-ink placeholder-stone-dark outline-none"
                                autoFocus
                                maxLength={200}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        setIsAddingNew(false);
                                        setNewTodoText('');
                                    }}
                                    className="px-4 py-2 text-sm text-stone-dark hover:text-ink transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addTodo}
                                    disabled={!newTodoText.trim()}
                                    className="px-4 py-2 text-sm bg-ink text-paper rounded-xl disabled:opacity-30 transition-opacity"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Todo list */}
            <Reorder.Group
                axis="y"
                values={todos}
                onReorder={handleReorder}
                className="space-y-0"
            >
                <AnimatePresence mode="popLayout">
                    {todos.map((item) => (
                        <TodoItem
                            key={item.id}
                            item={item}
                            onToggle={toggleTodo}
                            onDelete={deleteTodo}
                        />
                    ))}
                </AnimatePresence>
            </Reorder.Group>

            {/* Empty state */}
            {todos.length === 0 && !isAddingNew && (
                <motion.div
                    className="text-center py-12 text-stone-dark"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-lg mb-2">No tasks yet</p>
                    <p className="text-sm">Tap + to add your first task</p>
                </motion.div>
            )}

            {/* Gesture hints */}
            {todos.length > 0 && (
                <motion.div
                    className="text-center text-xs text-stone-dark mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 2 }}
                >
                    swipe right to complete • swipe left to delete • drag to reorder
                </motion.div>
            )}
        </div>
    );
}
