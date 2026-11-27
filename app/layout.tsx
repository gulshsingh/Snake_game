import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a100b",
};

export const metadata: Metadata = {
  title: "Serpent Pro - Ultra Realistic Snake Game",
  description: "Experience the next-generation Snake Game with realistic slithering, fluid physics, mobile touch controls, and synthesized audio.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Serpent Pro",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="h-full w-full overflow-hidden bg-[#0a100b] text-[#f3f4f6]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
