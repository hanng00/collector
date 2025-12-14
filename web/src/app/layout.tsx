import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Collector",
  description:
    "Drop PDFs, emails, and spreadsheets. AI turns them into clean rows in the format you asked for.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
