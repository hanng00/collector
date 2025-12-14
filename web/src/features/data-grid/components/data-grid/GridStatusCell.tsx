"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Row } from "@contracts";

export function GridStatusCell(props: {
  row: Row;
  canEdit: boolean;
  onSetStatus: (status: Row["status"]) => void;
}) {
  const { row, canEdit, onSetStatus } = props;

  return (
    <div className="flex items-center gap-2">
      {canEdit ? (
        <Select value={row.status} onValueChange={(v) => onSetStatus(v as Row["status"])}>
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="parsed">Parsed</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

