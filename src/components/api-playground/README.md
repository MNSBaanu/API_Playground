# api-playground components

Feature UI for the API testing playground. All state is lifted into `Playground.tsx`.

| File | Responsibility |
| --- | --- |
| `Playground.tsx` | Top-level orchestrator — request state, send logic, session vars, collection runner |
| `RequestEditor.tsx` | Method dropdown, URL input, headers key-value rows, JSON body editor |
| `ResponseViewer.tsx` | Tabs: Body, Headers, Extract, History |
| `CollectionSidebar.tsx` | Tree of collections + saved requests, drag-drop, CRUD, run button |
| `EnvironmentManager.tsx` | Dialog to create/edit environment variable sets |
| `VariablesPanel.tsx` | Dialog showing merged session + environment variables |
| `RunCollectionDialog.tsx` | Sequential collection runner with live progress |
| `HistoryPanel.tsx` | Per-request run history + multi-select for compare |
| `CompareDialog.tsx` | Side-by-side LCS diff of two history entries |
