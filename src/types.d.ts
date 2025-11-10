export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string; // Supabase URL when synced
  localData?: string; // base64 data for offline storage
  uploaded: boolean;
};

export type Note = {
  id: string;
  title?: string;
  content: string;
  updated_at: string; // ISO
  synced: boolean;
  attachments?: Attachment[];
};
