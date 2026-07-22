import { useEffect, useState } from "react";
import { RequestEditor } from "./RequestEditor";
import { ResponseViewer } from "./ResponseViewer";
import { CollectionSidebar } from "./CollectionSidebar";
import { loadCollection, saveCollection } from "@/lib/api-playground/storage";
import type {
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
  const [collection, setCollection] = useState<SavedRequest[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<ResponseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  useEffect(() => {
    setCollection(loadCollection());
  }, []);

  const persist = (next: SavedRequest[]) => {
    setCollection(next);
    saveCollection(next);
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

  const handleSave = (name: string) => {
    const saved: SavedRequest = {
      id: uid(),
      name,
      request,
      createdAt: Date.now(),
    };
    persist([saved, ...collection]);
  };

  const handleLoad = (item: SavedRequest) => {
    setRequest(item.request);
    setResult(null);
    setError(null);
    setBodyError(null);
  };

  const handleDelete = (id: string) => {
    persist(collection.filter((c) => c.id !== id));
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
          items={collection}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onSave={handleSave}
          canSave={!!request.url}
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
