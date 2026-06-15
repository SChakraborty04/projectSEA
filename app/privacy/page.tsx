'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function PrivacyPolicy() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FFFDF5] dark:bg-[#121214] text-black dark:text-white font-mono flex flex-col justify-between select-none">
      
      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#FFFDF5] dark:bg-[#121214] border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="bg-[#FFD93D] dark:bg-[#db6802] border-4 border-black dark:border-white px-3 py-1 text-base font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] text-black dark:text-white">
              SuperEA
            </span>
            <span className="text-[10px] font-black bg-black text-[#FFD93D] border-2 border-black dark:border-white px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              v1 α
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="border-4 border-black dark:border-white bg-[#C4B5FD] p-2 flex items-center justify-center shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:bg-[#b09ffc] btn-push transition-colors duration-100 min-h-[40px] min-w-[40px] text-black cursor-pointer"
              aria-label="Toggle Theme"
            >
              {!mounted ? (
                <span className="w-5 h-5 block" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5 stroke-[3px]" />
              ) : (
                <Moon className="w-5 h-5 stroke-[3px]" />
              )}
            </button>
            <Link
              href="/signin"
              className="border-4 border-black dark:border-white bg-white text-black text-sm font-bold uppercase tracking-wide px-4 py-2 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:bg-[#FFD93D] btn-push transition-colors duration-100"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="border-4 border-black dark:border-white bg-[#FF6B6B] text-black text-sm font-bold uppercase tracking-wide px-5 py-2 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:bg-[#ff5252] btn-push transition-colors duration-100"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-28 pb-16">
        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] overflow-hidden">
          
          {/* Warning Stripes Top Header */}
          <div className="h-6 bg-[repeating-linear-gradient(-45deg,#FFD93D,#FFD93D_10px,#000_10px,#000_20px)] border-b-4 border-black dark:border-white" />
          
          <div className="p-8 md:p-12 space-y-8 select-text">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b-4 border-black dark:border-white pb-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 flex items-center justify-center border-4 border-black dark:border-white bg-[#FFD93D] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                  <Shield className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase leading-none">Privacy Policy</h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mt-1">
                    Last Updated: June 15, 2026
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 h-10 px-4 bg-[#C4B5FD] hover:bg-[#b19ffa] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 rounded-none cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
            </div>

            {/* Policy Content */}
            <div className="space-y-6 text-sm leading-relaxed">
              <section className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-wider border-b-2 border-dashed border-black/30 dark:border-white/30 pb-1">
                  1. Information We Collect
                </h2>
                <p>
                  We collect information directly from you when you register an account, set up your AI assistants, and integrate your third-party integrations (such as Gmail, Google Calendar, or Telegram). This information includes:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-semibold">
                  <li>Personal identifiers (name, email address, password).</li>
                  <li>Integrations metadata and configuration settings.</li>
                  <li>Agent instructions and custom workflow data.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-wider border-b-2 border-dashed border-black/30 dark:border-white/30 pb-1">
                  2. How We Use Your Information
                </h2>
                <p>
                  Your data is used strictly to provide and improve the SuperEA automation services. Specifically, we use it for:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-semibold">
                  <li>Operating, maintaining, and provisioning your AI agent workspace.</li>
                  <li>Executing actions on your behalf across connected services (e.g. email draft creation, event rescheduling).</li>
                  <li>Analyzing interface interactions and logs to troubleshoot errors.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-wider border-b-2 border-dashed border-black/30 dark:border-white/30 pb-1">
                  3. Integrations & Third-Party Access
                </h2>
                <p>
                  SuperEA connects to external APIs like Google and Telegram to perform operations. We access your accounts only with your explicit permission via secure authorization protocols (OAuth). Your raw integration data is processed strictly for the requested commands and is never shared or sold to external third parties.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-wider border-b-2 border-dashed border-black/30 dark:border-white/30 pb-1">
                  4. Data Security
                </h2>
                <p>
                  We take industry-standard measures to protect all credentials and database records from unauthorized access. High-risk actions and tokens are encrypted and handled using secure vault mechanisms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-black uppercase tracking-wider border-b-2 border-dashed border-black/30 dark:border-white/30 pb-1">
                  5. Your Rights and Access
                </h2>
                <p>
                  You have full control over your data. You may request the export or complete deletion of your account and integration histories by contacting support, or directly disconnecting services in your agent setup panel.
                </p>
              </section>
            </div>

            {/* Footer Notice */}
            <div className="border-t-4 border-black dark:border-white pt-8 text-center">
              <p className="text-xs font-bold text-black/60 dark:text-white/60">
                ⚡ SUPEREA IS RUNNING ON SECURE V1 ALPHA SANDBOX CHANNELS.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t-4 border-black dark:border-white py-12 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-[#FFD93D] border-4 border-black text-black px-3 py-1 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#fff]">
                SuperEA
              </span>
              <p className="text-sm font-bold text-white/80">
                © 2026 v1 Alpha
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-sm font-bold uppercase tracking-wide text-white border-4 border-transparent hover:border-white hover:bg-[#FF8B3D] hover:text-black px-3 py-1.5 transition-all duration-100"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-bold uppercase tracking-wide text-white border-4 border-transparent hover:border-white hover:bg-[#C4B5FD] hover:text-black px-3 py-1.5 transition-all duration-100"
              >
                Privacy
              </Link>
              <a
                href="#"
                className="text-sm font-bold uppercase tracking-wide text-white border-4 border-transparent hover:border-white hover:bg-[#FF6B6B] hover:text-black px-3 py-1.5 transition-all duration-100"
              >
                GitHub
              </a>
              <a
                href="#"
                className="text-sm font-bold uppercase tracking-wide text-white border-4 border-transparent hover:border-white hover:bg-[#FFD93D] hover:text-black px-3 py-1.5 transition-all duration-100"
              >
                Docs
              </a>
            </div>
          </div>
          {/* Big SUPEREA word row */}
          <div className="border-t border-white/20 pt-8 text-center select-none">
            <h2 className="text-[12vw] sm:text-[10vw] md:text-[8vw] font-black uppercase tracking-tighter leading-none text-stroke select-none opacity-80" style={{ WebkitTextStroke: "1px rgba(254, 254, 254, 0.58)", color: "transparent" }}>
              SUPEREA
              <span className="inline-block text-xs sm:text-sm md:text-base font-bold tracking-widest text-[#FFD93D] align-middle ml-4 sm:ml-6 px-3 py-1 bg-white text-black border-2 border-black rotate-[-2deg] shadow-[2px_2px_0px_0px_#fff]" style={{ WebkitTextStroke: "0px", color: "black" }}>
                ProjectSEA.v1.Alpha
              </span>
            </h2>
          </div>
        </div>
      </footer>
    </div>
  );
}
