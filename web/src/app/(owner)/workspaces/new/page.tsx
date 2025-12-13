"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, getAuthHeaders } from "@/features/collector/api/client";
import { workspaceSchema } from "@contracts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createWorkspace = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        "/workspaces",
        { name, description: description.trim() || undefined },
        { headers: getAuthHeaders() }
      );
      return workspaceSchema.parse(data.workspace);
    },
    onSuccess: (ws) => {
      router.push(`/workspaces/${ws.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Workspaces</p>
        <h1 className="text-3xl font-normal font-serif tracking-tight">New request</h1>
        <p className="text-muted-foreground">
          Set up what you need, get a link, send it out.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Give it a name and tell people what you're collecting.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createWorkspace.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vendor onboarding"
                required
                disabled={createWorkspace.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Collect vendor details, contacts, and supporting documents."
                disabled={createWorkspace.isPending}
              />
            </div>
            <Button type="submit" disabled={createWorkspace.isPending || !name.trim()}>
              {createWorkspace.isPending ? "Creating..." : "Create request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
