import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AtmosphereGraphic } from "./AtmosphereGraphic";
import { CopyDemoLinkButton } from "./CopyDemoLinkButton";

export function HomeHero() {
  return (
    <section className="container-ledger relative pb-10">
      <div className="pointer-events-none absolute inset-x-0 -top-6 -z-10 mx-auto h-[520px] max-w-6xl overflow-hidden rounded-[28px]">
        <AtmosphereGraphic className="h-full w-full opacity-60" />
      </div>

      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="dc-meta">A request link that becomes clean rows</div>
          <div className="dc-meta">
            Page 01 •{" "}
            {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-7">
            <h1 className="dc-reveal dc-reveal-2 text-4xl font-normal leading-[1.02] tracking-tight sm:text-6xl">
              Send a request link.
              <br />
              Get clean rows back.
            </h1>

            <p className="dc-reveal dc-reveal-5 max-w-2xl text-lg text-foreground">
              For all the stuff that happens between &quot;can you send me...&quot; and
              actually having usable data.{" "}
              <span className="font-medium dc-red-pencil">
                Less chaos, more rows.
              </span>
            </p>

            {/* <p className="dc-reveal dc-reveal-3 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Contributors upload anything (no signup). Collector extracts into your columns, keeps evidence attached, and you export to CSV/XLSX.
            </p> */}

            <div className="dc-reveal dc-reveal-4 flex flex-wrap gap-3 pt-8">
              <Button asChild size="lg">
                <Link href="/share/demo-token">
                  See a live request
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/signin">Create a request (email code)</Link>
              </Button>
            </div>

            <div className="dc-reveal dc-reveal-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-sm text-muted-foreground">
                No signup for contributors. Passwordless email OTP for creators.
              </p>
              <CopyDemoLinkButton />
            </div>
          </div>

          <div className="dc-reveal dc-reveal-5 dc-surface rounded-2xl p-6">
            <p className="font-serif text-lg tracking-tight">What changes</p>
            <div className="mt-4 dc-hr" />

            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-foreground">•</span> Contributors don’t
                sign up — they just upload
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">•</span> AI autofills into
                your columns (you review)
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">•</span> Evidence stays
                attached to each row
              </li>
              <li className="flex gap-2">
                <span className="text-foreground">•</span> Export CSV/XLSX when
                it’s clean
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
