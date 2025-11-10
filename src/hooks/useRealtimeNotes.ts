import { useEffect } from "react";
import { subscribeToNotes, NoteChangeEvent } from "../lib/supabase";
import { saveNoteLocal, deleteNoteLocal } from "../lib/db";

export function useRealtimeNotes(isOnline: boolean, onUpdate: () => void) {
  useEffect(() => {
    if (!isOnline) return;

    const unsubscribe = subscribeToNotes(async (event: NoteChangeEvent) => {
      try {
        if (event.eventType === "INSERT" || event.eventType === "UPDATE") {
          if (event.new) {
            await saveNoteLocal(event.new);
            onUpdate();
          }
        } else if (event.eventType === "DELETE") {
          if (event.old?.id) {
            await deleteNoteLocal(event.old.id);
            onUpdate();
          }
        }
      } catch (error) {
        console.error("Error handling real-time update:", error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline, onUpdate]);
}
