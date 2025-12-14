import { useCallback, useState } from "react";

type UseGridDragDropParams = {
  canEdit: boolean;
  onUploadFile?: (file: File) => Promise<string>;
  onUploaded?: (uploadId: string) => void;
};

export function useGridDragDrop({ canEdit, onUploadFile, onUploaded }: UseGridDragDropParams) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!canEdit) return;
      if (!onUploadFile) return;
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) return;

      for (const file of files) {
        const uploadId = await onUploadFile(file);
        onUploaded?.(uploadId);
      }
    },
    [canEdit, onUploaded, onUploadFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return {
    isDragOver,
    onDrop,
    onDragOver,
    onDragLeave,
  };
}
