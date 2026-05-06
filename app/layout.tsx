import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LookLab",
  description:
    "Upload a selfie, compare beauty preview edits, and build a polished shortlist of realistic AI simulations.",
  themeColor: [
    { color: "#fbf7f3", media: "(prefers-color-scheme: light)" },
    { color: "#08111b", media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
        <body>{children}</body>
    </html>
  );
}
