import type { Metadata } from "next";
import { Big_Shoulders, Geist } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display-loaded",
  display: "swap",
  preload: true,
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

const body = Geist({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "ScoutCard — Valorant Premier Recruiting",
  description: "Where verified Valorant Premier players and teams find each other.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
