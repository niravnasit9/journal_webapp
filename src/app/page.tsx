import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TestimonialSection from "@/components/landing/TestimonialSection";
import IntegrationsMarquee from "@/components/landing/IntegrationsMarquee";
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
    <main className="min-h-screen bg-slate-50 dark:bg-base text-slate-900 dark:text-primary selection:bg-blue-500/30 overflow-x-hidden relative transition-colors duration-300">
      {/* Premium SaaS Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none dark:hidden" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20zM20 0h20v20H20V0z' fill='%23e2e8f0' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, white, transparent)'
      }}></div>
      
      {/* Top Gradient Flare for Light Mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-100/50 to-transparent blur-3xl pointer-events-none rounded-full dark:hidden"></div>

      <div className="relative z-10">
        <LandingNavbar />
        <HeroSection />
        <IntegrationsMarquee />
        <FeatureGrid />
        <TestimonialSection />
        <ContactSection />
        <LandingFooter />
      </div>
    </main>
  );
}
