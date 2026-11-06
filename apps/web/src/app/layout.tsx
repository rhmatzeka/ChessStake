import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { RevealObserver } from "@/components/site/RevealObserver";

// Runs before first paint: marks the page as able to animate so scroll reveals start hidden.
// Skipped for reduced motion; if the app never hydrates, everything is shown after 4 s.
const RV_SCRIPT =
  "(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('rv');setTimeout(function(){if(!window.__rv)d.classList.add('rv-off')},4000)}catch(e){}})()";

// Self-hosted so a build never depends on reaching Google Fonts.
// Display: a heavy grotesk for the big uppercase headlines. Mono: labels and buttons. Body: Hanken.
const display = localFont({
  src: "./fonts/archivo-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});

const body = localFont({
  src: "./fonts/hanken-grotesk-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});

const PITCH =
  "Your community plays chess together against an AI Boss. Free to play, sponsors put up the prizes.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://pawnpool.rahmateka.my.id"),
  title: { default: "PawnPool | Your community vs the AI Boss", template: "%s | PawnPool" },
  description: PITCH,
  openGraph: { title: "PawnPool", description: PITCH, siteName: "PawnPool", type: "website" },
  twitter: { card: "summary_large_image", title: "PawnPool", description: PITCH },
};

export const viewport: Viewport = { themeColor: "#070605" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: RV_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
