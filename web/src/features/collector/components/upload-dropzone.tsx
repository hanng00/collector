"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadFile } from "@/features/collector/api/use-upload-file";
import { UploadCloud } from "lucide-react";
import { useState } from "react";

type UploadDropzoneProps = {
  workspaceId: string;
  onUploaded?: (uploadId: string) => void;
};

export function UploadDropzone({ workspaceId, onUploaded }: UploadDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadFile(workspaceId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a file</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label
          htmlFor="upload"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center hover:border-primary"
        >
          <UploadCloud className="size-8 text-muted-foreground" />
          <span className="mt-2 text-sm text-muted-foreground">
            Drag & drop or click to pick a file
          </span>
          <Input
            id="upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFileName(file.name);
                setError(null);
                upload.mutate(file, {
                  onSuccess: (id) => {
                    setFileName(null);
                    onUploaded?.(id);
                  },
                  onError: (err) => {
                    setError(err instanceof Error ? err.message : "Upload failed");
                  },
                });
              }
            }}
            disabled={upload.isPending}
          />
        </Label>
        {fileName && (
          <p className="text-sm text-muted-foreground">Selected: {fileName}</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          After upload, we’ll parse the file and add a new row automatically.
        </p>
      </CardContent>
    </Card>
  );
}
