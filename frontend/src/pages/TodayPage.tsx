import { JournalEditor } from "../components/JournalEditor";
import { localDate } from "../lib/api";
export function TodayPage({ onDeleted }: { onDeleted: () => void }) {
  return <JournalEditor date={localDate()} onDeleted={onDeleted} />;
}
