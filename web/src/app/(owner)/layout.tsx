"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/dashboard-shell";

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
