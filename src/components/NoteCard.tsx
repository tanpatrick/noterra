import React from "react";
import { Note } from "../types";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "../utils/dateFormat";

interface NoteCardProps {
  note: Note;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onSelect, onDelete, isSelected }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-gray-900 text-base">{note.title || "Untitled Note"}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-300 hover:text-gray-400 flex-shrink-0 ml-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-3">{note.content || "No content"}</p>
      <div className="flex items-center justify-between text-xs">
        <StatusBadge synced={note.synced} updatedAt={note.updated_at} />
        <span className="text-gray-400">{formatDate(note.updated_at)}</span>
      </div>
    </div>
  );
};
