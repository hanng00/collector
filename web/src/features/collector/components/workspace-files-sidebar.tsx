"use client";

import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemHeader,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Upload } from "@contracts";
import { FileText } from "lucide-react";

export type WorkspaceFilesSidebarProps = {
  uploads: Upload[];
};

function formatBytes(bytes: number | undefined): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
}

function formatUploadDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatUploader(upload: Upload): string {
  if (upload.uploadedBy && upload.uploadedBy.trim()) return upload.uploadedBy;
  if (upload.linkId) return "Share link";
  return "Owner";
}

export function WorkspaceFilesSidebar({ uploads }: WorkspaceFilesSidebarProps) {
  const sorted = [...uploads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex h-full min-w-0 flex-col border-l bg-background overflow-hidden">
      <div className="border-b px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-serif text-lg tracking-tight">Files</div>
          <div className="text-xs text-muted-foreground">
            {sorted.length}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Uploaded to this workspace
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {sorted.length === 0 ? (
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              No files uploaded yet.
            </div>
          ) : (
            <ItemGroup className="gap-2">
              {sorted.map((upload) => (
                <Item
                  key={upload.id}
                  variant="outline"
                  size="sm"
                  className="bg-card"
                >
                  <ItemMedia variant="icon">
                    <FileText className="size-4" />
                  </ItemMedia>

                  <ItemContent className="min-w-0">
                    <ItemHeader>
                      <ItemTitle className="min-w-0 truncate">
                        {upload.fileName}
                      </ItemTitle>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        {formatBytes(upload.fileSizeBytes)}
                      </div>
                    </ItemHeader>
                    <ItemDescription className="line-clamp-1">
                      {formatUploadDate(upload.createdAt)} •{" "}
                      {formatUploader(upload)}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


