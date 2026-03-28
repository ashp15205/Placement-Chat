import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Footer, Navbar } from "@/components/site-chrome";
import { InteractiveMesh } from "@/components/interactive-mesh";
import { AuthProvider } from "@/components/auth-provider";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Placement Chat - Decode the Interview. Own the Offer.",
    template: "%s - Placement Chat",
  },
  description: "The premier hub for student-driven internship and placement interview intelligence. Access high-quality data for SDE, Core, and Management roles. Decode the interview, own the offer.",
  keywords: ["placement", "internship", "interview experiences", "SDE", "engineering", "college placements", "Placement Chat", "interview preparation"],
  authors: [{ name: "Ashish Patil" }],
  creator: "Ashish Patil",
  metadataBase: new URL("https://placementchat.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://placementchat.vercel.app",
    title: "Placement Chat | Peer-to-Peer Interview Intelligence",
    description: "Navigate your career with interview insights from fellow students. Structured logs for DSA, System Design, and more.",
    siteName: "Placement Chat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Placement Chat - Student Interview Experiences",
      },
    ],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  verification: {
    google: "iq-Xb7-noSh-hg39oiLxZ1dsKvV4g5qQa2Hifx7I94w",
  },
};

import { IntroAnimation } from "@/components/intro-animation";
import { PageLoader } from "@/components/page-loader";
import { NeonTrails } from "@/components/neon-trails";
import { RootShell } from "@/components/root-shell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="ambient-grain flex flex-col text-[var(--text)]">
        <AuthProvider>
          <RootShell>{children}</RootShell>
        </AuthProvider>
      </body>
    </html>
  );
}
