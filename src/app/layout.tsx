import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarTech Stack Auditor | Free Stack Analysis",
  description:
    "Audit your marketing tech stack in 3 minutes. Find redundant tools, missing layers, and hidden cost waste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
