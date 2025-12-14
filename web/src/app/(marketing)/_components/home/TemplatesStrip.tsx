import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutTemplate } from "lucide-react";
import Link from "next/link";

const templates = [
  {
    title: "Vendor invoice intake",
    description: "Collect invoices and extract vendor, amount, date, currency — with evidence attached.",
    slug: "vendor-invoices",
  },
  {
    title: "Customer discovery tracker",
    description: "Turn interview notes and screenshots into a clean research log you can export.",
    slug: "customer-discovery",
  },
  {
    title: "Hiring pipeline",
    description: "Collect resumes and recruiter notes into consistent rows, fast.",
    slug: "hiring-pipeline",
  },
  {
    title: "RFP / vendor onboarding",
    description: "Request structured details once. Stop chasing attachments across email threads.",
    slug: "rfp-onboarding",
  },
  {
    title: "Content pipeline",
    description: "Collect drafts, assets, links, and approvals into a table the team can ship from.",
    slug: "content-pipeline",
  },
  {
    title: "Research log",
    description: "Pull structured fields from PDFs and docs into a dataset you can trust.",
    slug: "research-log",
  },
] as const;

export function TemplatesStrip() {
  return (
    <section className="container-ledger pb-12">
      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="dc-hr mb-10" />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl tracking-tight">Start from a template</h2>
            <p className="max-w-2xl text-muted-foreground">
              Pick a request, send one link, and get clean rows back. Contributors don’t need an account.
            </p>
          </div>
          <div className="dc-meta flex items-center gap-2">
            <LayoutTemplate className="size-4" />
            Templates
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.slug} className="dc-surface rounded-2xl p-6">
              <p className="font-medium">{t.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/share/demo-token?template=${encodeURIComponent(t.slug)}`}>
                    Preview
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/signin?template=${encodeURIComponent(t.slug)}`}>
                    Use template
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

