import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "PawnPool | Your community vs the AI Boss", template: "%s | PawnPool" },
  description: PITCH,
  openGraph: { title: "PawnPool", description: PITCH, siteName: "PawnPool", type: "website" },
  twitter: { card: "summary_large_image", title: "PawnPool", description: PITCH },
};

export const viewport: Viewport = { themeColor: "#070605" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
      </body>
    </html>
  );
}
