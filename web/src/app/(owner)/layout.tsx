"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
