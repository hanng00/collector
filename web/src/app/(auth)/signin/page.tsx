"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmMagicLink, useRequestMagicLink } from "@/features/auth/use-auth";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const requestMagicLink = useRequestMagicLink();
  const confirmMagicLink = useConfirmMagicLink();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [signedInSuccess, setSignedInSuccess] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRequestSuccess(false);
    setSignedInSuccess(false);

    try {
      await requestMagicLink.mutateAsync(email);
      setCodeSent(true);
      // We switch to the code entry step immediately; don't show "signed in" success here.
      setRequestSuccess(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(
        error?.message || "Failed to send a code. Please try again."
      );
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSignedInSuccess(false);

    try {
      await confirmMagicLink.mutateAsync({ email, code });
      setSignedInSuccess(true);
      setTimeout(() => router.push("/workspaces"), 600);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(
        error?.message || "Invalid code. Please try again."
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
            <CardTitle className="dc-reveal dc-reveal-1 text-2xl">
              {codeSent ? "Enter your code" : "Sign in"}
            </CardTitle>
            <CardDescription className="dc-reveal dc-reveal-2">
              {codeSent 
                ? "We sent a code to your email. Enter it below to sign in."
                : "We'll email you a sign‑in code. No password needed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {codeSent ? (
            <form onSubmit={handleConfirmCode} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {signedInSuccess && (
                <Alert>
                  <AlertDescription>
                    Signed in successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="dc-reveal dc-reveal-3 space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={confirmMagicLink.isPending}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                />
                <p className="text-sm text-muted-foreground">
                  Check your email for the code sent to {email}
                </p>
              </div>

              <Button type="submit" className="dc-reveal dc-reveal-4 w-full" disabled={confirmMagicLink.isPending}>
                {confirmMagicLink.isPending ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setError(null);
                    setRequestSuccess(false);
                    setSignedInSuccess(false);
                  }}
                  className="text-muted-foreground hover:text-foreground underline"
                >
                  Use a different email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequestCode} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {requestSuccess && (
                <Alert>
                  <AlertDescription>
                    If an account exists (or was just created), we sent a code. Check your inbox and spam.
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
                  disabled={requestMagicLink.isPending}
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </div>

              <Button type="submit" className="dc-reveal dc-reveal-4 w-full" disabled={requestMagicLink.isPending}>
                {requestMagicLink.isPending ? "Sending code..." : "Email me a sign-in code"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
