import { v4 as uuidv4 } from "uuid";
import { Note, Attachment } from "../types";
import { saveNoteLocal, listNotesLocal, deleteNoteLocal, addToDeletedQueue, getDeletedQueue, clearDeletedQueue } from "../lib/db";
import { pushNoteToServer, pullNotesSince, deleteNoteFromServer, getAllServerNoteIds } from "../lib/supabase";
import { uploadAttachment } from "./fileService";

export async function loadNotes(): Promise<Note[]> {
  return await listNotesLocal();
}

export async function createNote(): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    title: "Untitled Note",
    content: "",
    updated_at: now,
    synced: false,
    attachments: [],
  };
  await saveNoteLocal(note);
  return note;
}

export async function updateNote(note: Note, title: string, content: string): Promise<Note> {
  const now = new Date().toISOString();
  const updated: Note = {
    ...note,
    title: title || "Untitled Note",
    content,
    updated_at: now,
    synced: false,
  };
  await saveNoteLocal(updated);
  return updated;
}

export async function deleteNote(id: string, isOnline: boolean): Promise<void> {
  // Delete locally
  await deleteNoteLocal(id);

  // If online, delete from server immediately
  if (isOnline) {
    try {
      await deleteNoteFromServer(id);
    } catch (error) {
      console.error("Failed to delete from server, will retry on next sync:", error);
      await addToDeletedQueue(id);
    }
  } else {
    // If offline, queue for deletion when back online
    await addToDeletedQueue(id);
  }
}

export async function syncNotes(lastPulled: string | null): Promise<string> {
  // Process pending deletions first
  const deletedQueue = await getDeletedQueue();
  for (const id of deletedQueue) {
    try {
      await deleteNoteFromServer(id);
    } catch (error) {
      console.error("Failed to delete note from server:", id, error);
    }
  }
  // Clear the deletion queue after processing
  if (deletedQueue.length > 0) {
    await clearDeletedQueue();
  }

  // Push local unsynced notes
  const local = await listNotesLocal();
  const unsynced = local.filter((n) => !n.synced);

  for (const n of unsynced) {
    try {
      // Upload any unuploaded attachments first
      if (n.attachments && n.attachments.length > 0) {
        for (let i = 0; i < n.attachments.length; i++) {
          const attachment = n.attachments[i];
          if (!attachment.uploaded && attachment.localData) {
            try {
              const url = await uploadAttachment(n.id, attachment);
              n.attachments[i] = { ...attachment, url, uploaded: true };
            } catch (uploadError) {
              console.error("Failed to upload attachment", uploadError);
            }
          }
        }
      }

      await pushNoteToServer(n);
      n.synced = true;
      await saveNoteLocal(n);
    } catch (e) {
      console.error("push failed", e);
    }
  }

  // Pull remote notes updated since lastPulled
  const since = lastPulled || undefined;
  const remote = await pullNotesSince(since);

  for (const r of remote) {
    await saveNoteLocal({ ...r, synced: true });
  }

  // Sync cross-device changes: deletions and new notes
  // Get all server note IDs
  const serverNoteIds = await getAllServerNoteIds();
  const serverNoteIdSet = new Set(serverNoteIds);

  // Get all local notes
  const allLocal = await listNotesLocal();
  const localNoteIdSet = new Set(allLocal.map(n => n.id));

  // 1. Find notes that exist locally but not on server (were deleted elsewhere)
  for (const localNote of allLocal) {
    // Only delete if the note is synced (not a new local note)
    if (localNote.synced && !serverNoteIdSet.has(localNote.id)) {
      console.log(`Deleting note ${localNote.id} - deleted on another device`);
      await deleteNoteLocal(localNote.id);
    }
  }

  // 2. Find notes that exist on server but not locally (created on other devices)
  // We need to fetch these notes
  const missingNoteIds = serverNoteIds.filter(id => !localNoteIdSet.has(id));
  if (missingNoteIds.length > 0) {
    console.log(`Found ${missingNoteIds.length} new notes from other devices`);
    // Fetch all notes from server (no time filter) to get the missing ones
    const allRemote = await pullNotesSince(undefined);
    for (const r of allRemote) {
      if (missingNoteIds.includes(r.id)) {
        await saveNoteLocal({ ...r, synced: true });
      }
    }
  }

  return new Date().toISOString();
}

// Add attachment to note
export async function addAttachmentToNote(note: Note, attachment: Attachment): Promise<Note> {
  const now = new Date().toISOString();
  const updated: Note = {
    ...note,
    attachments: [...(note.attachments || []), attachment],
    updated_at: now,
    synced: false,
  };
  await saveNoteLocal(updated);
  return updated;
}

// Remove attachment from note
export async function removeAttachmentFromNote(note: Note, attachmentId: string): Promise<Note> {
  const now = new Date().toISOString();
  const updated: Note = {
    ...note,
    attachments: (note.attachments || []).filter((a) => a.id !== attachmentId),
    updated_at: now,
    synced: false,
  };
  await saveNoteLocal(updated);
  return updated;
}
