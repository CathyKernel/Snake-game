import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Neon Snake — Classic Arcade Game",
  description:
    "A feature-packed neon Snake game: three game modes, four difficulty levels, combo chains, power foods, synthesized retro sound effects and local high scores.",
  keywords: ["snake game", "arcade", "neon", "canvas game", "browser game", "Next.js"],
  authors: [{ name: "Z.ai" }],
  openGraph: {
    title: "Neon Snake — Classic Arcade Game",
    description: "Combos, power foods, obstacles and wrap-around modes in a glowing neon arena.",
    siteName: "Neon Snake",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
