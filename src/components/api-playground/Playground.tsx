import { useEffect, useMemo, useState } from "react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { CollectionSidebar } from "./CollectionSidebar";
import { EnvironmentManager } from "./EnvironmentManager";
import { VariablesPanel } from "./VariablesPanel";
import { RunCollectionDialog } from "./RunCollectionDialog";
import { CompareDialog } from "./CompareDialog";
import {
  appendHistory,
  clearHistoryFor,
  loadActiveEnvId,
  loadCollections,
  loadEnvironments,
  loadHistoryMap,
  saveActiveEnvId,
  saveCollections,
  saveEnvironments,
  saveHistoryMap,
} from "@/lib/api-playground/storage";
import type {
  Collection,
  Environment,
  Extractor,
  HistoryEntry,
  RequestState,
  ResponseResult,
  RunStep,
  SavedRequest,
} from "@/lib/api-playground/types";
import { METHODS_WITH_BODY } from "@/lib/api-playground/types";
import {
  buildVarMap,
  extractByPath,
  mergeVars,
  resolveVars,
  stringifyExtracted,
} from "@/lib/api-playground/variables";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Braces, Settings2 } from "lucide-react";

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

type PreparedRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  bodyError?: string;
};

function prepareRequest(
  req: RequestState,
  vars: Record<string, string>,
): PreparedRequest {
  const url = resolveVars(req.url, vars);
  const headers: Record<string, string> = {};
  for (const h of req.headers) {
    const key = resolveVars(h.key, vars).trim();
    if (key) headers[key] = resolveVars(h.value, vars);
  }
  let body: string | undefined;
  let bodyError: string | undefined;
  if (METHODS_WITH_BODY.includes(req.method) && req.body.trim()) {
    const resolvedBody = resolveVars(req.body, vars);
    try {
      JSON.parse(resolvedBody);
      body = resolvedBody;
      if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
        headers["Content-Type"] = "application/json";
      }
    } catch (e) {
      bodyError = `Invalid JSON: ${(e as Error).message}`;
    }
  }
  return { url, method: req.method, headers, body, bodyError };
}

async function executeRequest(prepared: PreparedRequest) {
  const start = performance.now();
  const res = await fetch(prepared.url, {
    method: prepared.method,
    headers: prepared.headers,
    body: prepared.body,
  });
  const text = await res.text();
  const timeMs = Math.round(performance.now() - start);
  let parsed: unknown = null;
  let isJson = false;
  let bodyOut = text;
  try {
    parsed = JSON.parse(text);
    bodyOut = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    /* keep raw */
  }
  const headersOut: Record<string, string> = {};
  res.headers.forEach((v, k) => (headersOut[k] = v));
  return {
    result: {
      status: res.status,
      statusText: res.statusText,
      headers: headersOut,
      body: bodyOut,
      isJson,
      timeMs,
      sizeBytes: new Blob([text]).size,
    } satisfies ResponseResult,
    parsed,
    isJson,
  };
}

