import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  FolderOpen,
} from "lucide-react";
import type { Collection, RequestState, SavedRequest } from "@/lib/api-playground/types";
import { ConfirmDialog } from "./ConfirmDialog";

type Props = {
  collections: Collection[];
  activeRequestId: string | null;
  activeDirty: boolean;
  onUpdateActive?: () => void;
  currentRequest: RequestState;
  onLoad: (item: SavedRequest) => void;
  onCreateCollection: (name: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onSaveCurrentTo: (collectionId: string, name: string) => void;
  onRenameRequest: (collectionId: string, requestId: string, name: string) => void;
  onDuplicateRequest: (collectionId: string, requestId: string) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
  onMoveRequest: (fromId: string, requestId: string, toId: string) => void;
  onRunCollection: (collectionId: string) => void;
};

const REVEAL_ON_HOVER =
  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100";

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-purple-600 dark:text-purple-400",
  DELETE: "text-destructive",
};

type PromptState =
  | { kind: "new-collection" }
  | { kind: "rename-collection"; id: string; current: string }
  | { kind: "rename-request"; collectionId: string; requestId: string; current: string }
  | { kind: "save-current"; collectionId: string }
  | null;

type PendingDelete =
  | { kind: "collection"; id: string; name: string }
  | { kind: "request"; collectionId: string; requestId: string; name: string }
  | null;

