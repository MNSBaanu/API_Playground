import { useEffect, useMemo, useState } from "react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { CollectionSidebar } from "./CollectionSidebar";
import { EnvironmentManager } from "./EnvironmentManager";
import {
  loadActiveEnvId,
  loadCollections,
  loadEnvironments,
  saveActiveEnvId,
  saveCollections,
  saveEnvironments,
} from "@/lib/api-playground/storage";
import type {
  Collection,
  Environment,
  RequestState,
  ResponseResult,
  SavedRequest,
} from "@/lib/api-playground/types";
import { METHODS_WITH_BODY } from "@/lib/api-playground/types";
import { buildVarMap, resolveVars } from "@/lib/api-playground/variables";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2 } from "lucide-react";

const DEFAULT_REQUEST: RequestState = {
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/todos/1",
  headers: [],
  body: "",
};

const NONE = "__none__";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function Playground() {
  const [request, setRequest] = useState<RequestState>(DEFAULT_REQUEST);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [envOpen, setEnvOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ResponseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setCollections(loadCollections());
    setEnvironments(loadEnvironments());
    setActiveEnvId(loadActiveEnvId());
  }, []);

  const persistCollections = (next: Collection[]) => {
    setCollections(next);
    saveCollections(next);
  };
  const persistEnvironments = (next: Environment[]) => {
    setEnvironments(next);
    saveEnvironments(next);
  };
  const persistActiveEnv = (id: string | null) => {
    setActiveEnvId(id);
    saveActiveEnvId(id);
  };

  const activeEnv = useMemo(
    () => environments.find((e) => e.id === activeEnvId) ?? null,
    [environments, activeEnvId],
  );
  const varMap = useMemo(() => buildVarMap(activeEnv), [activeEnv]);

  const handleSend = async () => {
    setBodyError(null);
    setError(null);
    setResult(null);

    const url = resolveVars(request.url, varMap);

    const headers: Record<string, string> = {};
    for (const h of request.headers) {
      const key = resolveVars(h.key, varMap).trim();
      if (key) headers[key] = resolveVars(h.value, varMap);
    }

    let bodyInit: string | undefined;
    if (METHODS_WITH_BODY.includes(request.method) && request.body.trim()) {
      const resolvedBody = resolveVars(request.body, varMap);
      try {
        JSON.parse(resolvedBody);
        bodyInit = resolvedBody;
        if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
          headers["Content-Type"] = "application/json";
        }
      } catch (e) {
        setBodyError(`Invalid JSON: ${(e as Error).message}`);
        return;
      }
    }

    setSending(true);
    const start = performance.now();
    try {
      const res = await fetch(url, { method: request.method, headers, body: bodyInit });
      const text = await res.text();
      const timeMs = Math.round(performance.now() - start);

      let bodyOut = text;
      let isJson = false;
      try {
        const parsed = JSON.parse(text);
        bodyOut = JSON.stringify(parsed, null, 2);
        isJson = true;
      } catch {
        /* keep raw text */
      }

      const headersOut: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        headersOut[k] = v;
      });

      setResult({
        status: res.status,
        statusText: res.statusText,
        headers: headersOut,
        body: bodyOut,
        isJson,
        timeMs,
        sizeBytes: new Blob([text]).size,
      });
    } catch (e) {
      setError((e as Error).message || "Network error");
    } finally {
      setSending(false);
    }
  };

  // Collections
  const handleCreateCollection = (name: string) =>
    persistCollections([...collections, { id: uid(), name, requests: [] }]);
  const handleRenameCollection = (id: string, name: string) =>
    persistCollections(collections.map((c) => (c.id === id ? { ...c, name } : c)));
  const handleDeleteCollection = (id: string) =>
    persistCollections(collections.filter((c) => c.id !== id));
  const handleSaveCurrentTo = (collectionId: string, name: string) => {
    const saved: SavedRequest = { id: uid(), name, request, createdAt: Date.now() };
    persistCollections(
      collections.map((c) =>
        c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c,
      ),
    );
    setActiveRequestId(saved.id);
  };
  const handleLoad = (item: SavedRequest) => {
    setRequest(item.request);
    setActiveRequestId(item.id);
    setResult(null);
    setError(null);
    setBodyError(null);
  };
  const handleRenameRequest = (collectionId: string, requestId: string, name: string) =>
    persistCollections(
      collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.map((r) => (r.id === requestId ? { ...r, name } : r)),
            }
          : c,
      ),
    );
  const handleDuplicateRequest = (collectionId: string, requestId: string) =>
    persistCollections(
      collections.map((c) => {
        if (c.id !== collectionId) return c;
        const idx = c.requests.findIndex((r) => r.id === requestId);
        if (idx === -1) return c;
        const orig = c.requests[idx];
        const copy: SavedRequest = {
          ...orig,
          id: uid(),
          name: `${orig.name} (copy)`,
          createdAt: Date.now(),
        };
        const next = [...c.requests];
        next.splice(idx + 1, 0, copy);
        return { ...c, requests: next };
      }),
    );
  const handleDeleteRequest = (collectionId: string, requestId: string) => {
    persistCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
          : c,
      ),
    );
    if (activeRequestId === requestId) setActiveRequestId(null);
  };
  const handleMoveRequest = (fromId: string, requestId: string, toId: string) => {
    if (fromId === toId) return;
    const from = collections.find((c) => c.id === fromId);
    const req = from?.requests.find((r) => r.id === requestId);
    if (!from || !req) return;
    persistCollections(
      collections.map((c) => {
        if (c.id === fromId)
          return { ...c, requests: c.requests.filter((r) => r.id !== requestId) };
        if (c.id === toId) return { ...c, requests: [...c.requests, req] };
        return c;
      }),
    );
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <h1 className="text-lg font-semibold tracking-tight">API Playground</h1>
        <span className="text-xs text-muted-foreground">Internal HTTP request tool</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Environment</span>
          <Select
            value={activeEnvId ?? NONE}
            onValueChange={(v) => persistActiveEnv(v === NONE ? null : v)}
          >
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="No environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No environment</SelectItem>
              {environments.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({e.variables.length})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setEnvOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Manage
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <CollectionSidebar
          collections={collections}
          activeRequestId={activeRequestId}
          currentRequest={request}
          onLoad={handleLoad}
          onCreateCollection={handleCreateCollection}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onSaveCurrentTo={handleSaveCurrentTo}
          onRenameRequest={handleRenameRequest}
          onDuplicateRequest={handleDuplicateRequest}
          onDeleteRequest={handleDeleteRequest}
          onMoveRequest={handleMoveRequest}
        />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            <RequestEditor
              value={request}
              onChange={setRequest}
              onSend={handleSend}
              sending={sending}
              bodyError={bodyError}
              vars={varMap}
            />
            <div>
              <h2 className="mb-2 text-sm font-semibold">Response</h2>
              <ResponseViewer result={result} error={error} sending={sending} />
            </div>
          </div>
        </main>
      </div>

      <EnvironmentManager
        open={envOpen}
        onOpenChange={setEnvOpen}
        environments={environments}
        onChange={persistEnvironments}
        activeEnvId={activeEnvId}
        onActiveChange={persistActiveEnv}
      />
    </div>
  );
}
