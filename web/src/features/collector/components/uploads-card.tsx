import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Upload } from "@contracts";

type UploadsCardProps = {
  uploads?: Upload[];
};

const statusColor: Record<Upload["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  processing: "secondary",
  succeeded: "default",
  partial: "default",
  failed: "destructive",
};

export function UploadsCard({ uploads = [] }: UploadsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Files</CardTitle>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Match quality</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium">{upload.fileName}</TableCell>
                <TableCell>
                  <Badge variant={statusColor[upload.status]}>
                    {upload.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {upload.confidence !== undefined
                    ? `${Math.round(upload.confidence * 100)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(upload.updatedAt).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
