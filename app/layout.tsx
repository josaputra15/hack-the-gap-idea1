import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: "What's Going On?",
  description: "See what's going on around the world. Tap a flag for a country's news, zoom in for local stories, and review how trustworthy each story is.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f7fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
