import { useEffect, useState, useRef, useCallback } from "react";
import { Note, Attachment } from "./types";
import { useOnline } from "./hooks/useOnline";
import { useRealtimeNotes } from "./hooks/useRealtimeNotes";
import { usePWAUpdate } from "./hooks/usePWAUpdate";
import { NetworkIndicator } from "./components/NetworkIndicator";
import { NoteCard } from "./components/NoteCard";
import { NoteEditor } from "./components/NoteEditor";
import { UpdatePrompt } from "./components/UpdatePrompt";
import {
  loadNotes,
  createNote,
  updateNote,
  deleteNote,
  syncNotes,
  addAttachmentToNote,
  removeAttachmentFromNote,
} from "./services/noteService";

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [lastPulled, setLastPulled] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const online = useOnline();
  const syncingRef = useRef(false);

  const handleRealtimeUpdate = useCallback(() => {
    load();
  }, []);

  // Subscribe to real-time updates (replaces polling)
  useRealtimeNotes(online, handleRealtimeUpdate);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (online) {
      handleSync().catch((err) => console.error("sync err", err));
    }
  }, [online]);

  useEffect(() => {
    if (selectedNote) {
      const updated = notes.find((n) => n.id === selectedNote.id);
      if (updated) {
        setSelectedNote(updated);
      }
    }
  }, [notes]);

  async function load() {
    const n = await loadNotes();
    setNotes(n);
  }

  async function handleCreateNote() {
    const note = await createNote();
    await load();
    setSelectedNote(note);
    setShowSidebar(false); // Hide sidebar on mobile when selecting a note
    if (online) await handleSync();
  }

  async function handleUpdateNote(title: string, content: string) {
    if (!selectedNote) return;
    await updateNote(selectedNote, title, content);
    await load();
    if (online) await handleSync();
  }

  async function handleDeleteNote(id: string) {
    await deleteNote(id, online);
    await load();
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  }

  async function handleAddAttachment(attachment: Attachment) {
    if (!selectedNote) return;
    await addAttachmentToNote(selectedNote, attachment);
    await load();
    if (online) await handleSync();
  }

  async function handleRemoveAttachment(attachmentId: string) {
    if (!selectedNote) return;
    await removeAttachmentFromNote(selectedNote, attachmentId);
    await load();
  }

  async function handleSync() {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const newSyncTime = await syncNotes(lastPulled);
      setLastPulled(newSyncTime);
      await load();
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }

  const pendingCount = notes.filter((n) => !n.synced).length;
  const { needRefresh, updateApp, dismissUpdate } = usePWAUpdate();

  return (
    <div className="flex h-screen bg-gray-50">
      {needRefresh && <UpdatePrompt onUpdate={updateApp} onDismiss={dismissUpdate} />}
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "flex" : "hidden"
        } md:flex w-full md:w-80 bg-white border-r border-gray-200 flex-col`}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
            <NetworkIndicator isOnline={online} lastSyncTime={lastPulled} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateNote}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> New Note
            </button>
            <button
              onClick={() => handleSync()}
              disabled={!online || isSyncing}
              className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sync now"
            >
              <svg
                className={`w-5 h-5 text-gray-600 ${isSyncing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {pendingCount > 0 && (
            <div className="mt-3 text-sm text-orange-600 flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {pendingCount} note{pendingCount > 1 ? "s" : ""} pending sync
            </div>
          )}

          {!online && (
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📱 Working offline - changes will sync when connected
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {notes.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Create your first note!</p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSelect={() => {
                  setSelectedNote(note);
                  setShowSidebar(false); // Hide sidebar on mobile when selecting a note
                }}
                onDelete={() => handleDeleteNote(note.id)}
                isSelected={selectedNote?.id === note.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 bg-white relative`}>
        {/* Mobile back button */}
        <button
          onClick={() => setShowSidebar(true)}
          className="md:hidden absolute top-4 left-4 z-10 p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          aria-label="Back to notes list"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <NoteEditor
          note={selectedNote}
          onSave={handleUpdateNote}
          onAddAttachment={handleAddAttachment}
          onRemoveAttachment={handleRemoveAttachment}
        />
      </div>
    </div>
  );
}
