import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ShareView } from "@contracts";
import { UploadDropzone } from "./upload-dropzone";

type ShareIntakeProps = {
  view: ShareView;
};

export function ShareIntake({ view }: ShareIntakeProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {view.workspace.name} — request
          </CardTitle>
          <p className="text-muted-foreground">
            Add your info and drop files here. No signup needed.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Request ID: {view.link.token}</Badge>
            {view.link.passcodeRequired && <Badge>Passcode required</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We'll organize everything into rows below. You can edit anything before you're done.
          </p>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {view.columns.map((column) => (
              <div key={column.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{column.name}</p>
                  <Badge variant="outline">{column.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{column.description}</p>
                {column.examples && column.examples.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Examples: {column.examples.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UploadDropzone workspaceId={view.workspace.id} />

      {view.latestUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Latest file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{view.latestUpload.fileName}</p>
            <p className="text-muted-foreground">
              Status: {view.latestUpload.status} • Match quality:{" "}
              {view.latestUpload.confidence
                ? `${Math.round(view.latestUpload.confidence * 100)}%`
                : "pending"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
