import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";

import type { XPost } from "./types";

function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
}

export function XPostCard({ post }: { post: XPost }) {
  return (
    <article className="dc-surface rounded-2xl p-5">
      <header className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/60 text-xs font-semibold tracking-tight">
          {post.avatarInitials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <div className="truncate text-sm font-medium">{post.name}</div>
            <div className="truncate text-sm text-muted-foreground">@{post.handle}</div>
            <span className="text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground">{post.dateLabel}</time>
          </div>
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-foreground/90">{post.text}</p>

      <footer className="mt-4 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4" />
          {formatCompact(post.metrics.replies)}
        </div>
        <div className="flex items-center gap-2">
          <Repeat2 className="size-4" />
          {formatCompact(post.metrics.reposts)}
        </div>
        <div className="flex items-center gap-2">
          <Heart className="size-4" />
          {formatCompact(post.metrics.likes)}
        </div>
        <div className="flex items-center gap-2">
          <Bookmark className="size-4" />
          {formatCompact(post.metrics.bookmarks)}
        </div>
      </footer>
    </article>
  );
}
