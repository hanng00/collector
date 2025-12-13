"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerWorkspaces } from "@/features/collector/api/use-owner-workspaces";

export default function LinksPage() {
  const { data } = useOwnerWorkspaces();
  const workspaces = data?.workspaces ?? [];
  const links = workspaces.flatMap((w) => w.shareLinks.map((l) => ({ link: l, workspace: w })));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Sharing</p>
        <h1 className="text-2xl font-semibold">Share links</h1>
        <p className="text-muted-foreground">
          Links people can use to add data without signing up.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {links.map(({ link, workspace }) => (
          <Card key={link.id}>
            <CardHeader>
              <CardTitle className="text-lg">Link {link.id}</CardTitle>
              <CardDescription>{workspace.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-mono text-xs">Token: {link.token}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{link.status}</Badge>
                {link.passcodeRequired && <Badge>Passcode required</Badge>}
              </div>
              <p className="text-muted-foreground">
                Permissions: upload {link.permissions.canUpload ? "enabled" : "disabled"},{" "}
                edit rows {link.permissions.canEditRows ? "enabled" : "disabled"}
              </p>
            </CardContent>
          </Card>
        ))}
        {links.length === 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">No share links yet</CardTitle>
              <CardDescription>Create a workspace to get started.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
