import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResponseResult } from "@/lib/api-playground/types";

type Props = {
  result: ResponseResult | null;
  error: string | null;
  sending: boolean;
};

function statusVariant(status: number): {
  className: string;
  label: string;
} {
  if (status >= 200 && status < 300)
    return { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", label: "Success" };
  if (status >= 300 && status < 400)
    return { className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30", label: "Redirect" };
  if (status >= 400 && status < 500)
    return { className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", label: "Client error" };
  return { className: "bg-destructive/15 text-destructive border-destructive/30", label: "Server error" };
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ResponseViewer({ result, error, sending }: Props) {
  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">Request failed</p>
        <p className="mt-1 font-mono text-xs text-destructive/90">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {sending ? "Sending request..." : "Response will appear here."}
      </div>
    );
  }

  const s = statusVariant(result.status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline" className={`${s.className} font-mono`}>
          {result.status} {result.statusText}
        </Badge>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{result.timeMs}</span> ms
        </span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{formatSize(result.sizeBytes)}</span>
      </div>

      <Tabs defaultValue="body">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">
            Headers ({Object.keys(result.headers).length})
          </TabsTrigger>
        </TabsList>

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
                <div key={k} className="grid grid-cols-[minmax(140px,1fr)_2fr] gap-3 px-3 py-2 text-xs">
                  <span className="font-mono font-medium">{k}</span>
                  <span className="font-mono text-muted-foreground break-all">{v}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
