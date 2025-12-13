"use client";

import { UserMenu } from "@/components/auth/user-menu";
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
import { navItems } from "@/lib/nav-items";
import Link from "next/link";
import { usePathname } from "next/navigation";
interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-3">
            <span className="dc-stamp group-data-[collapsible=icon]:hidden transition-opacity delay-200">
              Collector
            </span>
            <span className="group-data-[collapsible=icon]:block hidden font-serif text-lg tracking-tight transition-opacity delay-200">
              DC
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
      <main className="flex min-h-screen flex-col grow bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/70 px-4 backdrop-blur">
          <SidebarTrigger />
          <div className="text-xs text-muted-foreground">
            Keep it clean. Export when ready.
          </div>
        </header>
        <div className="grow">
          <div className="container-ledger py-8">{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}
