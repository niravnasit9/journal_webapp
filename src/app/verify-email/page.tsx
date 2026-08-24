"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/authContext";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { auth } from "@/lib/firebase/config";
import { sendEmailVerification } from "firebase/auth";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isResending, setIsResending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = "/register";
      } else if (user.emailVerified) {
        window.location.href = "/pricing";
      }
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  if (loading || !user || user.emailVerified) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex items-center justify-center transition-colors duration-300"><LoadingSpinner className="w-12 h-12" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] flex flex-col items-center justify-center text-gray-900 dark:text-white p-6 font-sans transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#111318] rounded-[24px] p-8 border-2 border-indigo-500/20 shadow-2xl text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <i className="las la-envelope-open-text text-4xl text-indigo-500"></i>
        </div>
        
        <h1 className="relative z-10 text-3xl font-black mb-3 tracking-tight">Check your email</h1>
        
        <p className="relative z-10 text-gray-500 dark:text-slate-400 mb-8 font-medium">
          We've sent a verification link to <strong className="text-gray-900 dark:text-white">{user.email}</strong>. 
          Please verify your email address to continue.
        </p>

        <div className="relative z-10 space-y-3">
          <button
            onClick={async () => {
              setIsReloading(true);
              await user.reload(); // Refreshes user data from Firebase
              if (auth.currentUser?.emailVerified) {
                toast.success("Email verified successfully!");
                router.push("/pricing");
              } else {
                toast.error("Email not verified yet. Try again.");
              }
              setIsReloading(false);
            }}
            disabled={isReloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-70"
          >
            {isReloading ? <LoadingSpinner className="w-5 h-5 border-[2px]" /> : "I've verified my email"}
          </button>
          
          <button
            onClick={async () => {
              setIsResending(true);
              try {
                await sendEmailVerification(user);
                toast.success("Verification email sent!");
              } catch (error: any) {
                if (error.code === "auth/too-many-requests") {
                  toast.error("Please wait a few minutes before resending.");
                } else {
                  toast.error("Failed to send email. Try again later.");
                }
              }
              setIsResending(false);
            }}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-[#1a1d24] hover:bg-gray-200 dark:hover:bg-[#252830] text-gray-700 dark:text-slate-300 font-bold rounded-xl transition-all disabled:opacity-70"
          >
            {isResending ? <LoadingSpinner className="w-5 h-5 border-[2px]" /> : "Resend email"}
          </button>

          <button
            onClick={handleLogout}
            className="w-full pt-4 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white transition-colors"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
