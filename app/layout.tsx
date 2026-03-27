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
    default: "PlacementChat - Decode the Interview. Own the Offer.",
    template: "%s - PlacementChat",
  },
  description: "The premier hub for verified internship and placement interview intelligence. Access high-quality, student-driven data for SDE, Core, and Management roles. Decode the interview, own the offer.",
  keywords: ["placement", "internship", "interview experiences", "SDE", "engineering", "college placements", "PlacementChat", "interview preparation"],
  authors: [{ name: "Ashish Patil" }],
  creator: "Ashish Patil",
  metadataBase: new URL("https://placementchat.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://placementchat.vercel.app",
    title: "PlacementChat | Peer-to-Peer Interview Intelligence",
    description: "Navigate your career with real-world interview insights from fellow students. Verified logs for DSA, System Design, and more.",
    siteName: "PlacementChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PlacementChat - Verified Interview Experiences",
      },
    ],
  },
  icons: {
    icon: "/icon.png",
  },
};

import { IntroAnimation } from "@/components/intro-animation";
import { PageLoader } from "@/components/page-loader";
import { NeonTrails } from "@/components/neon-trails";

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
          <IntroAnimation />
          <PageLoader />
          <NeonTrails />
          <Navbar />
          <main className="relative z-10 flex min-h-dvh flex-col">
            <div className="flex-1 pt-15 md:pt-10">
              {children}
            </div>
            <Footer />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
