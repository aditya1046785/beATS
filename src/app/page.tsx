import Features from "@/components/sections/Features";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import LiveDemo from "@/components/sections/LiveDemo";
import Navbar from "@/components/sections/Navbar";
import Pricing from "@/components/sections/Pricing";
import ProblemSection from "@/components/sections/ProblemSection";
import SocialProof from "@/components/sections/SocialProof";

export default function Home() {
  return (
    <main style={{ backgroundColor: "#080808" }}>
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <SocialProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
