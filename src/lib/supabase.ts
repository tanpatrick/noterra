import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Note } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// supabase table expected: notes (id primary key text, title text, content text, updated_at timestamptz)
// This file contains simple push/pull helpers.
export async function pushNoteToServer(note: Note) {
  const { data, error } = await supabase.from("notes").upsert({
    id: note.id,
    title: note.title,
    content: note.content,
    updated_at: note.updated_at,
    attachments: note.attachments || [],
  });
  if (error) throw error;
  return data;
}

export async function pullNotesSince(sinceISO?: string): Promise<Note[]> {
  let q = supabase.from("notes").select("id,title,content,updated_at,attachments");
  if (sinceISO) {
    q = q.gt("updated_at", sinceISO) as any;
  }
  const { data, error } = await q;
  if (error) throw error;
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    updated_at: r.updated_at,
    attachments: r.attachments || [],
    synced: true,
  }));
}

// Get all note IDs from server (for deletion detection)
export async function getAllServerNoteIds(): Promise<string[]> {
  const { data, error } = await supabase.from("notes").select("id");
  if (error) throw error;
  if (!data) return [];
  return data.map((r: any) => r.id);
}

export async function deleteNoteFromServer(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

// Real-time subscription types
export type NoteChangeEvent = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Note | null;
  old: { id: string } | null;
};

export type NoteChangeCallback = (event: NoteChangeEvent) => void;

// Subscribe to real-time changes
export function subscribeToNotes(callback: NoteChangeCallback) {
  const channel = supabase
    .channel("notes-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notes",
      },
      (payload: any) => {
        callback({
          eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          new: payload.new
            ? {
                id: payload.new.id,
                title: payload.new.title,
                content: payload.new.content,
                updated_at: payload.new.updated_at,
                attachments: payload.new.attachments || [],
                synced: true,
              }
            : null,
          old: payload.old ? { id: payload.old.id } : null,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
