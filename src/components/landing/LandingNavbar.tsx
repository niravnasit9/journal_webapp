import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-white/80 dark:bg-base/80 border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-4">
            <a href="#features" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <Link href="/pricing" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link>
            <a href="#contact" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
          </div>

          <ThemeToggle variant="icon" />

          <Link href="/login" className="text-sm font-bold text-slate-700 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-full px-6 transition-all duration-300 shadow-[0_4_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 dark:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              Get Started <i className="las la-arrow-right ml-2"></i>
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
