"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useSignOut } from "./use-auth";

export function UserMenu() {
  const { data: user, isLoading } = useAuth();
  const signOut = useSignOut();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      router.push("/signin");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  if (isLoading) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email;
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="body-m leading-none">{displayName}</p>
            <p className="body-s leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="body-s leading-none text-muted-foreground mt-1">
              Status: <span className="text-green-600 dark:text-green-400">Signed in</span>
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 size-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signOut.isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          <span>{signOut.isPending ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

