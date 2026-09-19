# API Playground

A fully client-side API testing playground built with **TanStack Start**, **React**, **TypeScript**, and **Tailwind CSS**. Think of it as a lightweight, in-browser alternative to Postman/Insomnia — no backend, no account, no telemetry. All state lives in `localStorage`.

## Features

- **Request editor** — GET / POST / PUT / PATCH / DELETE, custom headers, JSON body with formatter.
- **Response viewer** — status code, response time, size, pretty-printed body, headers table.
- **Collections** — organize saved requests into named folders, drag-and-drop between collections, rename/duplicate/delete, save edits back to a loaded request.
- **Environments** — define variable sets (Dev, Staging, Prod) and reference them with `{{VAR}}` syntax in URLs, headers, and bodies. Resolved values are previewed inline.
- **Request chaining** — extract values from a JSON response (e.g. `data.token`) into session variables, then reuse them in subsequent requests.
- **Collection runner** — execute every request in a collection sequentially, auto-applying attached extractors.
- **History** — every send is logged per request (capped at 50). Reload past runs or **compare** any two side-by-side with an LCS-based JSON diff.

## Getting started

Requires Node.js 20+ and [bun](https://bun.sh) (or npm).

```sh
bun install
bun run dev
```

Open http://localhost:8080.

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `bun run dev`     | Start the Vite dev server            |
| `bun run build`   | Production build                     |
| `bun run preview` | Preview the production build locally |
| `bun run lint`    | ESLint                               |
| `bun run format`  | Prettier                             |

## Project structure

```
src/
├── routes/                       # File-based routes (TanStack Router)
│   ├── __root.tsx                # App shell — head tags, providers, <Outlet />
│   └── index.tsx                 # "/" — renders <Playground />
│
├── components/
│   ├── api-playground/           # Feature components
│   │   ├── Playground.tsx        # Top-level orchestrator: state, send, run
│   │   ├── RequestEditor.tsx     # Method, URL, headers, body editor
│   │   ├── ResponseViewer.tsx    # Body / Headers / Extract / History tabs
│   │   ├── CollectionSidebar.tsx # Collections tree, drag-drop, CRUD
│   │   ├── EnvironmentManager.tsx# Environment sets + variables editor
│   │   ├── VariablesPanel.tsx    # Live view of session + env variables
│   │   ├── RunCollectionDialog.tsx # Sequential collection runner UI
│   │   ├── HistoryPanel.tsx      # Per-request history list + selection
│   │   └── CompareDialog.tsx     # Side-by-side diff of two history entries
│   └── ui/                       # shadcn/ui primitives
│
├── lib/
│   ├── api-playground/
│   │   ├── types.ts              # Shared TS types (Request, Collection, Env, History…)
│   │   ├── storage.ts            # localStorage read/write + v1→v2 migration
│   │   ├── variables.ts          # {{var}} resolver + JSON-path extractor
│   │   └── diff.ts               # LCS line-diff utility
│   └── utils.ts                  # cn() + misc helpers
│
├── hooks/                        # Reusable React hooks
├── router.tsx                    # TanStack Router setup
├── start.ts                      # Start instance (server request middleware)
├── server.ts                     # Server entry (SSR)
└── styles.css                    # Tailwind v4 + design tokens
```

Routes are file-based — see `src/routes/README.md` for naming conventions. `src/routeTree.gen.ts` is auto-generated; do not edit it.

## Data & privacy

Everything is stored in your browser's `localStorage` under the `api-playground:*` namespace:

- `api-playground:collections:v2` — collections + saved requests
- `api-playground:environments:v1` — environment variable sets
- `api-playground:active-env:v1` — the selected environment
- `api-playground:history:v1` — per-request response history (max 50 each; oldest entries are dropped once stored history passes ~1M characters)

Session variables are kept in memory only and are cleared on page reload. Clearing site data wipes all of it. Nothing is sent to any server.

## Tech stack

- [TanStack Start](https://tanstack.com/start) v1 (React 19 + Vite 8)
- TypeScript (strict)
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com) + Radix primitives
- [lucide-react](https://lucide.dev) icons

## Contributing

PRs welcome. Please run `bun run lint` and `bun run format` before opening one.

## License

MIT
