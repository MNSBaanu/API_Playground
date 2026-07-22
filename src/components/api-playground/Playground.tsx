import { useEffect, useState } from "react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { CollectionSidebar } from "./CollectionSidebar";
import { loadCollections, saveCollections } from "@/lib/api-playground/storage";
import type {
  Collection,
  RequestState,
  ResponseResult,
  SavedRequest,
} from "@/lib/api-playground/types";
import { METHODS_WITH_BODY } from "@/lib/api-playground/types";

const DEFAULT_REQUEST: RequestState = {
  method: "GET",
  url: "https://jsonplaceholder.typicode.com/todos/1",
  headers: [],
  body: "",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function Playground() {
  const [request, setRequest] = useState<RequestState>(DEFAULT_REQUEST);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ResponseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setCollections(loadCollections());
  }, []);

  const persist = (next: Collection[]) => {
    setCollections(next);
    saveCollections(next);
  };

  const handleSend = async () => {
    setBodyError(null);
    setError(null);
    setResult(null);

    const headers: Record<string, string> = {};
    for (const h of request.headers) {
      if (h.key.trim()) headers[h.key.trim()] = h.value;
    }

    let bodyInit: string | undefined;
    if (METHODS_WITH_BODY.includes(request.method) && request.body.trim()) {
      try {
        JSON.parse(request.body);
        bodyInit = request.body;
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
      const res = await fetch(request.url, {
        method: request.method,
        headers,
        body: bodyInit,
      });
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

  const handleCreateCollection = (name: string) => {
    persist([...collections, { id: uid(), name, requests: [] }]);
  };

  const handleRenameCollection = (id: string, name: string) => {
    persist(collections.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const handleDeleteCollection = (id: string) => {
    persist(collections.filter((c) => c.id !== id));
  };

  const handleSaveCurrentTo = (collectionId: string, name: string) => {
    const saved: SavedRequest = {
      id: uid(),
      name,
      request,
      createdAt: Date.now(),
    };
    persist(
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

  const handleRenameRequest = (collectionId: string, requestId: string, name: string) => {
    persist(
      collections.map((c) =>
        c.id === collectionId
          ? {
              ...c,
              requests: c.requests.map((r) => (r.id === requestId ? { ...r, name } : r)),
            }
          : c,
      ),
    );
  };

  const handleDuplicateRequest = (collectionId: string, requestId: string) => {
    persist(
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
  };

  const handleDeleteRequest = (collectionId: string, requestId: string) => {
    persist(
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
    persist(
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
      <header className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold tracking-tight">API Playground</h1>
        <span className="ml-3 text-xs text-muted-foreground">
          Internal HTTP request tool
        </span>
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
            />
            <div>
              <h2 className="mb-2 text-sm font-semibold">Response</h2>
              <ResponseViewer result={result} error={error} sending={sending} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
