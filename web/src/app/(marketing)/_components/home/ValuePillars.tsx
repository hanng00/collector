import { Lock, Paperclip, Table2 } from "lucide-react";

const pillars = [
  {
    title: "Rows you can trust",
    description: "Everything's in the right columns, ready to export when you are.",
    icon: Table2,
  },
  {
    title: "Evidence attached",
    description: "Every row keeps the original files so you know where data came from.",
    icon: Paperclip,
  },
  {
    title: "No signups required",
    description: "People just click the link and drop files. They actually do it.",
    icon: Lock,
  },
] as const;

export function ValuePillars() {
  return (
    <section className="container-ledger pb-12">
      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="dc-hr mb-10" />

        <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
          <div className="space-y-3">
            <h2 className="font-serif text-3xl tracking-tight">Why it works</h2>
            <p className="text-muted-foreground">
              Skip the fancy dashboard. Just get from "people sending you stuff" to "data you can actually use."
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="dc-surface rounded-2xl p-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <p.icon className="size-4" /> {p.title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
