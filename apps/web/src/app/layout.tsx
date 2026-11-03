import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display: a heavy grotesk for the big uppercase headlines. Mono: labels and buttons. Body: Hanken.
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
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
    <html lang="en" className={`${display.variable} ${mono.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
