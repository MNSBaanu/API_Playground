import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompareArrows, RotateCcw, Trash2 } from "lucide-react";
import type { HistoryEntry } from "@/lib/api-playground/types";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  entries: HistoryEntry[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onLoadEntry: (entry: HistoryEntry) => void;
  onClear: () => void;
  onCompare: () => void;
};

function statusColor(status: number | null) {
  if (status == null) return "bg-destructive/15 text-destructive border-destructive/30";
  if (status >= 200 && status < 300)
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (status >= 300 && status < 400)
    return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  if (status >= 400 && status < 500)
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function formatTs(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : d.toLocaleString();
}

export function HistoryPanel({
  entries,
  selectedIds,
  onToggleSelect,
  onLoadEntry,
  onClear,
  onCompare,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  if (entries.length === 0) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        No runs yet. Send the request to record history.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {entries.length} run{entries.length === 1 ? "" : "s"}
          {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            disabled={selectedIds.length !== 2}
            onClick={onCompare}
          >
            <GitCompareArrows className="mr-1.5 h-3.5 w-3.5" />
            Compare
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-muted-foreground"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[340px]">
        <ul className="divide-y">
          {entries.map((e) => {
            const checked = selectedIds.includes(e.id);
            const disabled = !checked && selectedIds.length >= 2;
            return (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => onToggleSelect(e.id)}
                  aria-label="Select for compare"
                />
                <Badge variant="outline" className={`${statusColor(e.status)} font-mono`}>
                  {e.status ?? "ERR"}
                </Badge>
                <span className="w-16 shrink-0 font-mono text-[11px] font-medium">{e.method}</span>
                <span className="w-20 shrink-0 text-muted-foreground">
                  {e.timeMs != null ? `${e.timeMs} ms` : "—"}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {formatTs(e.timestamp)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => onLoadEntry(e)}
                  title="Show this response above"
                  aria-label="Show this response"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <ConfirmDialog
        open={confirmClear}
        title="Clear history?"
        description="All recorded runs for this request will be deleted."
        confirmLabel="Clear"
        onConfirm={onClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
