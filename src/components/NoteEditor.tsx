import React, { useEffect, useState, useRef } from "react";
import { Note, Attachment } from "../types";
import { getAttachmentDataUrl } from "../services/fileService";

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => void;
  onAddAttachment?: (attachment: Attachment) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onAddAttachment, onRemoveAttachment }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [note?.id]);

  useEffect(() => {
    if (note && (title !== (note.title || "") || content !== note.content)) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave(title, content);
      }, 500);
    }
  }, [title, content]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAddAttachment) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Import the function dynamically
        const { createAttachment } = await import("../services/fileService");
        const attachment = await createAttachment(file);
        onAddAttachment(attachment);
      } catch (error) {
        console.error("Failed to add attachment:", error);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    if (type.includes("word") || type.includes("doc")) return "📝";
    if (type.includes("excel") || type.includes("sheet")) return "📊";
    return "📎";
  };

  const handleDownload = (attachment: Attachment) => {
    const dataUrl = getAttachmentDataUrl(attachment);

    if (dataUrl) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = attachment.name;
      link.click();
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <svg className="w-32 h-32 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <p className="text-xl">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 pt-16 md:pt-8">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title..."
        className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 border-none outline-none bg-transparent placeholder-gray-300"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        className="flex-1 text-base md:text-lg border-none outline-none resize-none bg-transparent placeholder-gray-300 mb-4"
      />

      {/* Attachments Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {note.attachments && note.attachments.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {note.attachments.map((attachment) => {
              const dataUrl = getAttachmentDataUrl(attachment);
              const isImage = attachment.type.startsWith("image/");

              return (
                <div key={attachment.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(attachment.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                          {!attachment.uploaded && " • Not synced"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isImage && (
                        <button
                          onClick={() => {
                            if (dataUrl) window.open(dataUrl, "_blank");
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Open in new tab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      {onRemoveAttachment && (
                        <button
                          onClick={() => onRemoveAttachment(attachment.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Inline image preview */}
                  {isImage && dataUrl && (
                    <div className="ml-3 rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={dataUrl}
                        alt={attachment.name}
                        className="w-full max-h-64 object-contain bg-gray-50"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">No attachments yet</p>
        )}
      </div>
    </div>
  );
};
