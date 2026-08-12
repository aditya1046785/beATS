import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

const siteUrl = "https://beats.cerecrafts.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "beATS — AI Resume Builder That Beats the ATS",
    template: "%s | beATS",
  },
  description:
    "beATS connects your GitHub account, analyzes your real projects, and generates an ATS-optimized resume tailored to any job description — so developers get more interviews.",
  openGraph: {
    title: "beATS — AI Resume Builder That Beats the ATS",
    description:
      "Connect GitHub, paste a job description, and get a tailored ATS-optimized resume that highlights the projects recruiters care about.",
    url: siteUrl,
    siteName: "beATS",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "beATS — AI Resume Builder That Beats the ATS",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "beATS — AI Resume Builder That Beats the ATS",
    description:
      "Connect GitHub, paste a job description, and get a tailored ATS-optimized resume that highlights the projects recruiters care about.",
    images: ["/og.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
