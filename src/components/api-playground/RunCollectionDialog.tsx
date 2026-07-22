import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { RunStep } from "@/lib/api-playground/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  collectionName: string | null;
  running: boolean;
  steps: RunStep[];
  currentIndex: number;
  total: number;
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-purple-600 dark:text-purple-400",
  DELETE: "text-destructive",
};

export function RunCollectionDialog({
  open,
  onOpenChange,
  collectionName,
  running,
  steps,
  currentIndex,
  total,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Run collection{collectionName ? `: ${collectionName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {running
              ? `Running ${currentIndex + 1} of ${total}...`
              : `Completed ${steps.length} of ${total} requests.`}
          </p>

          <div className="rounded-md border">
            <ScrollArea className="max-h-[420px]">
              {steps.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">Preparing...</p>
              ) : (
                <ul className="divide-y">
                  {steps.map((s, i) => {
                    const active = running && i === currentIndex;
                    return (
                      <li key={`${s.requestId}-${i}`} className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">
                            {active ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : s.ok ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </span>
                          <div className="flex-1 space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-2 text-sm">
                              <span
                                className={`font-mono text-[10px] font-bold ${
                                  METHOD_COLORS[s.method] ?? ""
                                }`}
                              >
                                {s.method}
                              </span>
                              <span className="font-medium">{s.name}</span>
                              {s.status !== undefined && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {s.status} · {s.timeMs} ms
                                </span>
                              )}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {s.url}
                            </div>
                            {s.error && (
                              <div className="font-mono text-xs text-destructive">
                                {s.error}
                              </div>
                            )}
                            {s.extracted.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {s.extracted.map((e, j) => (
                                  <span
                                    key={j}
                                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                                      e.value !== null
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                        : "bg-destructive/15 text-destructive"
                                    }`}
                                    title={e.value ?? "not found"}
                                  >
                                    {e.name}
                                    {e.value !== null ? " ✓" : " ✗"}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} disabled={running}>
            {running ? "Running..." : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
