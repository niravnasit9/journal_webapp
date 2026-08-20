import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/firebase/authContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProfitPulse — Trading Journal",
  description: "Track, analyze and improve your trading with ProfitPulse",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css" />
      </head>
      <body className="h-full font-sans selection:bg-blue-500/30 font-active-inter">
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'var(--toast-bg, #1f2229)',
            color: 'var(--toast-text, #fff)',
            border: '1px solid var(--toast-border, #334155)',
          }
        }}/>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
