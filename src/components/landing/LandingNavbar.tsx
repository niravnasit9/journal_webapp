import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-background/50 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <a href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</a>
            <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>
            <a href="#contact" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Contact</a>
          </div>

          <Link href="/login" className="text-sm font-medium text-muted hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full px-6 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]">
              Get Started <i className="las la-arrow-right ml-2"></i>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