export function Playground() {
  const [request, setRequest] = useState<RequestState>(DEFAULT_REQUEST);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [sessionVars, setSessionVars] = useState<Record<string, string>>({});

  const [envOpen, setEnvOpen] = useState(false);
  const [varsOpen, setVarsOpen] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ResponseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const [runOpen, setRunOpen] = useState(false);
  const [runCollectionName, setRunCollectionName] = useState<string | null>(null);
  const [runSteps, setRunSteps] = useState<RunStep[]>([]);
  const [runIndex, setRunIndex] = useState(0);
  const [runTotal, setRunTotal] = useState(0);
  const [running, setRunning] = useState(false);

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
  const envVarMap = useMemo(() => buildVarMap(activeEnv), [activeEnv]);
  const varMap = useMemo(
    () => mergeVars(envVarMap, sessionVars),
    [envVarMap, sessionVars],
  );

  const handleSend = async () => {
    setBodyError(null);
    setError(null);
    setResult(null);

    const prepared = prepareRequest(request, varMap);
    if (prepared.bodyError) {
      setBodyError(prepared.bodyError);
      return;
    }

    setSending(true);
    try {
      const { result: res } = await executeRequest(prepared);
      setResult(res);
    } catch (e) {
      setError((e as Error).message || "Network error");
    } finally {
      setSending(false);
    }
  };

  // Session variables
  const setSessionVar = (name: string, value: string) => {
    setSessionVars((s) => ({ ...s, [name]: value }));
  };
  const deleteSessionVar = (name: string) => {
    setSessionVars((s) => {
      const next = { ...s };
      delete next[name];
      return next;
    });
  };
  const clearSessionVars = () => setSessionVars({});

  // Extractor attach (only when a saved request is loaded)
  const handleSaveExtractor = (name: string, path: string) => {
    if (!activeRequestId) return;
    const extractor: Extractor = { id: uid(), name, path };
    persistCollections(
      collections.map((c) => ({
        ...c,
        requests: c.requests.map((r) =>
          r.id === activeRequestId
            ? { ...r, extractors: [...(r.extractors ?? []), extractor] }
            : r,
        ),
      })),
    );
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

  const handleRunCollection = async (collectionId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col || col.requests.length === 0) return;

    setRunCollectionName(col.name);
    setRunSteps([]);
    setRunIndex(0);
    setRunTotal(col.requests.length);
    setRunning(true);
    setRunOpen(true);

    // Local vars snapshot that accumulates during the run.
    let localSession = { ...sessionVars };

    for (let i = 0; i < col.requests.length; i++) {
      const saved = col.requests[i];
      setRunIndex(i);
      const vars = mergeVars(envVarMap, localSession);
      const prepared = prepareRequest(saved.request, vars);

      const extracted: { name: string; value: string | null }[] = [];
      let step: RunStep = {
        requestId: saved.id,
        name: saved.name,
        method: saved.request.method,
        url: prepared.url,
        ok: false,
        extracted,
      };

      if (prepared.bodyError) {
        step = { ...step, error: prepared.bodyError };
        setRunSteps((s) => [...s, step]);
        continue;
      }

      try {
        const { result: res, parsed, isJson } = await executeRequest(prepared);
        step = { ...step, status: res.status, timeMs: res.timeMs, ok: res.status < 400 };

        for (const ex of saved.extractors ?? []) {
          if (!isJson || parsed == null) {
            extracted.push({ name: ex.name, value: null });
            continue;
          }
          const value = extractByPath(parsed, ex.path);
          if (value == null) {
            extracted.push({ name: ex.name, value: null });
          } else {
            const str = stringifyExtracted(value);
            localSession = { ...localSession, [ex.name]: str };
            extracted.push({ name: ex.name, value: str });
          }
        }
      } catch (e) {
        step = { ...step, error: (e as Error).message || "Network error" };
      }

      setRunSteps((s) => [...s, step]);
    }

    setSessionVars(localSession);
    setRunIndex(col.requests.length);
    setRunning(false);
  };

  const sessionVarCount = Object.keys(sessionVars).length;

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <h1 className="text-lg font-semibold tracking-tight">API Playground</h1>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Internal HTTP request tool
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVarsOpen(true)}>
            <Braces className="mr-2 h-4 w-4" />
            Variables
            {sessionVarCount > 0 && (
              <span className="ml-2 rounded bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
                {sessionVarCount}
              </span>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">Env</span>
          <Select
            value={activeEnvId ?? NONE}
            onValueChange={(v) => persistActiveEnv(v === NONE ? null : v)}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
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
          onRunCollection={handleRunCollection}
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
              <ResponseViewer
                result={result}
                error={error}
                sending={sending}
                onSaveVariable={setSessionVar}
                onSaveExtractor={activeRequestId ? handleSaveExtractor : undefined}
                canSaveExtractor={!!activeRequestId}
              />
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

      <VariablesPanel
        open={varsOpen}
        onOpenChange={setVarsOpen}
        sessionVars={sessionVars}
        envVars={envVarMap}
        envName={activeEnv?.name ?? null}
        onDelete={deleteSessionVar}
        onClear={clearSessionVars}
      />

      <RunCollectionDialog
        open={runOpen}
        onOpenChange={(o) => {
          if (!running) setRunOpen(o);
        }}
        collectionName={runCollectionName}
        running={running}
        steps={runSteps}
        currentIndex={runIndex}
        total={runTotal}
      />
    </div>
  );
}
