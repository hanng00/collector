import { XPostCard } from "./XPostCard";
import { xPosts } from "./x-posts";

export function Testimonials() {
  return (
    <section className="container-ledger pb-12">
      <div className="dc-sheet px-6 py-10 md:px-10 md:py-14">
        <div className="dc-hr mb-10" />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-3xl tracking-tight">
              What early users say
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              What people are actually saying: less email threads, more usable data.
            </p>
          </div>
          <div className="dc-meta">X / Sample timeline</div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {xPosts.map((post) => (
            <XPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
