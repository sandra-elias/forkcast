import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Body text: clean and very readable.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Headlines: geometric display font for a modern look.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forkcast",
  description: "Can't decide where to eat? Spin for a restaurant near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) add attributes to <body>
          before React loads. This ignores those attribute differences on <body> only. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* Vercel Web Analytics: counts page views on the live site (no cookies; off in development). */}
        <Analytics />
      </body>
    </html>
  );
}
