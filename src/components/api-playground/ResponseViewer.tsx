import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookmarkPlus, Save } from "lucide-react";
import type { HistoryEntry, ResponseResult } from "@/lib/api-playground/types";
import { extractByPath, stringifyExtracted } from "@/lib/api-playground/variables";
import { HistoryPanel } from "./HistoryPanel";

type Props = {
  result: ResponseResult | null;
  error: string | null;
  sending: boolean;
  onSaveVariable: (name: string, value: string) => void;
  onSaveExtractor?: (name: string, path: string) => void;
  canSaveExtractor: boolean;
  history: HistoryEntry[];
  historySelectedIds: string[];
  onToggleHistorySelect: (id: string) => void;
  onLoadHistoryEntry: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  onCompareHistory: () => void;
};

function statusVariant(status: number) {
  if (status >= 200 && status < 300)
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (status >= 300 && status < 400)
    return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  if (status >= 400 && status < 500)
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ExtractPanel({
  result,
  onSaveVariable,
  onSaveExtractor,
  canSaveExtractor,
}: {
  result: ResponseResult;
  onSaveVariable: (name: string, value: string) => void;
  onSaveExtractor?: (name: string, path: string) => void;
  canSaveExtractor: boolean;
}) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");

  const parsed = useMemo(() => {
    if (!result.isJson) return null;
    try {
      return JSON.parse(result.body);
    } catch {
      return null;
    }
  }, [result.body, result.isJson]);

  const previewValue = useMemo(() => {
    if (parsed == null || !path.trim()) return null;
    return extractByPath(parsed, path);
  }, [parsed, path]);

  const previewString = previewValue == null ? "" : stringifyExtracted(previewValue);

  if (!result.isJson) {
    return (
      <p className="text-xs text-muted-foreground">
        Response is not JSON — cannot extract by path.
      </p>
    );
  }

  const canSave = !!name.trim() && !!path.trim() && previewValue != null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Extract a value from the JSON response and save it as a variable for later requests. Paths
        use dot/bracket notation, e.g. <code className="font-mono">data.token</code> or{" "}
        <code className="font-mono">users[0].id</code>.
      </p>
      <div className="grid grid-cols-[1fr_1.5fr] gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Variable name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AUTH_TOKEN"
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">JSON path</label>
          <Input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="data.token"
            className="mt-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-2">
        <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
          Preview
        </div>
        {path.trim() === "" ? (
          <span className="text-xs text-muted-foreground">Enter a path to preview the value.</span>
        ) : previewValue == null ? (
          <span className="font-mono text-xs text-destructive">No value at this path.</span>
        ) : (
          <span className="break-all font-mono text-xs text-emerald-700 dark:text-emerald-400">
            {previewString || "(empty string)"}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!canSave}
          onClick={() => {
            onSaveVariable(name.trim(), previewString);
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Save as variable
        </Button>
        {onSaveExtractor && (
          <Button
            size="sm"
            variant="outline"
            disabled={!canSave || !canSaveExtractor}
            title={
              canSaveExtractor
                ? "Persist this extractor on the loaded saved request so it runs during Run Collection"
                : "Load a saved request first to attach an extractor"
            }
            onClick={() => onSaveExtractor(name.trim(), path.trim())}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Attach to request
          </Button>
        )}
      </div>
    </div>
  );
}

export function ResponseViewer({
  result,
  error,
  sending,
  onSaveVariable,
  onSaveExtractor,
  canSaveExtractor,
  history,
  historySelectedIds,
  onToggleHistorySelect,
  onLoadHistoryEntry,
  onClearHistory,
  onCompareHistory,
}: Props) {
  const hasResponse = !!result || !!error;
  const [tab, setTab] = useState(result ? "body" : "history");

  useEffect(() => {
    if (result) setTab("body");
  }, [result]);

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Request failed</p>
          <p className="mt-1 font-mono text-xs text-destructive/90">{error}</p>
        </div>
      )}

      {!hasResponse && (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {sending ? "Sending request..." : "Response will appear here."}
        </div>
      )}

      {result && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className={`${statusVariant(result.status)} font-mono`}>
            {result.status} {result.statusText}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{result.timeMs}</span> ms
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{formatSize(result.sizeBytes)}</span>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="body" disabled={!result}>
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" disabled={!result}>
            Headers{result ? ` (${Object.keys(result.headers).length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="extract" disabled={!result}>
            Extract
          </TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        {result && (
          <>
            <TabsContent value="body">
              <ScrollArea className="h-[380px] rounded-md border bg-muted/30">
                <pre className="p-4 font-mono text-xs leading-relaxed">
                  {result.body || <span className="text-muted-foreground">(empty)</span>}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="headers">
              <ScrollArea className="h-[380px] rounded-md border">
                <div className="divide-y">
                  {Object.entries(result.headers).map(([k, v]) => (
                    <div
                      key={k}
                      className="grid grid-cols-[minmax(140px,1fr)_2fr] gap-3 px-3 py-2 text-xs"
                    >
                      <span className="font-mono font-medium">{k}</span>
                      <span className="break-all font-mono text-muted-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="extract">
              <div className="rounded-md border p-4">
                <ExtractPanel
                  result={result}
                  onSaveVariable={onSaveVariable}
                  onSaveExtractor={onSaveExtractor}
                  canSaveExtractor={canSaveExtractor}
                />
              </div>
            </TabsContent>
          </>
        )}

        <TabsContent value="history">
          <div className="rounded-md border">
            <HistoryPanel
              entries={history}
              selectedIds={historySelectedIds}
              onToggleSelect={onToggleHistorySelect}
              onLoadEntry={onLoadHistoryEntry}
              onClear={onClearHistory}
              onCompare={onCompareHistory}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
