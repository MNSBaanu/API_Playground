import { useEffect, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import type { EnvVariable, Environment } from "@/lib/api-playground/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  environments: Environment[];
  onChange: (next: Environment[]) => void;
  activeEnvId: string | null;
  onActiveChange: (id: string | null) => void;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function EnvironmentManager({
  open,
  onOpenChange,
  environments,
  onChange,
  activeEnvId,
  onActiveChange,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    activeEnvId ?? environments[0]?.id ?? null,
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedId || !environments.some((e) => e.id === selectedId)) {
      setSelectedId(environments[0]?.id ?? null);
    }
  }, [open, environments, selectedId]);

  const selected = environments.find((e) => e.id === selectedId) ?? null;

  const updateEnv = (id: string, patch: Partial<Environment>) => {
    onChange(environments.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const createEnv = () => {
    const env: Environment = {
      id: uid(),
      name: `Environment ${environments.length + 1}`,
      variables: [],
    };
    onChange([...environments, env]);
    setSelectedId(env.id);
    if (!activeEnvId) onActiveChange(env.id);
  };

  const deleteEnv = (id: string) => {
    const next = environments.filter((e) => e.id !== id);
    onChange(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    if (activeEnvId === id) onActiveChange(next[0]?.id ?? null);
  };

  const addVar = () => {
    if (!selected) return;
    updateEnv(selected.id, {
      variables: [...selected.variables, { id: uid(), key: "", value: "" }],
    });
  };

  const updateVar = (varId: string, patch: Partial<EnvVariable>) => {
    if (!selected) return;
    updateEnv(selected.id, {
      variables: selected.variables.map((v) =>
        v.id === varId ? { ...v, ...patch } : v,
      ),
    });
  };

  const removeVar = (varId: string) => {
    if (!selected) return;
    updateEnv(selected.id, {
      variables: selected.variables.filter((v) => v.id !== varId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Environments</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-[380px] grid-cols-[220px_1fr] gap-4">
          <div className="flex flex-col rounded-md border">
            <div className="flex items-center justify-between border-b p-2">
              <span className="text-xs font-medium text-muted-foreground">
                Environments
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={createEnv}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {environments.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  No environments. Create one to get started.
                </p>
              ) : (
                <ul className="p-1">
                  {environments.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => setSelectedId(e.id)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${
                          e.id === selectedId ? "bg-accent" : "hover:bg-accent/60"
                        }`}
                      >
                        <span className="truncate">{e.name}</span>
                        {e.id === activeEnvId && (
                          <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            active
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>

          <div className="flex flex-col">
            {selected ? (
              <>
                <div className="mb-3 grid grid-cols-[1fr_auto_auto] items-end gap-2">
                  <div>
                    <Label htmlFor="env-name" className="text-xs">
                      Name
                    </Label>
                    <Input
                      id="env-name"
                      value={selected.name}
                      onChange={(e) => updateEnv(selected.id, { name: e.target.value })}
                    />
                  </div>
                  <Button
                    variant={selected.id === activeEnvId ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      onActiveChange(selected.id === activeEnvId ? null : selected.id)
                    }
                  >
                    {selected.id === activeEnvId ? "Deactivate" : "Set active"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEnv(selected.id)}
                    aria-label="Delete environment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b pb-1 text-xs font-medium text-muted-foreground">
                  <span>Variable</span>
                  <span>Value</span>
                  <span className="w-8" />
                </div>
                <ScrollArea className="flex-1 pt-2">
                  <div className="space-y-2">
                    {selected.variables.map((v) => (
                      <div key={v.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Input
                          placeholder="BASE_URL"
                          value={v.key}
                          onChange={(e) => updateVar(v.id, { key: e.target.value })}
                          className="font-mono text-sm"
                        />
                        <Input
                          placeholder="https://api.example.com"
                          value={v.value}
                          onChange={(e) => updateVar(v.id, { value: e.target.value })}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVar(v.id)}
                          aria-label="Remove variable"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addVar}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add variable
                    </Button>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Select or create an environment.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
