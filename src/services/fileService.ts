import { v4 as uuidv4 } from "uuid";
import { Attachment } from "../types";
import { supabase } from "../lib/supabase";

const BUCKET_NAME = "note-attachments";

// Convert file to base64 for local storage
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert base64 to blob
export function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

// Create attachment from file
export async function createAttachment(file: File): Promise<Attachment> {
  const localData = await fileToBase64(file);
  return {
    id: uuidv4(),
    name: file.name,
    size: file.size,
    type: file.type,
    localData,
    uploaded: false,
  };
}

// Upload attachment to Supabase Storage
export async function uploadAttachment(noteId: string, attachment: Attachment): Promise<string> {
  if (!attachment.localData) {
    throw new Error("No local data to upload");
  }

  const blob = base64ToBlob(attachment.localData);
  const filePath = `${noteId}/${attachment.id}-${attachment.name}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, {
      contentType: attachment.type,
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Delete attachment from Supabase Storage
export async function deleteAttachment(noteId: string, attachmentId: string, fileName: string): Promise<void> {
  const filePath = `${noteId}/${attachmentId}-${fileName}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) throw error;
}

// Download attachment data (for display)
export function getAttachmentDataUrl(attachment: Attachment): string {
  if (attachment.localData) {
    return attachment.localData;
  }
  if (attachment.url) {
    return attachment.url;
  }
  return "";
}
