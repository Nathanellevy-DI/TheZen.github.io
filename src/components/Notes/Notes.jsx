import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, FileText, Tag } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../../utils/storage';

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function extractKeywords(text) {
    // Extract words, remove common words, lowercase
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'any', 'this', 'that', 'these', 'those', 'am', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom'];

    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)];
}

export function Notes() {
    const [notes, setNotes] = useState(() => getStorageItem('notes', []));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        setStorageItem('notes', notes);
    }, [notes]);

    // Filter notes by search query (searches title, content, and keywords)
    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notes;

        const query = searchQuery.toLowerCase().trim();
        const queryWords = query.split(/\s+/);

        return notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(query);
            const contentMatch = note.content.toLowerCase().includes(query);
            const keywordMatch = note.keywords?.some(kw =>
                queryWords.some(qw => kw.includes(qw) || qw.includes(kw))
            );
            return titleMatch || contentMatch || keywordMatch;
        });
    }, [notes, searchQuery]);

    const createNote = () => {
        const newNote = {
            id: generateId(),
            title: 'Untitled Note',
            content: '',
            keywords: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote);
        setEditTitle(newNote.title);
        setEditContent(newNote.content);
        setIsEditing(true);
    };

    const saveNote = () => {
        if (!selectedNote) return;

        const keywords = extractKeywords(editTitle + ' ' + editContent);

        setNotes(prev => prev.map(n =>
            n.id === selectedNote.id
                ? { ...n, title: editTitle.trim() || 'Untitled', content: editContent, keywords, updatedAt: new Date().toISOString() }
                : n
        ));
        setIsEditing(false);
    };

    const deleteNote = (noteId) => {
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
            setSelectedNote(null);
            setIsEditing(false);
        }
    };

    const openNote = (note) => {
        setSelectedNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
        setIsEditing(false);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full max-w-md mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-ink">Notes</h2>
                <button
                    onClick={createNote}
                    className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-dark" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by keywords..."
                    className="w-full bg-stone rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-stone-dark outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-dark"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Note Editor */}
            <AnimatePresence>
                {selectedNote && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-paper rounded-2xl p-4 shadow-clay-soft mb-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => { setEditTitle(e.target.value); setIsEditing(true); }}
                                placeholder="Note title"
                                className="flex-1 text-base font-medium text-ink bg-transparent outline-none"
                            />
                            <div className="flex gap-2">
                                {isEditing && (
                                    <button onClick={saveNote} className="text-xs text-ink font-medium">
                                        Save
                                    </button>
                                )}
                                <button onClick={() => setSelectedNote(null)} className="text-stone-dark">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={editContent}
                            onChange={(e) => { setEditContent(e.target.value); setIsEditing(true); }}
                            placeholder="Start typing your note..."
                            className="w-full h-40 bg-stone rounded-xl p-3 text-sm text-ink placeholder-stone-dark outline-none resize-none"
                        />

                        {/* Keywords */}
                        {selectedNote.keywords?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                <Tag size={12} className="text-stone-dark" />
                                {selectedNote.keywords.slice(0, 8).map((kw, i) => (
                                    <span key={i} className="text-xs text-stone-dark bg-stone px-2 py-0.5 rounded">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => deleteNote(selectedNote.id)}
                            className="mt-3 text-xs text-red-500"
                        >
                            Delete note
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {filteredNotes.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={32} className="mx-auto text-stone-dark mb-2" />
                        <p className="text-sm text-stone-dark">
                            {searchQuery ? 'No notes match your search' : 'No notes yet'}
                        </p>
                        {!searchQuery && (
                            <button onClick={createNote} className="mt-2 text-sm text-ink underline">
                                Create your first note
                            </button>
                        )}
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <motion.button
                            key={note.id}
                            onClick={() => openNote(note)}
                            className={`w-full text-left p-3 rounded-xl transition-colors ${selectedNote?.id === note.id ? 'bg-stone-dark' : 'bg-stone hover:bg-stone-dark/50'
                                }`}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-ink text-sm truncate">{note.title}</p>
                                    <p className="text-xs text-stone-dark truncate mt-0.5">
                                        {note.content.slice(0, 60) || 'No content'}
                                    </p>
                                </div>
                                <span className="text-xs text-stone-dark ml-2 flex-shrink-0">
                                    {formatDate(note.updatedAt)}
                                </span>
                            </div>
                            {note.keywords?.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                    {note.keywords.slice(0, 4).map((kw, i) => (
                                        <span key={i} className="text-[10px] text-stone-dark bg-paper px-1.5 py-0.5 rounded">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
}
