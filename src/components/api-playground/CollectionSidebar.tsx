import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookmarkPlus, Trash2 } from "lucide-react";
import type { SavedRequest } from "@/lib/api-playground/types";

type Props = {
  items: SavedRequest[];
  onLoad: (item: SavedRequest) => void;
  onDelete: (id: string) => void;
  onSave: (name: string) => void;
  canSave: boolean;
};

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-purple-600 dark:text-purple-400",
  DELETE: "text-destructive",
};

export function CollectionSidebar({ items, onLoad, onDelete, onSave, canSave }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/20">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">Collection</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Saved requests</p>
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">
            No saved requests yet. Configure a request and click Save.
          </p>
        ) : (
          <ul className="p-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <button
                  onClick={() => onLoad(item)}
                  className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      METHOD_COLORS[item.request.method] ?? ""
                    }`}
                  >
                    {item.request.method}
                  </span>
                  <span className="truncate text-sm">{item.name}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full" disabled={!canSave}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Save current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save request</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="req-name">Name</Label>
              <Input
                id="req-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List users"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!name.trim()) return;
                  onSave(name.trim());
                  setName("");
                  setOpen(false);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
