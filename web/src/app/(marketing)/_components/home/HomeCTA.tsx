import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="container-ledger pb-12">
      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="dc-hr mb-10" />

        <div className="dc-surface rounded-2xl p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="font-serif text-2xl tracking-tight">
                Try it with one request link.
              </p>
              <p className="text-muted-foreground">
                Set up your columns, send the link, get clean rows back.
              </p>
              <p className="text-sm text-muted-foreground">
                Passwordless email OTP for creators. Contributors don’t need an account.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signin">
                  Create a request (email code)
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/share/demo-token">
                  <CheckCircle2 className="mr-2 size-4" />
                  See a live request
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <footer className="pt-8">
          <div className="dc-hr mb-6" />
          <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} Collector</span>
            <span>Built for people who wrangle data and make things happen.</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
