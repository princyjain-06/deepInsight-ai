import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, User, BrainCircuit, Lightbulb, Image as ImageIcon,
  ChevronLeft, Upload, Mic, X, Save, Copy, Trash2, Check, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { HandWrittenTitle } from './components/ui/hand-writing-text';
import ConfirmModal from './components/ui/ConfirmModal';
import QuizModal from './components/ui/QuizModal';

export default function NotesWorkspace({ onBack }) {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);

  // AI States per note to prevent cross-note leaking
  const [aiStates, setAiStates] = useState({});

  const activeAi = aiStates[activeNoteId] || {};
  const pendingMindMap = activeAi.pendingMindMap || null;
  const isGeneratingMindMap = activeAi.isGeneratingMindMap || false;
  const pendingInfographic = activeAi.pendingInfographic || null;
  const isGeneratingInfographic = activeAi.isGeneratingInfographic || false;
  const quizData = activeAi.quizData || null;
  const isGeneratingQuiz = activeAi.isGeneratingQuiz || false;
  const showQuiz = activeAi.showQuiz || false;

  const setAiState = (noteId, updates) => {
    if (!noteId) return;
    setAiStates(prev => ({
      ...prev,
      [noteId]: { ...(prev[noteId] || {}), ...updates }
    }));
  };

  // Modal & toast
  const [contextMenu, setContextMenu] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: ''
  });
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  // Voice recording
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const activeNoteIdRef = useRef(null);
  const baseContentRef = useRef('');
  const fileInputRef = useRef(null);

  const username = localStorage.getItem('username') || 'Demo User';
  const userEmail = localStorage.getItem('email') || 'test@example.com';

  // ── Toast helper ────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => { fetchNotesFromBackend(); }, []);

  useEffect(() => { activeNoteIdRef.current = activeNoteId; }, [activeNoteId]);

  // ── Speech recognition ──────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNotes(prev => prev.map(n => {
        if (n.id === activeNoteIdRef.current) {
          return {
            ...n,
            content: baseContentRef.current + (baseContentRef.current && transcript ? ' ' : '') + transcript
          };
        }
        return n;
      }));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  // ── API calls ────────────────────────────────────────────────────────────
  const fetchNotesFromBackend = async () => {
    if (!userEmail || userEmail === 'test@example.com') return; // no identity, skip
    try {
      const res = await fetch(`http://localhost:8081/api/notes/my-notes`, {
        credentials: 'include',
        headers: {
          'X-User-Email': userEmail
        }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(note => ({
          ...note,
          media: note.mediaContent ? JSON.parse(note.mediaContent) : [],
          preview: note.content ? note.content.substring(0, 50) + '...' : 'Empty note...'
        }));
        if (formatted.length > 0) {
          setNotes(formatted);
          setActiveNoteId(formatted[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    if (!userEmail || userEmail === 'test@example.com') {
      showToast('Cannot save: user email not found. Please log in again.', 'error');
      return;
    }
    // Temp IDs from Date.now() are always > 1e12; real DB IDs are small numbers
    const isNew = activeNote.id > 1_000_000_000_000;
    const url = isNew
      ? 'http://localhost:8081/api/notes'
      : `http://localhost:8081/api/notes/${activeNote.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        credentials: 'include',
        body: JSON.stringify({
          title: activeNote.title || 'Untitled Note',
          content: activeNote.content || '',
          media: JSON.stringify(activeNote.media || []),
          email: userEmail
        })
      });

      if (response.ok) {
        const savedNote = await response.json();
        const updated = {
          ...savedNote,
          media: savedNote.mediaContent ? JSON.parse(savedNote.mediaContent) : [],
          preview: savedNote.content ? savedNote.content.substring(0, 50) + '...' : 'Empty note...'
        };
        setNotes(prev => prev.map(n => n.id === activeNote.id ? updated : n));
        if (isNew) setActiveNoteId(savedNote.id);
        showToast('Note saved successfully!', 'success');
      } else {
        const errData = await response.text();
        showToast('Failed to save: ' + errData, 'error');
      }
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error connecting to server.', 'error');
    }
  };

  const generateMindMap = async () => {
    const noteId = activeNote.id;
    setAiState(noteId, { isGeneratingMindMap: true });
    try {
      const response = await fetch('http://localhost:8081/api/research/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content })
      });
      if (response.ok) {
        const mermaidCode = await response.text();
        setAiState(noteId, { pendingMindMap: { code: mermaidCode, id: Date.now() } });
      } else {
        showToast('Failed to generate mind map.', 'error');
      }
    } catch (err) {
      console.error('Mind Map error:', err);
      showToast('Error generating mind map.', 'error');
    } finally {
      setAiState(noteId, { isGeneratingMindMap: false });
    }
  };

  const generateQuiz = async () => {
    const noteId = activeNote.id;
    setAiState(noteId, { isGeneratingQuiz: true });
    try {
      const response = await fetch('http://localhost:8081/api/research/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content })
      });
      if (response.ok) {
        const rawText = await response.text();
        // Strip markdown code fences if Gemini wraps the JSON
        const cleaned = rawText.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setAiState(noteId, { quizData: parsed, showQuiz: true });
      } else {
        showToast('Failed to generate quiz.', 'error');
      }
    } catch (err) {
      console.error('Quiz error:', err);
      showToast('Error generating quiz. Please try again.', 'error');
    } finally {
      setAiState(noteId, { isGeneratingQuiz: false });
    }
  };

  const generateInfographic = async () => {
    const noteId = activeNote.id;
    setAiState(noteId, { isGeneratingInfographic: true });
    try {
      const response = await fetch('http://localhost:8081/api/research/infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeNote.content })
      });
      if (response.ok) {
        let htmlCode = await response.text();
        htmlCode = htmlCode.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim();
        setAiState(noteId, { pendingInfographic: { code: htmlCode, id: Date.now() } });
      } else {
        showToast('Failed to generate infographic.', 'error');
      }
    } catch (err) {
      console.error('Infographic error:', err);
      showToast('Error generating infographic.', 'error');
    } finally {
      setAiState(noteId, { isGeneratingInfographic: false });
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewNote = () => {
    const newNote = { id: Date.now(), title: '', content: '', preview: 'New empty note...', media: [] };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const handleCopyToClipboard = () => {
    if (!activeNote?.content) return;
    navigator.clipboard.writeText(activeNote.content);
    showToast('Copied to clipboard!', 'success');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, media: [...(n.media || []), { id: Date.now(), url, name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' }] };
      }
      return n;
    }));
  };

  const handleMindMapClick = () => {
    if (!activeNote?.content?.trim()) {
      showToast('Please add some content first.', 'error');
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Generate Mind Map',
      message: 'Do you want to create a mind map from the current notes? AI will visualize the key concepts and their connections.',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        generateMindMap();
      },
      type: 'mindmap'
    });
  };

  const handleQuizClick = () => {
    if (!activeNote?.content?.trim()) {
      showToast('Please add some content first.', 'error');
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Create Quiz',
      message: 'AI will generate a 10-question multiple-choice quiz based on your current notes. Ready to test your knowledge?',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        generateQuiz();
      },
      type: 'quiz'
    });
  };

  const handleInfographicClick = () => {
    if (!activeNote?.content?.trim()) {
      showToast('Please add some content first.', 'error');
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Generate Infographic',
      message: 'AI will generate a visual infographic summary based on your notes. Proceed?',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        generateInfographic();
      },
      type: 'infographic'
    });
  };

  const handleConfirmMindMap = () => {
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        const mindMapText = '```mermaid\n' + pendingMindMap.code + '\n```';
        return { 
          ...n, 
          content: n.content ? `${n.content}\n\n${mindMapText}` : mindMapText
        };
      }
      return n;
    }));
    setAiState(activeNoteId, { pendingMindMap: null });
  };

  const handleConfirmInfographic = () => {
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return { 
          ...n, 
          media: [...(n.media || []), { id: Date.now(), code: pendingInfographic.code, type: 'infographic' }]
        };
      }
      return n;
    }));
    setAiState(activeNoteId, { pendingInfographic: null });
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, itemId: item.id, type });
  };

  const confirmDeleteMedia = () => {
    if (!contextMenu) return;
    setModalConfig({
      isOpen: true,
      title: 'Delete Asset',
      message: `Are you sure you want to delete this ${contextMenu.type}? This action cannot be undone.`,
      onConfirm: () => {
        setNotes(prev => prev.map(n => {
          if (n.id === activeNoteId) {
            return { ...n, media: n.media.filter(m => m.id !== contextMenu.itemId) };
          }
          return n;
        }));
        setModalConfig(p => ({ ...p, isOpen: false }));
        setContextMenu(null);
      },
      type: 'delete_media'
    });
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      const currentNote = notes.find(n => n.id === activeNoteIdRef.current);
      baseContentRef.current = currentNote?.content || '';
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setNotes(prev => prev.map(n => {
          if (n.id === activeNoteId) {
            return { ...n, media: [...(n.media || []), { id: Date.now(), url, name: file.name, type: 'image' }] };
          }
          return n;
        }));
      }
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };

  const activeNote = notes.find(n => n.id === activeNoteId);
  const filteredNotes = notes.filter(n =>
    (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.preview && n.preview.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen w-full bg-[#111113] text-white flex flex-col overflow-hidden">

      {/* ── TOAST ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] pointer-events-none">
        {toast && (
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-full border shadow-2xl text-sm font-medium backdrop-blur-md animate-in slide-in-from-bottom-3 fade-in duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/90 border-red-500/30 text-red-300'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />
            }
            {toast.message}
          </div>
        )}
      </div>

      {/* ── HEADER ── */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#111113]/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-neutral-400 hover:text-white transition-colors" title="Back to Dashboard">
            <ChevronLeft size={20} />
          </button>
          <div className="font-semibold text-[15px] tracking-tight flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            InsightAI <span className="text-neutral-500 font-normal">/</span> Workspace
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-6 ml-auto max-w-sm">
          <div className="relative group w-full max-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all shadow-inner"
            />
          </div>
          <div
            className="relative w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors shadow-sm"
            onMouseEnter={() => setShowProfileTooltip(true)}
            onMouseLeave={() => setShowProfileTooltip(false)}
          >
            <User size={15} className="text-white" />
            {showProfileTooltip && (
              <div className="absolute top-10 right-0 bg-neutral-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 animate-in fade-in zoom-in duration-200">
                {username}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* LEFT SIDEBAR */}
        <aside className="w-[250px] border-r border-white/5 bg-[#111113] flex flex-col shrink-0 shadow-[5px_0_30px_rgba(0,0,0,0.5)] z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">My Notes</h2>
            </div>
            <button
              onClick={handleNewNote}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={16} /> New Note
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar space-y-1">
            {filteredNotes.length === 0 && (
              <div className="text-xs text-neutral-500 text-center mt-8 px-4 leading-relaxed">
                {searchQuery ? 'No notes match your search.' : 'No notes yet. Create your first note!'}
              </div>
            )}
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${activeNoteId === note.id ? 'bg-white/10 border-white/20' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className={`text-sm font-medium mb-1 truncate ${activeNoteId === note.id ? 'text-white' : 'text-neutral-400'}`}>
                  {note.title || 'Untitled Note'}
                </div>
                <div className="text-xs text-neutral-500 truncate">{note.preview}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER EDITOR */}
        <main className="flex-1 bg-[#111113] flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-6 md:pb-10 pt-0 custom-scrollbar flex flex-col">
            <HandWrittenTitle title="Insight Notes" />

            {notes.length === 0 ? (
              <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-center mt-12">
                <button
                  onClick={handleNewNote}
                  className="flex flex-col items-center gap-6 group scale-95 hover:scale-100 transition-all duration-300"
                >
                  <div className="w-24 h-24 rounded-full bg-[#2a2a35]/60 hover:bg-[#343444] border border-white/10 flex items-center justify-center transition-colors shadow-xl">
                    <Plus size={36} className="text-[#a8b1ff]" />
                  </div>
                  <h3 className="text-3xl font-medium text-white tracking-wide">Create new notebook</h3>
                </button>
              </div>
            ) : (
              <div className="w-full max-w-5xl mx-auto flex-1 min-h-[75vh] flex flex-col bg-white/[0.02] border border-white/10 shadow-lg rounded-2xl p-8 md:p-12 backdrop-blur-sm mt-12 relative z-10">

              {/* Top bar */}
              <div className="flex items-center justify-between gap-4 mb-6 shrink-0 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-neutral-300 transition-all hover:text-white"
                  >
                    <Save size={13} /> Save Note
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-neutral-300 transition-all hover:text-white"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Content
                  </button>
                </div>
              </div>

              {/* Title input */}
              <input
                type="text"
                value={activeNote?.title || ''}
                onChange={(e) => setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: e.target.value } : n))}
                className="w-full bg-transparent text-4xl font-bold text-white placeholder-neutral-700 outline-none mb-6 border-none focus:ring-0 shrink-0"
                placeholder="Untitled Note"
              />

              {/* Mind map generating indicator */}
              {isGeneratingMindMap && (
                <div className="flex items-center gap-3 px-5 py-4 mb-6 rounded-xl bg-purple-500/5 border border-purple-500/20 text-purple-300 shrink-0 animate-in slide-in-from-top-3 fade-in duration-300">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Generating Mind Map...</div>
                    <div className="text-xs text-purple-400/60 mt-0.5">AI is analyzing your notes and building a visual map</div>
                  </div>
                </div>
              )}

              {/* Quiz generating indicator */}
              {isGeneratingQuiz && (
                <div className="flex items-center gap-3 px-5 py-4 mb-6 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 shrink-0 animate-in slide-in-from-top-3 fade-in duration-300">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Generating Quiz...</div>
                    <div className="text-xs text-amber-400/60 mt-0.5">AI is crafting 10 questions from your notes</div>
                  </div>
                </div>
              )}

              {/* Infographic generating indicator */}
              {isGeneratingInfographic && (
                <div className="flex items-center gap-3 px-5 py-4 mb-6 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-300 shrink-0 animate-in slide-in-from-top-3 fade-in duration-300">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <div>
                    <div className="text-sm font-medium">Generating Infographic...</div>
                    <div className="text-xs text-blue-400/60 mt-0.5">AI is designing a visual summary of your notes</div>
                  </div>
                </div>
              )}



              {/* Content textarea */}
              <textarea
                value={activeNote?.content || ''}
                onChange={(e) => setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content: e.target.value } : n))}
                className="flex-1 w-full bg-transparent text-[16px] text-neutral-300 placeholder-neutral-600 outline-none resize-none leading-relaxed border-none focus:ring-0 custom-scrollbar mb-6"
                placeholder="Start writing your research notes..."
              />

              {/* Media & mind map area */}
              {((activeNote?.media && activeNote.media.length > 0) || pendingMindMap || pendingInfographic) && (
                <div className="flex flex-col gap-6 mb-8 shrink-0">
                  {/* Pending Mind Map */}
                  {pendingMindMap && (
                    <div className="relative group rounded-2xl overflow-hidden border border-purple-500/30 bg-purple-500/5 p-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                          <BrainCircuit size={14} /> AI Generated Mind Map
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleConfirmMindMap}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                            title="Keep Mind Map"
                          >
                            <Check size={13} /> Keep
                          </button>
                          <button
                            onClick={() => setAiState(activeNoteId, { pendingMindMap: null })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                            title="Discard"
                          >
                            <X size={13} /> Discard
                          </button>
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-xl p-4 border border-white/5 font-mono text-[13px] text-neutral-300 whitespace-pre-wrap overflow-x-auto max-h-[300px] custom-scrollbar">
                        {pendingMindMap.code}
                      </div>
                    </div>
                  )}

                  {/* Pending Infographic */}
                  {pendingInfographic && (
                    <div className="relative group rounded-2xl overflow-hidden border border-blue-500/30 bg-blue-500/5 p-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                          <ImageIcon size={14} /> AI Generated Infographic
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleConfirmInfographic}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                            title="Keep Infographic"
                          >
                            <Check size={13} /> Keep
                          </button>
                          <button
                            onClick={() => setAiState(activeNoteId, { pendingInfographic: null })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                            title="Discard"
                          >
                            <X size={13} /> Discard
                          </button>
                        </div>
                      </div>
                      <div className="bg-[#111113] rounded-xl p-4 border border-white/5 flex justify-center overflow-x-auto max-h-[600px] custom-scrollbar"
                           dangerouslySetInnerHTML={{ __html: pendingInfographic.code }} />
                    </div>
                  )}

                  {/* Saved media items */}
                  {activeNote?.media?.map(m => (
                    <div
                      key={m.id}
                      className={`relative group rounded-2xl overflow-hidden border border-white/10 bg-black/20 shadow-md flex flex-col ${m.type === 'mindmap' || m.type === 'infographic' ? 'p-6 border-white/20' : 'justify-center items-center'}`}
                      onContextMenu={(e) => handleContextMenu(e, m, m.type)}
                    >
                      {m.type === 'mindmap' ? (
                        <>
                          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-4">
                            <BrainCircuit size={14} /> Mind Map
                          </div>
                          <div className="bg-black/20 rounded-xl p-4 border border-white/5 font-mono text-[13px] text-neutral-300 whitespace-pre-wrap overflow-x-auto max-h-[300px] custom-scrollbar">
                            {m.code}
                          </div>
                        </>
                      ) : m.type === 'infographic' ? (
                        <>
                          <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-4">
                            <ImageIcon size={14} /> Infographic
                          </div>
                          <div className="bg-[#111113] rounded-xl p-4 border border-white/5 flex justify-center overflow-x-auto max-h-[600px] custom-scrollbar"
                               dangerouslySetInnerHTML={{ __html: m.code }} />
                        </>
                      ) : (
                        <img src={m.url} alt={m.name} className="w-full max-h-[50vh] object-contain transition-transform group-hover:scale-[1.02] duration-300" />
                      )}
                      <button
                        onClick={() => {
                          setContextMenu({ x: window.innerWidth / 2, y: window.innerHeight / 2, itemId: m.id, type: m.type });
                          confirmDeleteMedia();
                        }}
                        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center mt-auto transition-all duration-300 ${isDragging ? 'border-purple-500/50 bg-purple-500/10 scale-[1.01]' : 'border-white/10 bg-black/10 hover:border-white/20 hover:bg-black/20'}`}
              >
                <div className="text-neutral-400 text-sm mb-4 pointer-events-none">Drop your files here</div>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-neutral-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <Upload size={14} /> Upload files
                  </button>
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-medium transition-all hover:scale-105 active:scale-95 ${isListening ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'}`}
                  >
                    <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
                    {isListening ? 'Listening...' : 'Dictate Note'}
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </main>

        {/* RIGHT PANEL - STUDIO */}
        <aside className="w-[280px] border-l border-white/5 bg-[#111113] flex flex-col shrink-0 shadow-[-5px_0_30px_rgba(0,0,0,0.5)] z-10">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <BrainCircuit size={16} className="text-white" /> Studio
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Transform your notes into actionable formats.</p>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {/* Mind Map */}
            <button
              onClick={handleMindMapClick}
              disabled={isGeneratingMindMap}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-neutral-800/80 transition-all group text-left hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-white transition-colors mt-0.5">
                {isGeneratingMindMap ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">Mind Map</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {isGeneratingMindMap ? 'Generating...' : 'Visualize connections'}
                </div>
              </div>
            </button>

            {/* Quiz */}
            <button
              onClick={handleQuizClick}
              disabled={isGeneratingQuiz}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-neutral-800/80 transition-all group text-left hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-white transition-colors mt-0.5">
                {isGeneratingQuiz ? <Loader2 size={18} className="animate-spin" /> : <Lightbulb size={18} />}
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">Create Quiz</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {isGeneratingQuiz ? 'Generating...' : 'Test your understanding'}
                </div>
              </div>
            </button>

            {/* Infographic */}
            <button
              onClick={handleInfographicClick}
              disabled={isGeneratingInfographic}
              className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-neutral-800/80 transition-all group text-left hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-white transition-colors mt-0.5">
                {isGeneratingInfographic ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
              </div>
              <div>
                <div className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">Infographic</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {isGeneratingInfographic ? 'Generating...' : 'Generate visual summary'}
                </div>
              </div>
            </button>
          </div>

          <div className="mt-auto p-5 text-center bg-black/20 m-4 rounded-xl border border-white/5">
            <div className="text-xs text-neutral-400 leading-relaxed">Select a tool above to generate insights from the active note.</div>
          </div>
        </aside>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[100] bg-[#111113] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[160px] animate-in fade-in zoom-in duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <button
              onClick={confirmDeleteMedia}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors text-left"
            >
              <Trash2 size={13} /> Delete {contextMenu.type}
            </button>
            <div className="h-[1px] bg-white/5 my-1" />
            <button
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-neutral-400 hover:bg-white/5 transition-colors text-left"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        )}

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          type={modalConfig.type}
          confirmText={modalConfig.type === 'delete_media' ? 'Delete' : 'Yes, proceed'}
          cancelText="Cancel"
          variant={modalConfig.type === 'delete_media' ? 'danger' : 'default'}
        />

        {/* Quiz Modal */}
        <QuizModal
          isOpen={showQuiz}
          questions={quizData || []}
          onClose={() => setAiState(activeNoteId, { showQuiz: false })}
        />
      </div>
    </div>
  );
}
