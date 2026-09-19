import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sessionVars: Record<string, string>;
  envVars: Record<string, string>;
  envName: string | null;
  onDelete: (name: string) => void;
  onClear: () => void;
};

function Row({
  name,
  value,
  source,
  overridden,
  onDelete,
}: {
  name: string;
  value: string;
  source: "session" | "env";
  overridden?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr_auto_auto] items-center gap-3 px-3 py-2 text-xs">
      <span className="truncate font-mono font-medium">{name}</span>
      <span
        className={`truncate font-mono ${overridden ? "text-muted-foreground line-through" : ""}`}
        title={value}
      >
        {value || <span className="italic text-muted-foreground">(empty)</span>}
      </span>
      <span
        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
          source === "session" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {source}
      </span>
      {onDelete ? (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <span className="w-6" />
      )}
    </div>
  );
}

export function VariablesPanel({
  open,
  onOpenChange,
  sessionVars,
  envVars,
  envName,
  onDelete,
  onClear,
}: Props) {
  const sessionEntries = Object.entries(sessionVars).sort(([a], [b]) => a.localeCompare(b));
  const envEntries = Object.entries(envVars).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variables</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Session variables</h3>
                <p className="text-xs text-muted-foreground">
                  Extracted from responses. Override environment variables. Cleared on page reload.
                </p>
              </div>
              {sessionEntries.length > 0 && (
                <Button variant="outline" size="sm" onClick={onClear}>
                  Clear all
                </Button>
              )}
            </div>
            <div className="rounded-md border">
              <ScrollArea className="max-h-64">
                {sessionEntries.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">
                    No session variables yet. Extract a value from a response to save one.
                  </p>
                ) : (
                  <div className="divide-y">
                    {sessionEntries.map(([k, v]) => (
                      <Row
                        key={k}
                        name={k}
                        value={v}
                        source="session"
                        onDelete={() => onDelete(k)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>

          <section>
            <div className="mb-2">
              <h3 className="text-sm font-semibold">
                Environment variables
                {envName && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({envName})
                  </span>
                )}
              </h3>
            </div>
            <div className="rounded-md border">
              <ScrollArea className="max-h-64">
                {envEntries.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">
                    No active environment or no variables defined.
                  </p>
                ) : (
                  <div className="divide-y">
                    {envEntries.map(([k, v]) => (
                      <Row key={k} name={k} value={v} source="env" overridden={k in sessionVars} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
