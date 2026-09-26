import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoutCard — Valorant Premier Recruiting",
  description: "Where verified Valorant Premier players and teams find each other.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
