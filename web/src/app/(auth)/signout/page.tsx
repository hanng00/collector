"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignOut } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function SignOutPage() {
  const router = useRouter();
  const signOut = useSignOut();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut.mutateAsync();
        router.push("/signin");
      } catch (error) {
        console.error("Failed to sign out:", error);
        // Still redirect even if sign out fails
        router.push("/signin");
      }
    };

    handleSignOut();
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto size-12 rounded-full" />
        <p className="text-sm text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}

