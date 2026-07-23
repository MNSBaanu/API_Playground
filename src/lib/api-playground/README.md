# api-playground lib

Framework-free logic for the playground. Pure functions and `localStorage` access — no React.

| File | Responsibility |
| --- | --- |
| `types.ts` | Shared TypeScript types: `SavedRequest`, `Collection`, `Environment`, `Extractor`, `HistoryEntry`, `RunStep`… |
| `storage.ts` | `localStorage` read/write for collections, environments, history, session vars. Includes v1→v2 migration for the flat-request legacy layout |
| `variables.ts` | `{{var}}` resolver (URL / headers / body), JSON-path extractor (`data.items[0].id`), session-over-env merge |
| `diff.ts` | Longest Common Subsequence line diff used by `CompareDialog` |
