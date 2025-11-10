import { set, get, del, keys } from 'idb-keyval'
import { Note } from '../types'

const NOTES_KEY_PREFIX = 'note:'
const DELETED_NOTES_KEY = 'deleted_notes'

export async function saveNoteLocal(note: Note) {
  await set(NOTES_KEY_PREFIX + note.id, note)
}

export async function getNoteLocal(id: string): Promise<Note | undefined> {
  return await get(NOTES_KEY_PREFIX + id)
}

export async function deleteNoteLocal(id: string) {
  await del(NOTES_KEY_PREFIX + id)
}

export async function listNotesLocal(): Promise<Note[]> {
  const allKeys = await keys()
  const noteKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(NOTES_KEY_PREFIX)) as string[]
  const notes = []
  for (const k of noteKeys) {
    const n = await get(k) as Note | undefined
    if (n) notes.push(n)
  }
  // sort by updated_at desc
  notes.sort((a,b)=> b.updated_at.localeCompare(a.updated_at))
  return notes
}

// Track deleted note IDs for offline sync
export async function addToDeletedQueue(id: string) {
  const deleted = await get(DELETED_NOTES_KEY) as string[] | undefined
  const queue = deleted || []
  if (!queue.includes(id)) {
    queue.push(id)
    await set(DELETED_NOTES_KEY, queue)
  }
}

export async function getDeletedQueue(): Promise<string[]> {
  return (await get(DELETED_NOTES_KEY) as string[] | undefined) || []
}

export async function clearDeletedQueue() {
  await del(DELETED_NOTES_KEY)
}
