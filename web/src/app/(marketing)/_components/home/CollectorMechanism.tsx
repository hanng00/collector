import { BadgeCheck, FileText, Wand2 } from "lucide-react";

export function CollectorMechanism() {
  return (
    <section className="container-ledger pb-12">
      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="dc-hr mb-10" />

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-3">
            <h2 className="font-serif text-3xl tracking-tight">
              You can see where everything came from.
            </h2>
            <p className="text-muted-foreground">
              Collector takes messy stuff and turns it into rows. And it keeps track of what came from where, so you're not guessing.
            </p>
            <div className="pt-4 dc-marginalia hidden lg:block">
              "AI suggests, you verify."
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="dc-surface rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="size-4" /> Inputs
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                PDFs, emails, random spreadsheets, screenshots—whatever people send you.
              </p>
            </div>
            <div className="dc-surface rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wand2 className="size-4" /> Autofill
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Figures out what goes in which column and fills it in.
              </p>
            </div>
            <div className="dc-surface rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BadgeCheck className="size-4" /> Review
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                You check it over and fix anything that looks off.
              </p>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <div className="mt-6 dc-surface rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-xl tracking-tight">In practice</p>
                <p className="dc-meta">Mechanism / Evidence</p>
              </div>
              <div className="mt-4 dc-hr" />

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">
                    REQUEST
                  </p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
{`Fields:
- Vendor
- Invoice #
- Date
- Amount
- Currency

Recipient drops:
- invoice_1042.pdf
- email_forward.eml`}
                  </pre>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">
                    RESULT
                  </p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed">
{`Row 18 (proposed):
Vendor:   ACME Supplies
Invoice#: 1042
Date:     2025-12-08
Amount:   1,284.50
Currency: EUR

Evidence:
- invoice_1042.pdf → Amount, Date
- email_forward.eml → Vendor`}
                  </pre>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                The whole point: you can always see which file or email produced each piece of data. No more "wait, where did this come from?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
