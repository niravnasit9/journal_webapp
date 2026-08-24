import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/authContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DemoProvider } from "@/lib/demoContext";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProfitPulse — Trading Journal",
  description: "Track, analyze and improve your trading with ProfitPulse",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
      </head>
      <body className="h-full font-sans selection:bg-blue-500/30 font-active-inter">
        {/* Apply theme instantly before React hydrates to prevent flash */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}`}
        </Script>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'var(--toast-bg, #1f2229)',
            color: 'var(--toast-text, #fff)',
            border: '1px solid var(--toast-border, #334155)',
          }
        }}/>
        <ThemeProvider>
          <AuthProvider>
            <DemoProvider>{children}</DemoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
