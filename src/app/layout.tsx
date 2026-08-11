import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: "beATS — Resumes built for the exact role",
  description:
    "Paste a job description. We rewrite your GitHub projects to match it and generate one tailored resume for that exact role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
