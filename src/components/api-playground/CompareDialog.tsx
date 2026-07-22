import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { diffLines } from "@/lib/api-playground/diff";
import type { HistoryEntry } from "@/lib/api-playground/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  left: HistoryEntry | null;
  right: HistoryEntry | null;
};

function formatTs(ts: number) {
  return new Date(ts).toLocaleString();
}

function tryPretty(entry: HistoryEntry) {
  if (!entry.isJson) return entry.body;
  try {
    return JSON.stringify(JSON.parse(entry.body), null, 2);
  } catch {
    return entry.body;
  }
}

function Meta({ label, entry }: { label: string; entry: HistoryEntry }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {entry.status != null && (
        <Badge variant="outline" className="font-mono">
          {entry.status}
        </Badge>
      )}
      {entry.timeMs != null && (
        <span className="text-muted-foreground">{entry.timeMs} ms</span>
      )}
      <span className="ml-auto text-muted-foreground">
        {formatTs(entry.timestamp)}
      </span>
    </div>
  );
}

export function CompareDialog({ open, onOpenChange, left, right }: Props) {
  const rows = useMemo(() => {
    if (!left || !right) return [];
    return diffLines(tryPretty(left), tryPretty(right));
  }, [left, right]);

  const stats = useMemo(() => {
    let adds = 0;
    let dels = 0;
    for (const r of rows) {
      if (r.type === "add") adds++;
      else if (r.type === "del") dels++;
    }
    return { adds, dels };
  }, [rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Compare responses
            {left && right && (
              <span className="text-xs font-normal text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{stats.adds}
                </span>{" "}
                <span className="text-destructive">-{stats.dels}</span>
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {!left || !right ? (
          <p className="text-sm text-muted-foreground">
            Select two history entries to compare.
          </p>
        ) : (
          <div className="grid grid-cols-2 overflow-hidden rounded-md border">
            <div className="border-r">
              <Meta label="A" entry={left} />
            </div>
            <div>
              <Meta label="B" entry={right} />
            </div>
            <ScrollArea className="col-span-2 h-[520px]">
              <div className="grid grid-cols-2 font-mono text-xs">
                <div className="border-r">
                  {rows.map((r, i) => (
                    <div
                      key={`l-${i}`}
                      className={
                        r.type === "del"
                          ? "bg-destructive/15 px-3 py-0.5 text-destructive"
                          : r.type === "add"
                            ? "px-3 py-0.5 text-muted-foreground/40"
                            : "px-3 py-0.5"
                      }
                    >
                      <span className="mr-2 select-none text-muted-foreground/60">
                        {r.type === "del" ? "-" : r.type === "add" ? " " : " "}
                      </span>
                      <span className="whitespace-pre-wrap break-all">
                        {r.left ?? ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  {rows.map((r, i) => (
                    <div
                      key={`r-${i}`}
                      className={
                        r.type === "add"
                          ? "bg-emerald-500/15 px-3 py-0.5 text-emerald-700 dark:text-emerald-400"
                          : r.type === "del"
                            ? "px-3 py-0.5 text-muted-foreground/40"
                            : "px-3 py-0.5"
                      }
                    >
                      <span className="mr-2 select-none text-muted-foreground/60">
                        {r.type === "add" ? "+" : r.type === "del" ? " " : " "}
                      </span>
                      <span className="whitespace-pre-wrap break-all">
                        {r.right ?? ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
