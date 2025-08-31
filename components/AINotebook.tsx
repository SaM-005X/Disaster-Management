import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { AINote } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckSquareIcon } from './icons/CheckSquareIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SaveIcon } from './icons/SaveIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import * as aiNotebookService from '../services/aiNotebookService';
import ErrorMessage from './ErrorMessage';
// FIX: Import missing XIcon and PencilIcon components used in the component.
import { XIcon } from './icons/XIcon';
import { PencilIcon } from './icons/PencilIcon';

type AINoteFilter = 'all' | 'notes' | 'tasks';

interface AINotebookProps {
    notes: AINote[];
    onAddNote: (noteData: Omit<AINote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateNote: (note: AINote) => void;
    onDeleteNote: (noteId: string) => void;
}

const AINotebook: React.FC<AINotebookProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
    const { translate } = useTranslate();
    const [selectedNote, setSelectedNote] = useState<AINote | null>(null);
    const [filter, setFilter] = useState<AINoteFilter>('all');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    const [aiResponses, setAiResponses] = useState<Record<string, { summary?: string; steps?: string; explanation?: string; }>>({});
    const [isLoadingAI, setIsLoadingAI] = useState<Record<string, boolean>>({});
    const [aiError, setAiError] = useState<string | null>(null);
    
    const isAddingRef = useRef(false);

    useEffect(() => {
        // If the selected note is deleted from the main list, deselect it.
        // Ignore this check when creating a new note (which has a temporary 'new' id).
        if (selectedNote && selectedNote.id !== 'new' && !notes.find(n => n.id === selectedNote.id)) {
            setSelectedNote(null);
            setIsEditing(false);
        }
    }, [notes, selectedNote]);

    // This effect handles selecting the new note after it has been added to the main list.
    useEffect(() => {
        if (isAddingRef.current && notes.length > 0) {
            // App sorts new notes to the top, so notes[0] is the one we just added.
            const newestNote = notes[0];
            if (newestNote) {
                 setSelectedNote(newestNote);
            }
            isAddingRef.current = false; // Reset the flag
        }
    }, [notes]);
    

    const handleSelectNote = (note: AINote) => {
        if (isEditing) {
            if (!window.confirm(translate("You have unsaved changes. Are you sure you want to discard them?"))) {
                return;
            }
        }
        setSelectedNote(note);
        setIsEditing(false); // Reset editing state when selecting a new note
        // Clear any AI responses from previously selected notes to avoid showing stale data.
        if (!aiResponses[note.id]) {
             setAiResponses(prev => ({...prev, [note.id]: {}}));
        }
    };
    
