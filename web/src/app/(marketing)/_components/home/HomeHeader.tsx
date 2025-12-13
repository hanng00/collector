import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="container-ledger relative z-10 flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <span className="dc-stamp">Collector</span>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/share/demo-token">See a request</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signin">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
