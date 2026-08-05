import type { Metadata } from "next";
import { Outfit, Sora } from "next/font/google";
import { BetaNotice } from "@/components/beta-notice";
import "./globals.css";

const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CineMate — Watch together",
  description:
    "Synced playback, live chat, and movie buddies — watch with anyone, anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full`}>
      <body className="theater-wash flex min-h-full flex-col antialiased">
        {children}
        <BetaNotice />
      </body>
    </html>
  );
}
