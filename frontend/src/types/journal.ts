export type JournalEntry = {
  id: number;
  title: string | null;
  content: string;
  entry_date: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
};
export type EntryPreview = Pick<JournalEntry, "id" | "title" | "entry_date"> & {
  preview: string;
};
export type EntryList = {
  results: EntryPreview[];
  next_cursor?: string | null;
};
export type View = "Today" | "Journal" | "Rediscover" | "Search";
