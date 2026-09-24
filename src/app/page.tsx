import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ContactSection from "@/components/landing/ContactSection";
import LandingFooter from "@/components/landing/LandingFooter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProfitPulse — The Ultimate Trading Edge",
  description: "Automated trade journaling, deep analytics, MFE/MAE insights, and AI-powered playbooks.",
};

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050608] text-foreground selection:bg-blue-500/30 overflow-x-hidden">
      <LandingNavbar />
      <HeroSection />
      <FeatureGrid />
      <ContactSection />
      <LandingFooter />
    </main>
  );
}
