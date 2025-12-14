"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerWorkspaces } from "@/features/collector/api/use-owner-workspaces";
import Link from "next/link";

export default function WorkspacesPage() {
  const { data } = useOwnerWorkspaces();
  const workspaces = data?.workspaces ?? [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Workspaces</p>
          <h1 className="text-3xl font-normal font-serif tracking-tight">Your requests</h1>
          <p className="text-muted-foreground">
            Create a request, send the link, get data back.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link href="/workspaces/new">New request</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{workspace.name}</CardTitle>
                  <CardDescription>{workspace.description}</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{workspace.columns.length} columns</Badge>
                    <Badge variant="outline">
                      {workspace.shareLinks.length} share link
                      {workspace.shareLinks.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/workspaces/${workspace.id}`}>Open</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Limits: {workspace.limits?.rows ?? 0} rows • {workspace.limits?.uploads ?? 0} uploads</p>
              <p>Share link token: {workspace.shareLinks[0]?.token ?? "not issued"}</p>
            </CardContent>
          </Card>
        ))}
        {workspaces.length === 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">No workspaces yet</CardTitle>
              <CardDescription>Create your first request to start collecting data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild>
                <Link href="/workspaces/new">New request</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
