"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignIn } from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await signIn.mutateAsync({ email });
      setSuccess(true);
      setTimeout(() => router.push("/workspaces"), 600);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request magic link. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-ledger grid min-h-screen items-center gap-8 py-10 lg:grid-cols-2 lg:py-16">
        <div className="order-2 space-y-6 lg:order-1">
          <div className="dc-stamp dc-reveal dc-reveal-1 w-fit">Collector</div>
          <h1 className="dc-reveal dc-reveal-2 text-4xl font-normal leading-[1.05] tracking-tight sm:text-5xl">
            Sign in to manage your requests.
          </h1>
          <p className="dc-reveal dc-reveal-3 max-w-xl text-lg text-muted-foreground">
            Set up what you need, send a link, get clean data back.
          </p>
          <div className="dc-reveal dc-reveal-4 dc-surface max-w-xl rounded-2xl p-5">
            <p className="font-serif text-lg">Most common use cases</p>
            <div className="mt-3 dc-hr" />
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><span className="text-foreground">Vendor onboarding</span> — W‑9, COI, contacts, banking details</li>
              <li><span className="text-foreground">Invoice intake</span> — amounts, dates, approvals, PDFs</li>
              <li><span className="text-foreground">Audit evidence</span> — checklist fields + attachments</li>
            </ul>
          </div>
        </div>

        <Card className="order-1 w-full border-border/60 bg-card/80 shadow-lg shadow-black/10 backdrop-blur lg:order-2">
        <CardHeader className="space-y-2 text-center">
            <CardTitle className="dc-reveal dc-reveal-1 text-2xl">Sign in</CardTitle>
            <CardDescription className="dc-reveal dc-reveal-2">
              We'll email you a sign‑in link. No password needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>
                  Sign‑in link issued. You&apos;re signed in on this device.
                </AlertDescription>
              </Alert>
            )}

            <div className="dc-reveal dc-reveal-3 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={signIn.isPending}
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <Button type="submit" className="dc-reveal dc-reveal-4 w-full" disabled={signIn.isPending}>
              {signIn.isPending ? "Sending link..." : "Email me a sign-in link"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
