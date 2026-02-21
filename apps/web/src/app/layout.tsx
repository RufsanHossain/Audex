import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Audex — Code Quality & Web Analysis Platform",
    template: "%s | Audex",
  },
  description:
    "Comprehensive code quality and web application analysis across 11 dimensions. Get actionable scores, findings, and recommendations.",
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000"),
  openGraph: {
    title: "Audex",
    description: "Code Quality & Web Analysis Platform",
    siteName: "Audex",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-(--color-background)] text-(--color-foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
