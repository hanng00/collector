"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { columnSchema, columnTypeSchema, type Column } from "@contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type WorkspaceColumnsProps = {
  workspaceId: string;
  columns: Column[];
};

const typeLabels: Record<Column["type"], string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  enum: "Enum",
  attachment: "Attachment",
  email: "Email",
  url: "URL",
  money: "Money",
  json: "JSON",
};

export function WorkspaceColumns({ workspaceId, columns }: WorkspaceColumnsProps) {
  const queryClient = useQueryClient();
  const sorted = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const [draft, setDraft] = useState<Column[]>(sorted);

  useEffect(() => {
    setDraft(sorted);
  }, [sorted]);

  const save = useMutation({
    mutationFn: async () => {
      const normalized = draft.map((c, idx) =>
        columnSchema.parse({
          ...c,
          id: c.id || `col-${crypto.randomUUID()}`,
          workspaceId,
          order: idx + 1,
        })
      );
      await apiClient.put(
        `/workspaces/${workspaceId}/columns`,
        { columns: normalized },
        { headers: getAuthHeaders() }
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Columns</CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No fields yet. Add one below and save.
          </p>
        )}

        <div className="space-y-3">
          {draft.map((column, idx) => (
          <div
            key={column.id}
            className="rounded-lg border bg-card/50 p-3 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={column.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((prev) => prev.map((c, i) => (i === idx ? { ...c, name } : c)));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={column.type}
                  onValueChange={(v) => {
                    const type = columnTypeSchema.parse(v);
                    setDraft((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, type } : c))
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columnTypeSchema.options.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={column.description ?? ""}
                  onChange={(e) => {
                    const description = e.target.value;
                    setDraft((prev) => prev.map((c, i) => (i === idx ? { ...c, description } : c)));
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Required</p>
                  <p className="text-xs text-muted-foreground">People have to fill this in.</p>
                </div>
                <Switch
                  checked={!!column.required}
                  onCheckedChange={(required) => {
                    setDraft((prev) => prev.map((c, i) => (i === idx ? { ...c, required } : c)));
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{typeLabels[column.type]}</Badge>
                  {column.required && <Badge variant="default">Required</Badge>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </div>
            </div>

            {column.type === "enum" && (
              <div className="mt-3 space-y-2">
                <Label>Enum values (comma-separated)</Label>
                <Input
                  value={column.enumValues?.join(", ") ?? ""}
                  onChange={(e) => {
                    const enumValues = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setDraft((prev) => prev.map((c, i) => (i === idx ? { ...c, enumValues } : c)));
                  }}
                />
              </div>
            )}
          </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft((prev) => [
              ...prev,
              {
                id: `col-${crypto.randomUUID()}`,
                workspaceId,
                name: "New field",
                description: "",
                type: "text",
                required: false,
                order: prev.length + 1,
              },
            ]);
          }}
        >
          Add field
        </Button>
      </CardContent>
    </Card>
  );
}