export function CollectionSidebar(props: Props) {
  const {
    collections,
    activeRequestId,
    activeDirty,
    onUpdateActive,
    onLoad,
    onCreateCollection,
    onRenameCollection,
    onDeleteCollection,
    onSaveCurrentTo,
    onRenameRequest,
    onDuplicateRequest,
    onDeleteRequest,
    onMoveRequest,
    onRunCollection,
    currentRequest,
  } = props;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [prompt, setPrompt] = useState<PromptState>(null);
  const [promptValue, setPromptValue] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const askDelete = (p: Exclude<PendingDelete, null>) => {
    setPendingDelete(p);
    setConfirmOpen(true);
  };

  const isExpanded = (id: string) => expanded[id] !== false; // default open

  const toggle = (id: string) => setExpanded((s) => ({ ...s, [id]: !isExpanded(id) }));

  const openPrompt = (p: Exclude<PromptState, null>, initial = "") => {
    setPrompt(p);
    setPromptValue(initial);
  };

  const submitPrompt = () => {
    const v = promptValue.trim();
    if (!v || !prompt) return;
    if (prompt.kind === "new-collection") onCreateCollection(v);
    else if (prompt.kind === "rename-collection") onRenameCollection(prompt.id, v);
    else if (prompt.kind === "rename-request")
      onRenameRequest(prompt.collectionId, prompt.requestId, v);
    else if (prompt.kind === "save-current") onSaveCurrentTo(prompt.collectionId, v);
    setPrompt(null);
    setPromptValue("");
  };

  const promptTitle =
    prompt?.kind === "new-collection"
      ? "New collection"
      : prompt?.kind === "rename-collection"
        ? "Rename collection"
        : prompt?.kind === "rename-request"
          ? "Rename request"
          : prompt?.kind === "save-current"
            ? "Save request"
            : "";

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r bg-muted/20">
      <div className="flex items-center justify-between border-b p-3">
        <div>
          <h2 className="text-sm font-semibold">Collections</h2>
          <p className="text-xs text-muted-foreground">Organize saved requests</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => openPrompt({ kind: "new-collection" })}
          aria-label="New collection"
          title="New collection"
        >
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {collections.length === 0 ? (
          <div className="p-4">
            <p className="text-xs text-muted-foreground">No collections yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => openPrompt({ kind: "new-collection" })}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Create collection
            </Button>
          </div>
        ) : (
          <ul className="p-1.5">
            {collections.map((col) => {
              const open = isExpanded(col.id);
              const isDragOver = dragOverId === col.id;
              return (
                <li key={col.id} className="mb-0.5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverId(col.id);
                    }}
                    onDragLeave={() => setDragOverId((d) => (d === col.id ? null : d))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverId(null);
                      const data = e.dataTransfer.getData("application/x-req");
                      if (!data) return;
                      const [fromId, reqId] = data.split("::");
                      if (fromId && reqId && fromId !== col.id) {
                        onMoveRequest(fromId, reqId, col.id);
                      }
                    }}
                    className={`group flex items-center gap-1 rounded-md px-1.5 py-1 ${
                      isDragOver ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-accent"
                    }`}
                  >
                    <button
                      onClick={() => toggle(col.id)}
                      aria-expanded={open}
                      className="flex flex-1 items-center gap-1.5 overflow-hidden text-left"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{col.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        {col.requests.length}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${REVEAL_ON_HOVER}`}
                      aria-label={`Run ${col.name}`}
                      title="Run all requests"
                      disabled={col.requests.length === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunCollection(col.id);
                      }}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${REVEAL_ON_HOVER}`}
                          aria-label="Collection menu"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRunCollection(col.id)}
                          disabled={col.requests.length === 0}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Run collection
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openPrompt(
                              { kind: "save-current", collectionId: col.id },
                              currentRequest.url ? "New request" : "",
                            )
                          }
                          disabled={!currentRequest.url}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Save current request here
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            openPrompt(
                              { kind: "rename-collection", id: col.id, current: col.name },
                              col.name,
                            )
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            askDelete({ kind: "collection", id: col.id, name: col.name })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete collection
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {open && (
                    <ul className="ml-4 border-l pl-1">
                      {col.requests.length === 0 ? (
                        <li className="px-2 py-1 text-xs text-muted-foreground">
                          Drop or save a request here
                        </li>
                      ) : (
                        col.requests.map((req) => {
                          const active = req.id === activeRequestId;
                          return (
                            <li
                              key={req.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/x-req", `${col.id}::${req.id}`);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              className={`group flex items-center gap-1 rounded-md px-1.5 py-1 ${
                                active ? "bg-accent" : "hover:bg-accent/60"
                              }`}
                            >
                              <button
                                onClick={() => onLoad(req)}
                                className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                              >
                                <span
                                  className={`w-10 shrink-0 font-mono text-[10px] font-bold ${
                                    METHOD_COLORS[req.request.method] ?? ""
                                  }`}
                                >
                                  {req.request.method}
                                </span>
                                <span className="truncate text-sm">{req.name}</span>
                                {active && activeDirty && (
                                  <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                                    title="Unsaved changes"
                                  />
                                )}
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-6 w-6 ${REVEAL_ON_HOVER}`}
                                    aria-label="Request menu"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openPrompt(
                                        {
                                          kind: "rename-request",
                                          collectionId: col.id,
                                          requestId: req.id,
                                          current: req.name,
                                        },
                                        req.name,
                                      )
                                    }
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDuplicateRequest(col.id, req.id)}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {collections.length > 1 && (
                                    <DropdownMenuSub>
                                      <DropdownMenuSubTrigger>
                                        <FolderOpen className="mr-2 h-4 w-4" />
                                        Move to
                                      </DropdownMenuSubTrigger>
                                      <DropdownMenuSubContent>
                                        {collections
                                          .filter((c) => c.id !== col.id)
                                          .map((c) => (
                                            <DropdownMenuItem
                                              key={c.id}
                                              onClick={() => onMoveRequest(col.id, req.id, c.id)}
                                            >
                                              {c.name}
                                            </DropdownMenuItem>
                                          ))}
                                      </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      askDelete({
                                        kind: "request",
                                        collectionId: col.id,
                                        requestId: req.id,
                                        name: req.name,
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      <div className="space-y-2 border-t p-3">
        {onUpdateActive && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={!activeDirty}
            onClick={onUpdateActive}
          >
            <Save className="mr-2 h-4 w-4" />
            {activeDirty ? "Save changes" : "No unsaved changes"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="w-full" disabled={!currentRequest.url}>
              <Plus className="mr-2 h-4 w-4" />
              Save current request
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {collections.length === 0 ? (
              <DropdownMenuItem onClick={() => openPrompt({ kind: "new-collection" })}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Create a collection first
              </DropdownMenuItem>
            ) : (
              <>
                {collections.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() =>
                      openPrompt({ kind: "save-current", collectionId: c.id }, "New request")
                    }
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {c.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openPrompt({ kind: "new-collection" })}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New collection…
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={prompt !== null} onOpenChange={(o) => !o && setPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="prompt-input">Name</Label>
            <Input
              id="prompt-input"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPrompt();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={submitPrompt}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingDelete?.kind === "collection" ? "Delete collection?" : "Delete request?"}
        description={
          pendingDelete?.kind === "collection"
            ? `"${pendingDelete.name}" and all its saved requests and history will be deleted.`
            : `"${pendingDelete?.name ?? ""}" and its history will be deleted.`
        }
        onConfirm={() => {
          if (pendingDelete?.kind === "collection") onDeleteCollection(pendingDelete.id);
          else if (pendingDelete?.kind === "request")
            onDeleteRequest(pendingDelete.collectionId, pendingDelete.requestId);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </aside>
  );
}
