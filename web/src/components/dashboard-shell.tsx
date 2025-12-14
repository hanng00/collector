"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/features/auth/user-menu";
import { WorkspaceTopbar } from "@/features/collector/components/workspace-topbar";
import { navItems } from "@/lib/nav-items";
import Link from "next/link";
import { usePathname } from "next/navigation";
interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isWorkspaceDetail = /^\/workspaces\/[^/]+$/.test(pathname);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-3">
            <span className="dc-stamp group-data-[collapsible=icon]:hidden transition-opacity delay-200">
              Collector
            </span>
            <span className="group-data-[collapsible=icon]:block hidden font-serif text-lg tracking-tight transition-opacity delay-200">
              C
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="tracking-wide uppercase text-[11px]">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between px-2 py-2">
            <UserMenu />
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/70 px-4 backdrop-blur">
          <SidebarTrigger />
          {isWorkspaceDetail ? (
            <div className="min-w-0 flex-1 pl-4">
              <WorkspaceTopbar />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Keep it clean. Export when ready.
            </div>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isWorkspaceDetail ? (
            <div className="h-full min-h-0 overflow-hidden">
              {children}
            </div>
          ) : (
            <div className="container-ledger py-8 overflow-auto">{children}</div>
          )}
        </div>
      </main>
    </SidebarProvider>
  );
}
