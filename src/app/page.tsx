import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

export const metadata: Metadata = {
  title: "AI Resume Builder from GitHub — Beat the ATS",
  description:
    "Turn GitHub projects into an ATS-optimized resume tailored to any job description. beATS rewrites your projects in the exact language recruiters scan for.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Resume Builder from GitHub — Beat the ATS",
    description:
      "Turn GitHub projects into an ATS-optimized resume tailored to any job description. beATS rewrites your projects in the exact language recruiters scan for.",
    url: "/",
    siteName: "beATS",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "beATS — AI Resume Builder from GitHub that beats the ATS",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder from GitHub — Beat the ATS",
    description:
      "Turn GitHub projects into an ATS-optimized resume tailored to any job description. beATS rewrites your projects in the exact language recruiters scan for.",
    images: ["/og.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "beATS",
  url: "https://beats.cerecrafts.in",
  description:
    "beATS is an AI resume builder that connects your GitHub account, analyzes your real projects, and generates an ATS-optimized resume tailored to any job description — so developers get more interviews.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    category: "Free",
  },
};

function getHomepageSource() {
  const homepagePath = path.resolve(process.cwd(), "index.html");
  const html = fs.readFileSync(homepagePath, "utf8");

  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);

  if (!styleMatch || !bodyMatch) {
    throw new Error("Could not extract homepage markup from positionperfect/index.html");
  }

  return {
    css: styleMatch[1].trim(),
    body: bodyMatch[1].trim(),
  };
}

export default function Home() {
  const homepage = getHomepageSource();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: homepage.css }} />
      <main dangerouslySetInnerHTML={{ __html: homepage.body }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
