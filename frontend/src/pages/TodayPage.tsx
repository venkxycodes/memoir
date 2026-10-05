import { JournalEditor } from "../components/JournalEditor";
import { localDate } from "../lib/api";
export function TodayPage() {
  return <JournalEditor date={localDate()} />;
}
