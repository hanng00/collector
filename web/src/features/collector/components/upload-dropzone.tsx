"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { useState } from "react";

type UploadDropzoneProps = {
  workspaceId: string;
  onUploaded?: (uploadId: string) => void;
};

export function UploadDropzone({ workspaceId, onUploaded }: UploadDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      // Stubbed upload flow: in production this will upload securely and attach the file to this record.
      await new Promise((resolve) => setTimeout(resolve, 600));
      return `upl-${workspaceId}-${file.name}-${Date.now()}`;
    },
    onSuccess: (id) => {
      setFileName(null);
      onUploaded?.(id);
    },
  });

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
                upload.mutate(file);
              }
            }}
            disabled={upload.isPending}
          />
        </Label>
        {fileName && (
          <p className="text-sm text-muted-foreground">Selected: {fileName}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled
          className="w-full justify-start"
        >
          Files get parsed automatically
        </Button>
      </CardContent>
    </Card>
  );
}
