"use client";

import { useShareView } from "@/features/collector/api/use-share-view";
import { ShareIntake } from "@/features/collector/components/share-intake";
import { SHARE_TOKEN_KEY } from "@/lib/auth/config";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function SharePage() {
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;
  const { data, isLoading, error } = useShareView(linkId);

  useEffect(() => {
    if (typeof window !== "undefined" && linkId) {
      sessionStorage.setItem(SHARE_TOKEN_KEY, linkId);
    }
  }, [linkId]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12">
      {isLoading && <p className="text-sm text-muted-foreground">Loading request…</p>}
      {error && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load request"}
        </p>
      )}
      {data && <ShareIntake view={data} />}
    </main>
  );
}
