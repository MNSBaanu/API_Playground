## API Testing Playground

A single-page internal tool at `/` for composing HTTP requests, inspecting responses, and saving reusable requests to a local collection.

### Layout

```text
┌───────────────────────────────────────────────────────────────┐
│  API Playground                                    [Publish]   │
├──────────────┬────────────────────────────────────────────────┤
│ Collection   │ [GET ▾]  https://api.example.com/users  [Send] │
│              │                                                 │
│ • List users │ Tabs: [ Headers ] [ Body ]                     │
│ • Create u.. │  key ───── value ───── x                       │
│ • ...        │  [+ Add header]                                │
│ [Save current]│  or JSON textarea (Body tab, [Format] btn)    │
│              │                                                 │
│              │ ── Response ── 200 OK · 143 ms · 2.1 KB ──     │
│              │ Tabs: [ Body ] [ Headers ]                     │
│              │  formatted JSON / raw text                     │
└──────────────┴────────────────────────────────────────────────┘
```

### Behavior

- Method selector: GET, POST, PUT, DELETE (also PATCH for completeness).
- URL input, Send button (disabled while in flight).
- Headers tab: dynamic list of {key, value} rows with add/remove.
- Body tab: JSON textarea + "Format" button (JSON.stringify with 2-space indent); shown only for methods that carry a body. Validation error surfaced inline if invalid JSON on send.
- On Send: measure `performance.now()` around `fetch`, capture status, statusText, response headers, body (try JSON parse → pretty print, fall back to text), and byte size.
- Response panel: status pill (color by 2xx/3xx/4xx/5xx), time in ms, size, tabs for pretty body and headers table. Error state (network failure, CORS) shown as a red card with the message.
- Collection sidebar: list of saved requests. "Save current" prompts for a name and stores the full request (method, url, headers, body). Click to load into the editor. Delete via trash icon. Persisted to `localStorage` (client-only tool, no backend needed).
- Read localStorage inside `useEffect` to avoid SSR hydration mismatch.

### Files

- `src/routes/index.tsx` — replace placeholder; route + `head()` metadata (title "API Playground", description, og/twitter).
- `src/components/api-playground/Playground.tsx` — main container, request/response state, send handler.
- `src/components/api-playground/RequestEditor.tsx` — method/url/tabs/headers/body.
- `src/components/api-playground/ResponseViewer.tsx` — status, timing, tabs.
- `src/components/api-playground/CollectionSidebar.tsx` — saved list + save dialog.
- `src/lib/api-playground/storage.ts` — localStorage helpers, typed `SavedRequest`.
- `src/lib/api-playground/types.ts` — shared types.

Use existing shadcn components (Button, Input, Select, Tabs, Textarea, Dialog, ScrollArea, Badge). Add any missing ones via shadcn.

### Out of scope

- No auth, no server persistence, no team sharing (localStorage only).
- No import/export of collections (can be added later).
- No environment variables / templating.