    const handleNewNote = (isTask: boolean) => {
        if (isEditing) {
             if (!window.confirm(translate("You have unsaved changes. Are you sure you want to discard them?"))) {
                return;
            }
        }
        const newNote: AINote = {
            id: 'new',
            userId: '',
            title: '',
            content: '',
            isTask,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setSelectedNote(newNote);
        setEditTitle('');
        setEditContent('');
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!selectedNote) return;

        const noteData = {
            title: editTitle.trim() || (selectedNote.isTask ? translate('Untitled Task') : translate('Untitled Note')),
            content: editContent.trim(),
            isTask: selectedNote.isTask,
            isCompleted: selectedNote.isCompleted,
        };

        if (selectedNote.id === 'new') {
            isAddingRef.current = true;
            onAddNote(noteData);
        } else {
            const updatedNote = { ...selectedNote, ...noteData };
            onUpdateNote(updatedNote);
            setSelectedNote(updatedNote);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (selectedNote?.id === 'new') {
            setSelectedNote(null);
        }
    };

    const handleToggleComplete = (note: AINote) => {
        const updatedNote = { ...note, isCompleted: !note.isCompleted };
        onUpdateNote(updatedNote);
         // If the currently selected note is the one being toggled, update its state in the view
        if (selectedNote && selectedNote.id === note.id) {
            setSelectedNote(updatedNote);
        }
    };

    const handleDelete = (noteId: string) => {
        onDeleteNote(noteId);
    };
    
    const callAiService = useCallback(async (action: 'summary' | 'steps' | 'explanation', note: AINote) => {
        const key = `${note.id}-${action}`;
        setIsLoadingAI(prev => ({ ...prev, [key]: true }));
        setAiError(null);
        try {
            let result;
            if (action === 'summary') {
                result = await aiNotebookService.summarizeContent(note.content);
            } else if (action === 'steps') {
                result = await aiNotebookService.suggestNextSteps(note.content, note.title);
            } else {
                result = await aiNotebookService.explainConcept(note.content);
            }
            setAiResponses(prev => ({ ...prev, [note.id]: { ...prev[note.id], [action]: result } }));
        } catch (err) {
            if (err instanceof Error) setAiError(err.message);
        } finally {
            setIsLoadingAI(prev => ({ ...prev, [key]: false }));
        }
    }, []);

    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            if (filter === 'notes') return !note.isTask;
            if (filter === 'tasks') return note.isTask;
            return true;
        });
    }, [notes, filter]);

    const formatDateTime = (isoString: string) => {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    }

    const aiButtonClasses = "flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-sm transition-colors py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-10rem)]">
            {/* Notes List */}
            <aside className="w-full md:w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col p-4">
                <div className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{translate('My Notebook')}</h2>
                    <div className="mt-2 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            {(['all', 'notes', 'tasks'] as AINoteFilter[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`${filter === f ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize`}>
                                    {translate(f)}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                    {filteredNotes.map(note => (
                        <button key={note.id} onClick={() => handleSelectNote(note)} className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${selectedNote?.id === note.id ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            {note.isTask && (
                                <button onClick={(e) => { e.stopPropagation(); handleToggleComplete(note); }} className="mt-1">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${note.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-gray-400'}`}>
                                        {note.isCompleted && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </button>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className={`font-semibold text-gray-900 dark:text-white truncate ${note.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{note.title || translate('Untitled Note')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{note.content.substring(0, 50) || translate('No content')}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                     <button onClick={() => handleNewNote(false)} className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">
                        <BookOpenIcon className="h-5 w-5" /><span>{translate('New Note')}</span>
                    </button>
                     <button onClick={() => handleNewNote(true)} className="flex-1 flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-full hover:bg-sky-700 transition-colors">
                        <CheckSquareIcon className="h-5 w-5" /><span>{translate('New Task')}</span>
                    </button>
                </div>
            </aside>

            {/* Editor / Placeholder */}
            <main className="w-full md:w-2/3 xl:w-3/4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col">
                {!selectedNote ? (
                    <div className="m-auto text-center text-gray-500 dark:text-gray-400">
                        <ClipboardListIcon className="h-20 w-20 mx-auto" />
                        <h3 className="mt-4 text-xl font-semibold">{translate('Select a note to view or create a new one.')}</h3>
                    </div>
                ) : isEditing ? (
                    <>
                        <div className="flex-shrink-0 flex justify-between items-center mb-4">
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder={selectedNote.isTask ? translate('Task Title') : translate('Note Title')} className="text-3xl font-bold bg-transparent focus:outline-none w-full text-gray-800 dark:text-white" />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200"><SaveIcon className="h-5 w-5"/></button>
                                <button onClick={handleCancel} className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"><XIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder={translate("Start writing your notes here...")} className="flex-1 w-full bg-transparent focus:outline-none text-gray-700 dark:text-gray-300 resize-none text-lg leading-relaxed"></textarea>
                    </>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex-shrink-0 flex justify-between items-start gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                           <div>
                                <h1 className={`text-4xl font-extrabold text-gray-900 dark:text-white ${selectedNote.isCompleted ? 'line-through' : ''}`}>{selectedNote.title}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{translate('Last updated')}: {formatDateTime(selectedNote.updatedAt)}</p>
                           </div>
                           <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => { setIsEditing(true); setEditTitle(selectedNote.title); setEditContent(selectedNote.content); }} className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"><PencilIcon className="h-5 w-5"/></button>
                                <button onClick={() => handleDelete(selectedNote.id)} className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-w-none pr-2">
                           <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800 dark:text-gray-200">{selectedNote.content || <span className="text-gray-400 italic">{translate('This note is empty.')}</span>}</p>
                        </div>
                        <div className="flex-shrink-0 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">{translate('AI Actions')}</h3>
                            {aiError && <ErrorMessage message={aiError} />}
                             <div className="flex flex-wrap gap-2">
                                <button onClick={() => callAiService('summary', selectedNote)} disabled={!selectedNote.content || isLoadingAI[`${selectedNote.id}-summary`]} className={aiButtonClasses}>
                                    <FileTextIcon className="h-5 w-5" /> {isLoadingAI[`${selectedNote.id}-summary`] ? translate('Summarizing...') : translate('Summarize')}
                                </button>
                                <button onClick={() => callAiService('steps', selectedNote)} disabled={!selectedNote.content || isLoadingAI[`${selectedNote.id}-steps`]} className={aiButtonClasses}>
                                    <ClipboardListIcon className="h-5 w-5" /> {isLoadingAI[`${selectedNote.id}-steps`] ? translate('Suggesting...') : translate('Suggest Steps')}
                                </button>
                                <button onClick={() => callAiService('explanation', selectedNote)} disabled={!selectedNote.content || isLoadingAI[`${selectedNote.id}-explanation`]} className={aiButtonClasses}>
                                    <LightbulbIcon className="h-5 w-5" /> {isLoadingAI[`${selectedNote.id}-explanation`] ? translate('Explaining...') : translate('Explain Concept')}
                                </button>
                             </div>
                             {Object.values(aiResponses[selectedNote.id] ?? {}).some(Boolean) && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4 max-h-64 overflow-y-auto text-sm text-gray-800 dark:text-gray-200">
                                    {aiResponses[selectedNote.id]?.summary && (
                                        <div><strong>{translate('Summary')}:</strong><div dangerouslySetInnerHTML={{ __html: aiResponses[selectedNote.id]!.summary! }} /></div>
                                    )}
                                    {aiResponses[selectedNote.id]?.steps && (
                                        <div><strong>{translate('Suggested Steps')}:</strong><div dangerouslySetInnerHTML={{ __html: aiResponses[selectedNote.id]!.steps! }} /></div>
                                    )}
                                    {aiResponses[selectedNote.id]?.explanation && (
                                        <div><strong>{translate('Explanation')}:</strong><div dangerouslySetInnerHTML={{ __html: aiResponses[selectedNote.id]!.explanation! }} /></div>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AINotebook;