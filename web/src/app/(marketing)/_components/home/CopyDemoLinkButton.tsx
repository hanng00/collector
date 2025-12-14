"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type CopyDemoLinkButtonProps = {
  path?: string;
};

export function CopyDemoLinkButton({ path = "/share/demo-token" }: CopyDemoLinkButtonProps) {
  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied link", { description: url });
    } catch {
      toast.error("Couldn't copy automatically", { description: url });
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
      <Copy className="mr-2 size-4" />
      Copy demo link
    </Button>
  );
}

