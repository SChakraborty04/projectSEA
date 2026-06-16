"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Brain,
  CalendarClock,
  MessageSquareText,
  Keyboard,
  Zap,
  Mail,
  Calendar as CalendarIcon,
  Send,
  Bot,
  Menu,
  X,
  Sparkles,
  MailOpen,
  Clock,
  CheckCircle2,
  Star,
  ArrowRight,
  PlayCircle,
  Sun,
  Moon,
  MousePointer2,
  Lock,
  Check,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Live Demo Agent Showcase State
  const [demoStep, setDemoStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<"drafting" | "pending" | "approved" | "rewriting">("drafting");
  const [draftVersion, setDraftVersion] = useState(1);
  const [pricingLocked, setPricingLocked] = useState(true);
  const [pricingWaitlistEmail, setPricingWaitlistEmail] = useState("");
  const [pricingWaitlistShowForm, setPricingWaitlistShowForm] = useState(false);
  const [pricingWaitlistSubmitted, setPricingWaitlistSubmitted] = useState(false);
  const [showWaitlistNotice, setShowWaitlistNotice] = useState(false);
  const [blockState, setBlockState] = useState<"idle" | "breaking" | "done">("idle");

  const stepsList = [
    "> Event received: Gmail webhook",
    "> SEA Checking Phishing.. Safe ✓",
    "> SEA Generating context.. Synced ✓",
    "> Checking Calendar.. Free at 10 AM ✓",
    "> Drafting reply...",
    draftVersion === 1 ? "> Draft Complete!" : "> Draft Complete (v2)!"
  ];

  // Auto-advance loop for the steps
  useEffect(() => {
    if (demoStatus === "drafting") {
      const getDelay = () => {
        switch (demoStep) {
          case 0: return 2000; // Listening wait
          case 1: return 1200; // Event received -> Phishing scan
          case 2: return 800;  // Scanning -> Threat check safe
          case 3: return 600;  // Safe -> Generating context
          case 4: return 1000; // Context engine start -> Sync
          case 5: return 600;  // Sync -> Checking calendar
          case 6: return 1200; // Calendar start -> Checked slots
          case 7: return 800;  // Free slot -> Drafting reply
          case 8: return 1500; // Drafting -> Done
          default: return 800;
        }
      };

      const timer = setTimeout(() => {
        if (demoStep < stepsList.length) {
          setDemoStep((prev) => prev + 1);
        } else {
          setDemoStatus("pending");
        }
      }, getDelay());
      return () => clearTimeout(timer);
    }
  }, [demoStep, demoStatus, stepsList.length]);

  // Auto-reset if user doesn't interact for a while in pending state
  useEffect(() => {
    if (demoStatus === "pending") {
      const timer = setTimeout(() => {
        setDemoStep(0);
        setDemoStatus("drafting");
        setDraftVersion(1);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [demoStatus]);

  const handleApprove = () => {
    setDemoStatus("approved");
    setTimeout(() => {
      setDemoStep(0);
      setDemoStatus("drafting");
      setDraftVersion(1);
    }, 4000);
  };

  const handleRewrite = () => {
    setDemoStatus("rewriting");
    setDraftVersion(2);
    setTimeout(() => {
      setDemoStep(8); // Go back to "Drafting reply..."
      setDemoStatus("drafting");
    }, 1500);
  };

  const getVisibleSteps = () => {
    if (demoStep === 0) {
      return ["> Ready. Listening for webhooks..."];
    }
    
    if (demoStatus === "rewriting") {
      return [
        "> Event received: Gmail webhook",
        "> SEA Checking Phishing...: Safe ✓",
        "> SEA Generating context...: Synced ✓",
        "> Checking Calendar...: Free at 10 AM ✓",
        "> Optimizing draft with suggestions..."
      ];
    }
    
    const base = stepsList.slice(0, demoStep);
    
    if (demoStatus === "approved") {
      return [...stepsList, "> Reply sent to Johnathan! (00:08.4s)"];
    }
    
    return base;
  };

  // Scroll triggered active step tracker — uses scroll position instead of
  // IntersectionObserver because IO breaks when any ancestor has a CSS
  // transform (Framer Motion) or overflow clipping.
  const [activeScrollStep, setActiveScrollStep] = useState(0);
  const scrollTicking = useRef(false);

  const updateActiveStep = useCallback(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-step-index]");
    if (elements.length === 0) return;

    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = parseInt(el.getAttribute("data-step-index") || "0", 10);
      }
    });

    setActiveScrollStep(closestIndex);
    scrollTicking.current = false;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!scrollTicking.current) {
        scrollTicking.current = true;
        requestAnimationFrame(updateActiveStep);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once on mount so the first visible card activates immediately
    updateActiveStep();

    return () => window.removeEventListener("scroll", onScroll);
  }, [updateActiveStep]);

  const scrollSteps = [
    {
      num: 0,
      badge: "01. CONNECT",
      title: "Google Sync",
      desc: "Link your Gmail and Google Calendar via Corsair's secure OAuth flow. One click, full sync.",
    },
    {
      num: 1,
      badge: "02. INCOMING",
      title: "Real-time webhook",
      desc: "Gmail pushes notifications the moment a new message arrives. Your agent is triggered instantly.",
    },
    {
      num: 2,
      badge: "03. COGNITION",
      title: "Security & Context",
      desc: "AI scans for phishing threats, queries calendar availability, and processes the living context.",
    },
    {
      num: 3,
      badge: "04. APPROVAL LOOP",
      title: "Telegram Notifications",
      desc: "Drafts appear on your Telegram bot or dashboard requiring approval. Suggest rewrites in-place.",
    },
    {
      num: 4,
      badge: "05. DISPATCH",
      title: "Instant Sending",
      desc: "Once approved, the email is dispatched via Gmail. Zero manual copy-pasting required.",
    },
  ];

  const renderStickyVisual = () => {
    switch (activeScrollStep) {
      case 0: // Step 1: Connect
        return (
          <motion.div
            key="step-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-dot-grid bg-[#FFFDF5] dark:bg-[#121214]"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-[#FFD93D]/5 pointer-events-none" />
            
            {/* Visual Flow diagram */}
            <div className="flex items-center gap-12 mb-6 z-10 relative">
              {/* Gmail Node */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="border-2 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] p-2 shadow-[2px_2px_0px_0px_#000] dark:shadow-none flex items-center justify-center"
              >
                <Mail className="w-5 h-5 text-red-500" />
              </motion.div>

              {/* Connecting Dashes */}
              <div className="absolute left-6 right-6 h-0.5 border-t-2 border-dashed border-black/30 dark:border-white/20 -z-10" />

              {/* Central Hub (SuperEA) */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="border-4 border-black dark:border-[#3F3F46] bg-[#FFD93D] p-3 shadow-[4px_4px_0px_0px_#000] dark:shadow-none z-10 flex items-center justify-center"
              >
                <Bot className="w-6 h-6 text-black" />
              </motion.div>

              {/* Calendar Node */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                className="border-2 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] p-2 shadow-[2px_2px_0px_0px_#000] dark:shadow-none flex items-center justify-center"
              >
                <CalendarIcon className="w-5 h-5 text-blue-500" />
              </motion.div>
            </div>

            {/* Auth Modal Mockup */}
            <div className="border-4 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] p-4 shadow-[4px_4px_0px_0px_#000] dark:shadow-none max-w-sm w-full relative z-10">
              <h4 className="font-black text-[10px] uppercase mb-3 text-black dark:text-white flex items-center gap-1.5 border-b-2 border-black dark:border-[#3F3F46] pb-1.5">
                <Lock className="w-3.5 h-3.5" />
                Google OAuth Setup
              </h4>
              
              {/* Sign In Button */}
              <div className="relative">
                <motion.button
                  animate={{
                    scale: [1, 0.95, 1, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    times: [0, 0.35, 0.4, 1],
                  }}
                  className="border-2 border-black dark:border-[#3F3F46] bg-[#FFD93D] text-black text-[10px] font-black px-4 py-2 flex items-center gap-2 mb-3 w-full justify-center shadow-[2px_2px_0px_0px_#000] dark:shadow-none"
                >
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full inline-block" />
                  Sign in with Google
                </motion.button>

                {/* Animated click ripple */}
                <motion.div
                  animate={{
                    scale: [0.5, 2.2, 2.2],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    times: [0, 0.36, 0.5],
                  }}
                  className="absolute inset-0 m-auto w-12 h-6 border-2 border-red-500 rounded-full pointer-events-none"
                />

                {/* Simulated Cursor */}
                <motion.div
                  animate={{
                    x: [80, 0, 0, 80],
                    y: [60, 0, 0, 60],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    times: [0, 0.32, 0.5, 1],
                  }}
                  className="absolute right-4 bottom-[-10px] text-black z-30 pointer-events-none"
                >
                  <MousePointer2 className="w-5 h-5 fill-white stroke-[2.5px] text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                </motion.div>
              </div>

              {/* Status items */}
              <div className="space-y-1.5 text-left text-[10px] font-bold text-black/60 dark:text-white/60">
                <motion.p
                  animate={{
                    opacity: [0.3, 0.3, 1, 1],
                    x: [-5, -5, 0, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    times: [0, 0.42, 0.48, 1],
                  }}
                  className="flex items-center gap-1 text-green-600 dark:text-green-400"
                >
                  ✓ Gmail webhook sync enabled
                </motion.p>
                <motion.p
                  animate={{
                    opacity: [0.3, 0.3, 1, 1],
                    x: [-5, -5, 0, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    times: [0, 0.48, 0.54, 1],
                  }}
                  className="flex items-center gap-1 text-green-600 dark:text-green-400"
                >
                  ✓ Calendar events reading verified
                </motion.p>
              </div>
            </div>
          </motion.div>
        );
      case 1: // Step 2: Mail Incoming
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-dot-grid bg-[#FFFDF5] dark:bg-[#121214]"
          >
            <div className="absolute inset-0 bg-[#FF6B6B]/5 pointer-events-none" />
            
            {/* Dotted pathway and traveling envelope */}
            <div className="w-full max-w-sm mb-4 relative h-12 flex items-center justify-between px-8 border-2 border-dashed border-black/20 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <span className="text-[8px] font-mono font-bold text-black/40 dark:text-white/30">GMAIL</span>
              
              <div className="absolute left-16 right-16 h-0.5 border-t-2 border-dotted border-black/30 dark:border-white/20" />
              
              {/* Traveling Packet */}
              <motion.div
                animate={{
                  x: [0, 160, 160],
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
                className="absolute left-16 bg-[#FF6B6B] border border-black p-1 shadow-[2px_2px_0px_0px_#000] dark:shadow-none"
              >
                <Mail className="w-3.5 h-3.5 text-white" />
              </motion.div>

              <span className="text-[8px] font-mono font-bold text-black/40 dark:text-white/30">SUPEREA API</span>
            </div>

            {/* Email Container Mockup */}
            <motion.div
              animate={{
                scale: [0.97, 1, 0.97],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
              }}
              className="border-4 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] p-4 shadow-[4px_4px_0px_0px_#000] dark:shadow-none w-full max-w-sm z-10"
            >
              <div className="flex justify-between items-center border-b-2 border-black dark:border-[#3F3F46] pb-2 mb-3">
                <span className="text-[9px] font-black uppercase text-[#FF6B6B] flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Webhook Triggered
                </span>
                <span className="font-mono text-[9px] bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5">
                  POST /v1/incoming
                </span>
              </div>
              
              {/* Message Details */}
              <div className="bg-[#FFFDF5] dark:bg-[#25252A] border-2 border-black dark:border-[#3F3F46] p-2.5 mb-2 font-mono text-[10px] space-y-1">
                <p className="text-black dark:text-white"><span className="font-black text-black/40 dark:text-white/40">FROM:</span> Jonathan &lt;jonathan@superea.app&gt;</p>
                <p className="text-black dark:text-white"><span className="font-black text-black/40 dark:text-white/40">SUBJ:</span> Friday Standup Sync</p>
              </div>
              <p className="text-[10px] font-bold text-black dark:text-white bg-[#FFFDF5] dark:bg-[#25252A] border-2 border-black dark:border-[#3F3F46] p-2.5 leading-relaxed">
                "Sandipan are you free this Friday at 10 am for a quick standup about a new feature that is coming on SuperEA?"
              </p>
            </motion.div>
          </motion.div>
        );
      case 2: // Step 3: AI Processing
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full grid grid-cols-2 p-4 gap-3 font-mono text-[9px] leading-relaxed relative overflow-hidden bg-black text-white select-none"
          >
            {/* Left Column: Triage & Security Scan */}
            <div className="border-2 border-white/20 bg-white/5 p-3 flex flex-col justify-between relative overflow-hidden">
              <div>
                <p className="text-green-400 font-bold border-b border-white/10 pb-1 mb-2 uppercase tracking-wide">
                  🛡️ Threat Triage
                </p>
                <p className="text-white/70">&gt; analyzing email structure...</p>
                <p className="text-white/70">&gt; header validation: ok</p>
                <p className="text-white/70">&gt; links verification: safe</p>
                <p className="text-white/70">&gt; attachments: none</p>
              </div>

              {/* Scanner Scanning Laser line */}
              <motion.div
                animate={{
                  y: [0, 120, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "linear",
                }}
                className="absolute left-0 right-0 h-0.5 bg-[#FF6B6B] opacity-80"
              />

              <div className="border-t border-white/10 pt-2 mt-2">
                <span className="bg-green-500 text-black font-black px-1 text-[8px] uppercase">
                  RISK: SAFE (0.01%)
                </span>
              </div>
            </div>

            {/* Right Column: Context & Calendar */}
            <div className="border-2 border-white/20 bg-white/5 p-3 flex flex-col justify-between">
              <div>
                <p className="text-purple-400 font-bold border-b border-white/10 pb-1 mb-2 uppercase tracking-wide">
                  📅 Context Engine
                </p>
                <p className="text-white/70">&gt; querying gcal events...</p>
                <p className="text-white/70">&gt; checking timezone...</p>
                <p className="text-white/70">&gt; friday slots checked.</p>
              </div>

              {/* Mock Calendar Grid Accent */}
              <div className="my-2 border border-white/10 p-1 bg-black/40">
                <div className="grid grid-cols-5 gap-[2px] text-[7px] text-center mb-1">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span className="text-purple-400 font-bold">F</span>
                </div>
                <div className="grid grid-cols-5 gap-[2px]">
                  {[...Array(10)].map((_, i) => {
                    const isTarget = i === 9; // Friday 10 AM slot
                    return (
                      <motion.div
                        key={i}
                        animate={isTarget ? {
                          backgroundColor: ["rgba(139,92,246,0.1)", "rgba(139,92,246,0.8)", "rgba(139,92,246,0.1)"]
                        } : {}}
                        transition={isTarget ? { repeat: Infinity, duration: 1.5 } : {}}
                        className={`h-2 border border-white/5 ${isTarget ? 'border-purple-400' : 'bg-white/5'}`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 pt-2">
                <span className="bg-purple-500 text-white font-black px-1 text-[8px] uppercase">
                  SLOT FREE: FRI 10AM
                </span>
              </div>
            </div>

            {/* Bottom Full-Width Status Ticker */}
            <div className="col-span-2 border-t border-white/20 pt-2 flex justify-between items-center text-[#FFD93D]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FFD93D] rounded-full animate-ping" />
                <span>[AGENT] Preparing reply draft proposals...</span>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              >
                <Bot className="w-3.5 h-3.5 text-white/55" />
              </motion.div>
            </div>
          </motion.div>
        );
      case 3: // Step 4: Approval Request
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-dot-grid bg-[#FFFDF5] dark:bg-[#121214]"
          >
            <div className="absolute inset-0 bg-[#C4B5FD]/5 pointer-events-none" />
            
            {/* Telegram Phone Window Frame Mockup */}
            <div className="border-4 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-none w-full max-w-sm overflow-hidden z-10">
              {/* Telegram App Header */}
              <div className="bg-[#C4B5FD] dark:bg-[#5b21b6] border-b-2 border-black dark:border-[#3F3F46] px-3 py-1.5 flex justify-between items-center text-black dark:text-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-[9px]">
                    S
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight">SuperEA Co-pilot</span>
                </div>
                <span className="bg-black text-white text-[7px] px-1 font-bold tracking-widest uppercase">
                  Telegram Bot
                </span>
              </div>

              {/* Chat Canvas */}
              <div className="p-3 bg-[#E4ECF5] dark:bg-[#1A1A1F] min-h-[140px] flex flex-col justify-end gap-3 font-sans">
                
                {/* Bubble 1: Incoming Notification */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-[#2D2D35] border-2 border-black dark:border-[#3F3F46] p-2 text-[10px] max-w-[85%] self-start text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-none"
                >
                  <p className="font-black text-[#5b21b6] dark:text-[#a78bfa] text-[8px] uppercase mb-0.5">Draft Reply Ready</p>
                  <p className="font-bold leading-normal">
                    "Hi Jonathan, yes I am free this Friday at 10 AM. Let's sync up!"
                  </p>
                </motion.div>

                {/* Bubble 2: Action Keyboard */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="w-full grid grid-cols-2 gap-2 mt-1 relative"
                >
                  <motion.div
                    animate={{
                      scale: [1, 0.93, 1, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      delay: 1.5,
                      times: [0, 0.1, 0.15, 1],
                    }}
                    className="bg-[#86EFAC] text-black border-2 border-black text-[9px] font-black p-1.5 text-center shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1 cursor-pointer select-none"
                  >
                    <span>APPROVE</span>
                  </motion.div>

                  <div className="bg-white text-black border-2 border-black text-[9px] font-black p-1.5 text-center shadow-[2px_2px_0px_0px_#000] flex items-center justify-center cursor-pointer select-none">
                    REWRITE
                  </div>

                  {/* Finger pointer click animation */}
                  <motion.div
                    animate={{
                      x: [90, 45, 45, 90],
                      y: [40, 10, 10, 40],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      delay: 1,
                      times: [0, 0.35, 0.5, 1],
                    }}
                    className="absolute right-12 bottom-[-15px] pointer-events-none"
                  >
                    <MousePointer2 className="w-5 h-5 fill-white stroke-[2.5px] text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                  </motion.div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        );
      case 4: // Step 5: Sent
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col justify-center items-center p-4 relative overflow-hidden bg-dot-grid bg-[#FFFDF5] dark:bg-[#121214]"
          >
            <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />

            {/* Flight Path SVG + Airplane tracing the path */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                {/* The dashed flight trail */}
                <path
                  id="flightPath"
                  d="M 50,250 Q 150,100 300,50"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-100"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Paper airplane icon tracing the flight path */}
                <g>
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    rotate="auto"
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="linear"
                  >
                    <mpath href="#flightPath" />
                  </animateMotion>
                  {/* Send / paper-plane shape */}
                  <polygon
                    points="-8,6 8,0 -8,-6 -5,0"
                    fill="#22C55E"
                    stroke="#166534"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>

            {/* Success Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, delay: 0.3 }}
              className="relative border-4 border-black dark:border-[#3F3F46] bg-white dark:bg-[#1C1C1F] p-5 shadow-[6px_6px_0px_0px_#000] dark:shadow-none max-w-sm w-full z-20 text-center"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  repeatDelay: 1,
                }}
                className="w-12 h-12 bg-[#86EFAC] border-4 border-black dark:border-[#3F3F46] flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_#000] dark:shadow-none mb-3"
              >
                <CheckCircle2 className="w-6 h-6 stroke-[3px] text-black" />
              </motion.div>
              
              <h4 className="font-black text-xs uppercase text-black dark:text-white">Email Dispatched!</h4>
              <p className="text-[9px] font-bold text-black/50 dark:text-white/40 mt-1 uppercase tracking-wider">
                Sent successfully via Gmail API
              </p>

              {/* Progress bar loading loops */}
              <div className="mt-4 h-2 w-full bg-black/10 dark:bg-white/10 border-2 border-black dark:border-[#3F3F46] overflow-hidden">
                <motion.div
                  animate={{
                    width: ["0%", "100%", "100%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    times: [0, 0.8, 1],
                  }}
                  className="h-full bg-green-500"
                />
              </div>
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const submitWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Phishing & Threat Detection",
      description:
        "Every incoming email is scanned by our industry grade ML model. Phishing attempts are flagged instantly, keeping your inbox clean and secure.",
      color: "bg-[#FF6B6B]",
    },
    {
      icon: Brain,
      title: "Daily Context Engine",
      description:
        "A living markdown context is rebuilt every morning — summarizing your emails, meetings, and agenda — so the AI agent always knows your day.",
      color: "bg-[#FFD93D]",
    },
    {
      icon: CalendarClock,
      title: "Proactive Scheduling",
      description:
        "When someone requests a meeting, the agent checks your calendar, timezone, and working hours. It proposes slots or schedules events automatically.",
      color: "bg-[#C4B5FD]",
    },
    {
      icon: MessageSquareText,
      title: "Draft & Approve Loop",
      description:
        "AI-generated email replies appear on your dashboard and Telegram bot for approval. Suggest improvements, and the agent rewrites them in-place.",
      color: "bg-[#FFD93D]",
    },
    {
      icon: Keyboard,
      title: "Superagent Shortcuts",
      description:
        "Navigate your entire workspace with Vim-inspired keyboard shortcuts. Go anywhere, compose, toggle dark mode — all without touching the mouse. Try is now by pressing 'd'.",
      color: "bg-[#FF6B6B]",
    },
    {
      icon: Zap,
      title: "Real-Time Webhooks",
      description:
        "Gmail and Calendar push notifications trigger the agent instantly. No polling, no delays. Your assistant reacts the moment something happens.",
      color: "bg-[#C4B5FD]",
    },
  ];

  

  const integrations = [
    { icon: Mail, name: "Gmail", subtitle: "Sync & Send", color: "bg-[#FF6B6B]" },
    {
      icon: CalendarIcon,
      name: "Google Calendar",
      subtitle: "Events & Availability",
      color: "bg-[#FFD93D]",
    },
    { icon: Send, name: "Telegram", subtitle: "Approve via Bot", color: "bg-[#C4B5FD]" },
    { icon: Bot, name: "SuperEA AI", subtitle: "Agent Engine", color: "bg-[#FF6B6B]" },
  ];

  const shortcuts = [
    { keys: ["G", "D"], action: "Dashboard" },
    { keys: ["G", "E"], action: "Emails" },
    { keys: ["G", "A"], action: "Calendar" },
    { keys: ["G", "C"], action: "AI Chat" },
    { keys: ["C"], action: "Compose" },
    { keys: ["T"], action: "Toggle Sidebar" },
    { keys: ["D"], action: "Dark Mode" },
    { keys: ["?"], action: "Help Menu" },
  ];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=block');

            :root {
              --bg-page: #FFFDF5;
              --bg-card: #ffffff;
              --bg-inner: #FFFDF5;
              --text-primary: #000000;
              --text-muted: rgba(0, 0, 0, 0.6);
              --border-color: #000000;
              --bg-grid-color: rgba(0, 0, 0, 0.06);
              --bg-halftone-color: #000000;
              --shadow-color: #000000;
            }

            .dark {
              --bg-page: #121214;
              --bg-card: #1C1C1F;
              --bg-inner: #25252A;
              --text-primary: #e9e9e9ff;
              --text-muted: rgba(244, 244, 246, 0.6);
              --border-color: #3F3F46;
              --bg-grid-color: rgba(255, 255, 255, 0.04);
              --bg-halftone-color: #ffffff;
              --shadow-color: #C4B5FD;
            }

            * {
              border-radius: 0px !important;
            }

            html {
              scroll-behavior: smooth;
            }

            .neo-font {
              font-family: 'Space Grotesk', ui-sans-serif, sans-serif !important;
            }

            /* Theme Base Application Overrides */
            .min-h-screen, [class*="bg-[#FFFDF5]"], header {
              background-color: var(--bg-page) !important;
              color: var(--text-primary) !important;
              transition: background-color 300ms ease, border-color 300ms ease;
            }
            .bg-white {
              background-color: var(--bg-card) !important;
              color: var(--text-primary) !important;
              transition: background-color 300ms ease, border-color 300ms ease;
            }
            .text-black {
              color: var(--text-primary) !important;
            }
            .text-black\\/60 {
              color: var(--text-muted) !important;
            }
            .text-black\\/40 {
              color: rgba(244, 244, 246, 0.4) !important;
            }
            .border-black, 
            .border-b-4, 
            .border-t-4, 
            .border-r-4, 
            .border-l-4, 
            .border-y-4,
            .divide-black > * {
              border-color: var(--border-color) !important;
              transition: border-color 300ms ease;
            }

            /* Containers */
            [class*="bg-[#C4B5FD]/20"] {
              background-color: rgba(196, 181, 253, 0.08) !important;
            }
            [class*="bg-[#FFD93D]/20"] {
              background-color: rgba(255, 217, 61, 0.08) !important;
            }
            [class*="bg-[#C4B5FD]/10"] {
              background-color: rgba(196, 181, 253, 0.04) !important;
            }

            /* Primary color dark mode mapping */
            .dark [class*="bg-[#FF6B6B]"] {
              color: #F4F4F6 !important;
            }
            .dark [class*="bg-[#FFD93D]"] {
              background-color: #db6802 !important;
              color: #e4e4e4ff !important;
            }
            .dark [class*="bg-[#C4B5FD]"] {
              background-color: #5b21b6 !important;
              color: #F4F4F6 !important;
            }
            .dark [class*="text-[#FF6B6B]"] {
              color: #f87171 !important;
            }
            .dark [class*="text-[#FFD93D]"] {
              color: #fbbf24 !important;
            }
            .dark [class*="text-[#C4B5FD]"] {
              color: #c084fc !important;
            }
            .dark [class*="fill-[#FF6B6B]"] {
              fill: #991b1b !important;
              color: #991b1b !important;
            }
            .dark [class*="hover:bg-[#FF6B6B]"]:hover {
              background-color: #991b1b !important;
            }
            .dark [class*="hover:bg-[#FFD93D]"]:hover {
              background-color: #db6802 !important;
            }
            .dark [class*="hover:bg-[#ff5252]"]:hover {
              background-color: #7f1d1d !important;
            }

            /* Keep buttons and badges dark or functional */
            button.bg-black, a.bg-black {
              background-color: #1E1E22 !important;
              color: #F4F4F6 !important;
              border-color: var(--border-color) !important;
            }
            .bg-black.text-white {
              background-color: #1E1E22 !important;
              color: #F4F4F6 !important;
              border-color: var(--border-color) !important;
            }
            .dark input, .dark textarea {
              background-color: var(--bg-inner) !important;
              color: var(--text-primary) !important;
              border-color: var(--border-color) !important;
            }
            .dark input::placeholder {
              color: rgba(244, 244, 246, 0.4) !important;
            }

            /* Graph Paper Grid */
            .bg-grid {
              background-size: 40px 40px;
              background-image:
                linear-gradient(to right, var(--bg-grid-color) 1px, transparent 1px),
                linear-gradient(to bottom, var(--bg-grid-color) 1px, transparent 1px) !important;
            }

            /* Halftone dot pattern */
            .bg-halftone {
              background-image: radial-gradient(var(--bg-halftone-color) 1px, transparent 1px) !important;
              background-size: 16px 16px;
              opacity: 0.04;
              position: absolute;
              inset: 0;
              pointer-events: none;
              z-index: 0;
            }
            .dark .bg-halftone {
              opacity: 0.08 !important;
            }

            /* Text Stroke for display headings */
            .text-stroke {
              -webkit-text-stroke: 2px var(--text-primary);
              color: transparent;
            }

            /* Mechanical button push */
            .btn-push {
              transition: all 100ms ease-out;
            }
            .btn-push:active {
              transform: translate(4px, 4px) !important;
              box-shadow: 0px 0px 0px 0px #000 !important;
            }

            /* Shadows & Card lift */
            .shadow-\\[4px_4px_0px_0px_\\#000\\] {
              box-shadow: 4px 4px 0px 0px var(--shadow-color) !important;
            }
            .shadow-\\[8px_8px_0px_0px_\\#000\\] {
              box-shadow: 8px 8px 0px 0px var(--shadow-color) !important;
            }
            .shadow-\\[12px_12px_0px_0px_\\#000\\] {
              box-shadow: 12px 12px 0px 0px var(--shadow-color) !important;
            }
            .card-lift {
              transition: all 200ms ease-out;
            }
            .card-lift:hover {
              transform: translateY(-4px);
              box-shadow: 12px 12px 0px 0px var(--shadow-color) !important;
            }

            /* Marquee */
            @keyframes marquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 20s linear infinite;
            }

            /* Slow spin for decorative stars */
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
              animation: spin-slow 10s linear infinite;
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
              .animate-marquee,
              .animate-spin-slow {
                animation: none !important;
              }
            }
          `,
        }}
      />

      <div className="min-h-screen bg-[#FFFDF5] text-black neo-font selection:bg-[#FF6B6B] selection:text-white relative">
        {/* ─── Halftone texture overlay ─── */}
        <div className="bg-halftone" aria-hidden="true" />

        {/* ─── NAVBAR ─── */}
        <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#FFFDF5] border-b-4 border-black">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <span className="bg-[#FFD93D] dark:bg-[#db6802] border-4 border-black px-3 py-1 text-base font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#000]">
                SuperEA
              </span>
              <span className="text-[10px] font-black bg-black text-[#FFD93D] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
                v1 α
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {["Features", "How It Works", "Integrations", "Shortcuts"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                    className="px-3 py-2 text-sm font-bold uppercase tracking-wide text-black hover:bg-[#FF6B6B] hover:text-black border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_#000] transition-all duration-100"
                  >
                    {item}
                  </a>
                )
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="border-4 border-black bg-[#C4B5FD] p-2 flex items-center justify-center shadow-[4px_4px_0px_0px_#000] hover:bg-[#b09ffc] btn-push transition-colors duration-100 min-h-[40px] min-w-[40px]"
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
                className="border-4 border-black bg-white text-sm font-bold uppercase tracking-wide px-4 py-2 shadow-[4px_4px_0px_0px_#000] hover:bg-[#FFD93D] btn-push transition-colors duration-100"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="border-4 border-black bg-[#FF6B6B] text-sm font-bold uppercase tracking-wide px-5 py-2 shadow-[4px_4px_0px_0px_#000] hover:bg-[#ff5252] btn-push transition-colors duration-100"
              >
                Get Started
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="border-4 border-black bg-[#C4B5FD] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-[4px_4px_0px_0px_#000] btn-push"
                aria-label="Toggle theme"
              >
                {!mounted ? (
                  <span className="w-5 h-5 block" />
                ) : resolvedTheme === "dark" ? (
                  <Sun className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <Moon className="w-5 h-5 stroke-[3px]" />
                )}
              </button>
              <button
                className="border-4 border-black bg-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-[4px_4px_0px_0px_#000] btn-push"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 stroke-[3px]" />
                ) : (
                  <Menu className="w-6 h-6 stroke-[3px]" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-[#FFFDF5] border-b-4 border-black p-6 flex flex-col gap-3 z-50">
              {["Features", "How It Works", "Integrations", "Shortcuts"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="border-4 border-black bg-white text-sm font-bold uppercase tracking-wide px-4 py-3 text-center shadow-[4px_4px_0px_0px_#000] btn-push"
                  >
                    {item}
                  </a>
                )
              )}
              <div className="h-1 bg-black my-1" />
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="border-4 border-black bg-[#FFD93D] text-sm font-bold uppercase tracking-wide px-4 py-3 text-center shadow-[4px_4px_0px_0px_#000] btn-push"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="border-4 border-black bg-[#FF6B6B] text-sm font-bold uppercase tracking-wide px-4 py-3 text-center shadow-[4px_4px_0px_0px_#000] btn-push"
              >
                Get Started
              </Link>
            </div>
          )}
        </header>

        {/* ─── MARQUEE TICKER ─── */}
        <div className="w-full bg-black text-white py-2.5 border-b-4 border-black overflow-hidden select-none z-40 sticky top-16">
          <div className="flex overflow-x-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-6 text-sm font-bold uppercase tracking-widest">
              <Star className="h-4 w-4 fill-[#FFD93D] text-[#FFD93D] shrink-0" />
              <span>SUPEREA V1 ALPHA IS LIVE</span>
              <Star className="h-4 w-4 fill-[#FF6B6B] text-[#FF6B6B] shrink-0" />
              <span>PHISHING SCANNING AT 99.4% CONFIDENCE</span>
              <Star className="h-4 w-4 fill-[#C4B5FD] text-[#C4B5FD] shrink-0" />
              <span>MASTRA AI AGENT ENGINE RUNNING</span>
              <Star className="h-4 w-4 fill-[#FFD93D] text-[#FFD93D] shrink-0" />
              <span>ZERO-CLICK INBOX TRIAGE ACTIVE</span>
              <Star className="h-4 w-4 fill-[#FF6B6B] text-[#FF6B6B] shrink-0" />
              <span>VIM SHORTCUTS LOADED</span>
              <Star className="h-4 w-4 fill-[#C4B5FD] text-[#C4B5FD] shrink-0" />
              {/* Duplicate for seamless loop */}
              <span>SUPEREA V1 ALPHA IS LIVE</span>
              <Star className="h-4 w-4 fill-[#FFD93D] text-[#FFD93D] shrink-0" />
              <span>PHISHING SCANNING AT 99.4% CONFIDENCE</span>
              <Star className="h-4 w-4 fill-[#FF6B6B] text-[#FF6B6B] shrink-0" />
              <span>MASTRA AI AGENT ENGINE RUNNING</span>
              <Star className="h-4 w-4 fill-[#C4B5FD] text-[#C4B5FD] shrink-0" />
              <span>ZERO-CLICK INBOX TRIAGE ACTIVE</span>
              <Star className="h-4 w-4 fill-[#FF6B6B] text-[#FF6B6B] shrink-0" />
              <span>VIM SHORTCUTS LOADED</span>
              <Star className="h-4 w-4 fill-[#FFD93D] text-[#FFD93D] shrink-0" />
            </div>
          </div>
        </div>

        {/* ─── MAIN ─── */}
        <main className="pt-8">
          {/* ─── HERO ─── */}
          <section className="relative overflow-hidden py-16 md:py-24 bg-grid">
            {/* Floating decorative elements */}
            <div className="absolute top-10 right-10 w-20 h-20 border-4 border-black bg-[#FFD93D] rotate-12 shadow-[8px_8px_0px_0px_#000] hidden lg:block" aria-hidden="true" />
            <div className="absolute bottom-20 left-8 w-16 h-16 border-4 border-black bg-[#C4B5FD] -rotate-6 shadow-[8px_8px_0px_0px_#000] hidden lg:block" aria-hidden="true" />
            <Star className="absolute top-32 left-20 h-10 w-10 fill-[#FF6B6B] text-[#FF6B6B] animate-spin-slow hidden lg:block" aria-hidden="true" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 border-4 border-black bg-[#FFD93D] dark:bg-[#db6802] px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-[4px_4px_0px_0px_#000] rotate-[-1deg]">
                  <Sparkles className="h-5 w-5 stroke-[3px]" />
                  AI-POWERED EXECUTIVE ASSISTANT
                </div>
              </motion.div>

              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
                className="mt-8 text-center"
              >
                <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter leading-[0.85]">
                  <span className="block">Your Inbox,</span>
                  <span className="block mt-1">
                    <span className="text-stroke">Calendar</span>
                    <span className="relative inline-block ml-3 align-middle">
                      {blockState === "idle" && (
                        <button
                          onClick={() => setBlockState("breaking")}
                          className="inline-flex flex-col items-center justify-center align-middle bg-[#FF6B6B] text-black border-4 border-black px-4 pt-2 pb-1.5 shadow-[6px_6px_0px_0px_#000] rotate-1 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 cursor-pointer select-none font-black leading-none"
                        >
                          <span className="leading-none">& AI</span>
                        </button>
                      )}

                      {blockState === "breaking" && (
                        <span className="relative inline-flex align-middle">
                          {/* Hidden spacer block */}
                          <span className="inline-flex flex-col items-center justify-center opacity-0 border-4 border-transparent px-4 pt-2 pb-1.5 select-none font-black leading-none">
                            <span className="leading-none">& AI</span>
                            <span className="mt-1 px-1.5 py-0.5 text-[9px] sm:text-[10px] whitespace-nowrap leading-none">
                              CLICK HERE
                            </span>
                          </span>

                          {/* Left cracked falling piece */}
                          <motion.span
                            initial={{ x: 0, y: 0, rotate: 1, opacity: 1 }}
                            animate={{ x: -120, y: 500, rotate: -65, opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={{ clipPath: "polygon(0% 0%, 55% 0%, 45% 40%, 55% 70%, 45% 100%, 0% 100%)" }}
                            className="absolute inset-0 inline-flex flex-col items-center justify-center bg-[#FF6B6B] text-black border-4 border-black px-4 pt-2 pb-1.5 shadow-[6px_6px_0px_0px_#000] pointer-events-none select-none font-black leading-none"
                          >
                            <span className="leading-none">& AI</span>
                            <span className="mt-1 px-1.5 py-0.5 bg-black text-white text-[9px] sm:text-[10px] font-mono font-black tracking-widest uppercase border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] select-none whitespace-nowrap leading-none">
                              CLICK HERE
                            </span>
                          </motion.span>

                          {/* Right cracked falling piece */}
                          <motion.span
                            initial={{ x: 0, y: 0, rotate: 1, opacity: 1 }}
                            animate={{ x: 120, y: 500, rotate: 65, opacity: 0 }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={{ clipPath: "polygon(55% 0%, 100% 0%, 100% 100%, 45% 100%, 55% 70%, 45% 40%)" }}
                            className="absolute inset-0 inline-flex flex-col items-center justify-center bg-[#FF6B6B] text-black border-4 border-black px-4 pt-2 pb-1.5 shadow-[6px_6px_0px_0px_#000] pointer-events-none select-none font-black leading-none"
                          >
                            <span className="leading-none">& AI</span>
                            <span className="mt-1 px-1.5 py-0.5 bg-black text-white text-[9px] sm:text-[10px] font-mono font-black tracking-widest uppercase border border-black shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] select-none whitespace-nowrap leading-none">
                              CLICK HERE
                            </span>
                          </motion.span>

                          {/* Rising spring & SEA replacement block */}
                          <motion.span
                            initial={{ scale: 0, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: -1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.15 }}
                            onAnimationComplete={() => setBlockState("done")}
                            className="absolute inset-0 flex items-center justify-center bg-[#FFD93D] text-black border-4 border-black px-4 py-1 shadow-[6px_6px_0px_0px_#000] rotate-[-1deg] select-none font-black"
                          >
                            & SEA
                          </motion.span>
                        </span>
                      )}

                      {blockState === "done" && (
                        <button
                          onClick={() => setBlockState("idle")}
                          className="inline-block bg-[#FFD93D] text-black border-4 border-black px-4 py-1 shadow-[6px_6px_0px_0px_#000] rotate-[-1deg] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 cursor-pointer select-none font-black align-middle"
                          title="Click to reset!"
                        >
                          & SEA
                        </button>
                      )}
                    </span>
                    <img src="/bot.svg" className="w-12 h-12 sm:w-20 sm:h-20 lg:w-28 lg:h-28 xl:w-32 xl:h-32 ml-4 sm:ml-6 align-middle inline-block" alt="Bot Logo" />
                  </span>
                  <span className="block mt-1">Unified.</span>
                </h1>
              </motion.div>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.16 }}
                className="mt-8 max-w-2xl mx-auto text-center text-lg md:text-xl font-bold leading-relaxed text-black"
              >
                SuperEA is a proactive AI executive assistant that reads your
                email, checks your calendar, drafts intelligent replies, detects
                phishing threats, and waits for your approval — all in real time.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.24 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/signup"
                  className="w-full sm:w-auto text-center bg-[#FFD93D] text-black border-4 border-black px-8 py-4 text-base font-black uppercase tracking-wider shadow-[6px_6px_0px_0px_#000] btn-push hover:bg-[#ffbe25] transition-colors duration-100"
                >
                  Start Testing Alpha →
                </Link>
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-4 border-black bg-white px-8 py-4 text-base font-bold uppercase tracking-wide shadow-[6px_6px_0px_0px_#000] btn-push hover:bg-[#C4B5FD] transition-colors duration-100 text-black font-black"
                >
                  <PlayCircle className="h-5 w-5 stroke-[3px]" />
                  Watch Demo
                </button>
              </motion.div>

              {/* 3 Hero Cards */}
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.42 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  {
                    icon: MailOpen,
                    title: "Email Triage",
                    desc: "Drafts, threats, and summaries in one place.",
                    color: "bg-[#FF6B6B]",
                    rotate: "-rotate-1",
                  },
                  {
                    icon: Clock,
                    title: "Calendar Awareness",
                    desc: "Availability, timezones, and proactive scheduling.",
                    color: "bg-[#FFD93D]",
                    rotate: "rotate-1",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Approval Loop",
                    desc: "You stay in control before anything sends.",
                    color: "bg-[#C4B5FD]",
                    rotate: "-rotate-1",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000] card-lift ${item.rotate}`}
                  >
                    <div className={`w-12 h-12 ${item.color} border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]`}>
                      <item.icon className="h-6 w-6 stroke-[3px]" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mt-4">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-base font-bold leading-relaxed text-black">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Showcase Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.55 }}
              className="mx-auto mt-16 max-w-7xl px-6"
            >
              <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000] relative">
                {/* Sticker badge */}
                <div className="absolute -top-5 -right-3 bg-[#FF6B6B] border-4 border-black px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] rotate-3 z-10">
                  LIVE DEMO
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y-4 md:divide-y-0 md:divide-x-4 divide-black">
                  {/* Column 1: Mail Incoming */}
                  <div className="p-6 bg-[#FFD93D]/20">
                    <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest">
                        MAIL INCOMING
                      </span>
                      <span className="bg-black text-white text-xs font-bold px-2 py-1">
                        {demoStep === 0 ? "--:--" : "14:24"}
                      </span>
                    </div>
                    {demoStep === 0 ? (
                      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center min-h-[250px] text-center">
                        <span className="relative flex h-3 w-3 mb-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B6B] opacity-75" style={{ borderRadius: "50% !important" }}></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6B6B]" style={{ borderRadius: "50% !important" }}></span>
                        </span>
                        <p className="text-xs font-black uppercase text-black tracking-wider">
                          LISTENING FOR MAIL...
                        </p>
                        <p className="text-[10px] font-bold text-black/50 mt-1 max-w-[180px] leading-relaxed">
                          Ready for incoming messages on Gmail webhooks
                        </p>
                      </div>
                    ) : (
                      <div className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] min-h-[250px] flex flex-col justify-between transition-all duration-300">
                        <div>
                          <div className="flex items-center gap-3 border-b-4 border-black pb-3 mb-3">
                            <div className="h-10 w-10 border-4 border-black bg-[#C4B5FD]" />
                            <div>
                              <p className="text-sm font-black uppercase">Johnathan</p>
                              <p className="text-xs font-bold text-black/60">jonathan@superea.app</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold leading-relaxed text-black">
                            Sandipan are you free this Friday at 10 am for a quick standup about a new feature that is coming on SuperEA?
                          </p>
                        </div>
                        <div className="mt-4 border-4 border-black bg-[#FFFDF5] p-3">
                          <div className="h-2 w-20 bg-black mb-2" />
                          <div className="h-2 w-32 bg-black mb-2" />
                          <div className="h-12 border-4 border-dashed border-black bg-white flex items-center justify-center text-xs font-bold text-black/40 uppercase">
                            DOC_ATTACHMENT.PDF
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Agent Thinking */}
                  <div className="p-6 bg-white">
                    <div className="flex items-center justify-center border-b-4 border-black pb-3 mb-4">
                      <span className="bg-[#FF6B6B] border-4 border-black text-xs font-black uppercase tracking-widest px-3 py-1 shadow-[4px_4px_0px_0px_#000]">
                        AGENT REASONING
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div className="border-4 border-black bg-[#C4B5FD]/20 p-4 shadow-[4px_4px_0px_0px_#000] min-h-[195px] flex flex-col justify-between">
                        <div className="space-y-1 font-mono text-sm font-bold leading-relaxed min-h-[120px]">
                          {getVisibleSteps().map((step, idx) => (
                            <p key={idx} className="text-black">
                              {step}
                            </p>
                          ))}
                          {demoStatus === "drafting" && (
                            <span className="inline-block w-2 h-4 bg-black animate-ping ml-1" />
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t-4 border-black pt-3">
                          <div className="flex gap-[2px] flex-1">
                            {[...Array(18)].map((_, i) => (
                              <span
                                key={i}
                                className="w-1.5 bg-black"
                                style={{
                                  height: `${8 + ((i * 7) % 16)}px`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black">
                            {demoStatus === "approved" ? "00:08.4s" : `00:0${demoStep + 1}.2s`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: AI Draft */}
                  <div className="p-6 bg-[#C4B5FD]/10">
                    <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest">
                        AI DRAFT
                      </span>
                      <span className="bg-[#FFD93D] border-4 border-black text-xs font-black px-2 py-0.5">
                        {demoStatus === "approved" ? "SENT" : demoStatus === "pending" ? "PENDING" : "DRAFTING"}
                      </span>
                    </div>
                    <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between min-h-[195px]">
                      {/* Email Header */}
                      <div className="bg-[#FFFDF5] border-b-4 border-black p-3 text-xs font-bold space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[#FF6B6B] font-black uppercase text-[10px]">DRAFT EMAIL</span>
                          <span className="bg-[#FFD93D] border-2 border-black px-1.5 py-0.5 text-[8px] font-black uppercase">
                            {demoStatus === "approved" ? "DELIVERED" : demoStatus === "pending" ? "PENDING APPROVAL" : "DRAFTING"}
                          </span>
                        </div>
                        <p className="text-black/60"><span className="font-black text-black">TO:</span> jonathan@superea.app</p>
                        <p className="text-black/60"><span className="font-black text-black">SUBJ:</span> Re: Friday Standup</p>
                      </div>
                      
                      {/* Email Body */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        {demoStatus === "drafting" && demoStep < 6 ? (
                          <div className="py-4 text-center">
                            <span className="inline-block px-2 py-1 text-[10px] font-black bg-black text-white uppercase animate-pulse">
                              WAITING FOR AGENT LOGS...
                            </span>
                          </div>
                        ) : demoStatus === "drafting" || demoStatus === "rewriting" ? (
                          <div className="py-4 text-center space-y-2">
                            <span className="inline-block px-2 py-1 text-[10px] font-black bg-[#FFD93D] text-black border-2 border-black uppercase animate-pulse">
                              DRAFTING RESPONSE...
                            </span>
                            <div className="h-1 bg-black/10 w-2/3 mx-auto animate-pulse" />
                          </div>
                        ) : demoStatus === "pending" ? (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-black italic leading-relaxed">
                              {draftVersion === 1 
                                ? `"Hi Johnathan, yes, I'm free this Friday at 10 AM for a quick standup. Looking forward to seeing the new features!"`
                                : `"Hey Johnathan! Friday at 10 AM works great for me. Let's sync on the new SuperEA features then."`}
                            </p>
                            <div className="flex gap-2 pt-2 border-t-2 border-dashed border-black/20">
                              <button 
                                onClick={handleApprove}
                                className="bg-black text-white text-[9px] font-black px-3 py-1 hover:bg-[#FF6B6B] hover:text-white transition-colors duration-100 btn-push"
                              >
                                APPROVE & SEND
                              </button>
                              <button 
                                onClick={handleRewrite}
                                className="border-2 border-black text-black text-[9px] font-black px-3 py-0.5 hover:bg-black/5 transition-colors duration-100 btn-push"
                              >
                                SUGGEST REWRITE
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center space-y-1">
                            <span className="inline-block px-2.5 py-1 text-xs font-black bg-[#86EFAC] text-black border-4 border-black uppercase shadow-[2px_2px_0px_0px_#000]">
                              APPROVED & SENT ✓
                            </span>
                            <p className="text-[10px] font-bold text-black/60 pt-2">Gmail API delivered instantly</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ─── FEATURES ─── */}
          <motion.section
            id="features"
            className="py-20 md:py-28 border-y-4 border-black bg-[#FFFDF5] bg-grid relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center">
                <span className="inline-block bg-[#FFD93D] border-4 border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] -rotate-1 mb-6">
                  FEATURES
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                  Everything Your Executive
                  <br />
                  Assistant Should Do.
                </h2>
                <p className="mt-4 text-lg font-bold text-black">
                  Built for speed, security, and zero-click productivity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        delay: i * 0.08,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_#000] card-lift relative overflow-hidden"
                    >
                      {/* Watermark feature icon in top right corner */}
                      <Icon className="absolute -top-12 -right-12 w-44 h-44 stroke-[1.5px] opacity-[0.07] dark:opacity-[0.08] dark:text-white text-black  pointer-events-none" />
                      
                      <div className="relative z-10">
                        <div className={`w-14 h-14 ${feature.color} border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]`}>
                          <Icon className="w-7 h-7 stroke-[3px]" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mt-5">
                          {feature.title}
                        </h3>
                        <p className="text-base font-bold text-black mt-3 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ─── HOW IT WORKS ─── */}
          <section
            id="how-it-works"
            className="py-20 md:py-28 bg-black text-white border-b-4 border-black relative"
          >
            {/* Grid overlay on dark */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundSize: "40px 40px",
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
              }}
              aria-hidden="true"
            />

            <motion.div
              className="max-w-7xl mx-auto px-6 relative z-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="text-center">
                <span className="inline-block bg-[#FF6B6B] border-4 border-white px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#fff] rotate-1 mb-6 text-black">
                  HOW IT WORKS
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                  FIVE Steps.
                  <br />
                  <span className="text-stroke" style={{ WebkitTextStroke: "2px white", color: "transparent" }}>
                    Zero Effort.
                  </span>
                </h2>
              </div>
            </motion.div>

            {/* Scroll-Triggered Animated Steps Grid — outside motion.div so no transform ancestor */}
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mt-16 relative">
                
                {/* Left Side: Sticky Visualizer */}
                <div className="sticky top-24 lg:top-32 z-30 self-start w-full h-[240px] lg:h-[450px] border-4 border-white bg-white text-black shadow-[8px_8px_0px_0px_#fff] flex flex-col justify-between overflow-hidden">
                  {/* Top window bar */}
                  <div className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase flex justify-between items-center border-b-4 border-black">
                    <span>SuperEA Visualizer — Step {activeScrollStep + 1} of 5</span>
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                  
                  {/* Content Viewport */}
                  <div className="flex-1 min-h-0 bg-[#FFFDF5] dark:bg-[#121214]">
                    {renderStickyVisual()}
                  </div>
                </div>

                {/* Right Side: Scroll Cards */}
                <div className="space-y-16 lg:space-y-40 pb-20 lg:pb-32">
                  {scrollSteps.map((step) => {
                    const isSelected = activeScrollStep === step.num;
                    return (
                      <div
                        key={step.num}
                        data-step-index={step.num}
                        className={`border-4 bg-black text-white p-8 transition-all duration-300 card-lift ${
                          isSelected 
                            ? `border-white shadow-[8px_8px_0px_0px_#fff] opacity-100 scale-[1.02]` 
                            : 'border-white/20 opacity-30 shadow-none'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest text-[#FFD93D] mb-3 block">
                          {step.badge}
                        </span>
                        <h3 className="text-2xl font-black uppercase tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-base font-bold mt-3 text-white/80 leading-relaxed">
                          {step.desc}
                        </p>
                        <ArrowRight className={`mt-4 h-6 w-6 stroke-[3px] transition-transform duration-300 ${
                          isSelected ? 'translate-x-2 text-[#FFD93D]' : 'text-white/20'
                        }`} />
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </section>

          {/* ─── INTEGRATIONS ─── */}
          <motion.section
            id="integrations"
            className="py-20 md:py-28 bg-[#FFD93D] border-b-4 border-black relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center">
                <span className="inline-block bg-white border-4 border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] -rotate-2 mb-6">
                  INTEGRATIONS
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                  Plugs Into What
                  <br />
                  You Already Use.
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-4xl mx-auto">
                {integrations.map((integration, i) => {
                  const Icon = integration.icon;
                  const rotations = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2"];
                  return (
                    <div
                      key={integration.name}
                      className={`border-4 border-black bg-white p-6 flex flex-col items-center gap-3 shadow-[8px_8px_0px_0px_#000] card-lift ${rotations[i]}`}
                    >
                      <div className={`w-14 h-14 ${integration.color} border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_#000]`}>
                        <Icon className="w-7 h-7 stroke-[3px]" />
                      </div>
                      <span className="text-base font-black uppercase tracking-tight text-center">
                        {integration.name}
                      </span>
                      <span className="text-xs font-bold text-black/60 uppercase tracking-wide text-center">
                        {integration.subtitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>

          {/* ─── KEYBOARD SHORTCUTS ─── */}
          <motion.section
            id="shortcuts"
            className="py-20 md:py-28 bg-[#C4B5FD]/30 border-b-4 border-black bg-grid relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center">
                <span className="inline-block bg-[#C4B5FD] border-4 border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] rotate-1 mb-6">
                  SHORTCUTS
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                  Navigate at the
                  <br />
                  Speed of Thought.
                </h2>
                <p className="mt-4 text-lg font-bold text-black">
                  Vim-inspired keyboard shortcuts, built in.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
                {shortcuts.map((shortcut, i) => (
                  <motion.div
                    key={shortcut.action}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                      delay: i * 0.05,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="flex items-center justify-between border-4 border-black bg-white px-4 py-4 shadow-[4px_4px_0px_0px_#000] card-lift"
                  >
                    <div className="flex items-center gap-2">
                      {shortcut.keys.map((key, ki) => (
                        <span
                          key={`${shortcut.action}-${key}`}
                          className="flex items-center gap-1"
                        >
                          <kbd className="px-3 py-1.5 bg-[#FFD93D] text-sm font-black text-black border-4 border-black shadow-[2px_2px_0px_0px_#000] uppercase">
                            {key}
                          </kbd>
                          {ki < shortcut.keys.length - 1 && (
                            <span className="text-xs font-black">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-black uppercase tracking-wide">
                      {shortcut.action}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ─── PRICING ─── */}
          <motion.section
            id="pricing"
            className="py-20 md:py-28 bg-[#FFFDF5] dark:bg-[#121214] border-b-4 border-black relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center mb-16">
                <span className="inline-block bg-[#FFD93D] border-4 border-black px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] rotate-1 mb-6 text-black">
                  PRICING PLANS
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-black dark:text-white">
                  Fair Pricing.
                  <br />
                  <span className="text-stroke" style={{ WebkitTextStroke: "2px #000", color: "transparent" }}>
                    No Hidden Fees.
                  </span>
                </h2>
                <p className="mt-4 text-lg font-bold text-black/70 dark:text-white/70">
                  Select the engine capacity that fits your operation.
                </p>
              </div>

              <div className="relative mt-16 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1: Starter */}
                  <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] flex flex-col justify-between relative card-lift">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#FF6B6B]">Starter</span>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-6xl font-black text-black dark:text-white">$?</span>
                        <span className="text-sm font-bold text-black/50 dark:text-white/50">/ month</span>
                      </div>
                      <p className="text-sm font-bold text-black/70 dark:text-white/70 mt-4">
                        For individuals looking to automate their daily personal email flow.
                      </p>
                      <ul className="mt-8 space-y-3">
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> 1 Connected Inbox
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Basic AI Email Drafting
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> 50 AI Actions / month
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white opacity-40">
                          ✕ Telegram Approval Bot
                        </li>
                      </ul>
                    </div>
                    <Link href="/signup" className="mt-8 block text-center bg-[#FF6B6B] border-4 border-black dark:border-white text-black font-black uppercase py-3 shadow-[4px_4px_0px_0px_#000] hover:shadow-none translate-y-0 active:translate-y-[4px] active:shadow-none transition-all duration-75">
                      Start Starter →
                    </Link>
                  </div>

                  {/* Card 2: Executive */}
                  <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 shadow-[12px_12px_0px_0px_#000] dark:shadow-[12px_12px_0px_0px_#fff] flex flex-col justify-between relative card-lift scale-105 z-10 md:-translate-y-2">
                    <div className="absolute -top-5 left-6 bg-black text-[#FFD93D] border-4 border-[#FFD93D] px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] -rotate-2">
                      ★ RECOMMENDED ★
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#FFD93D] mt-2 block">Executive</span>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-6xl font-black text-black dark:text-white">$?</span>
                        <span className="text-sm font-bold text-black/50 dark:text-white/50">/ month</span>
                      </div>
                      <p className="text-sm font-bold text-black/70 dark:text-white/70 mt-4">
                        For professionals demanding robust context awareness and automation.
                      </p>
                      <ul className="mt-8 space-y-3">
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> 3 Connected Inboxes
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Full Context Generator
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Unlimited AI Drafts
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Telegram Approval Integration
                        </li>
                      </ul>
                    </div>
                    <Link href="/signup" className="mt-8 block text-center bg-[#FFD93D] border-4 border-black dark:border-white text-black font-black uppercase py-3 shadow-[4px_4px_0px_0px_#000] hover:shadow-none translate-y-0 active:translate-y-[4px] active:shadow-none transition-all duration-75">
                      Claim Executive →
                    </Link>
                  </div>

                  {/* Card 3: Custom */}
                  <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] flex flex-col justify-between relative card-lift">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#C4B5FD]">Custom</span>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-6xl font-black text-black dark:text-white">$?</span>
                        <span className="text-sm font-bold text-black/50 dark:text-white/50">/ month</span>
                      </div>
                      <p className="text-sm font-bold text-black/70 dark:text-white/70 mt-4">
                        For teams or scale ops requiring custom models or integrations.
                      </p>
                      <ul className="mt-8 space-y-3">
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Unlimited Inboxes
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Custom System Instructions
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> Dedicated AI Instances
                        </li>
                        <li className="flex items-center gap-2 text-sm font-bold text-black dark:text-white">
                          <Check className="w-5 h-5 text-green-500 stroke-[3px]" /> SLA & Support
                        </li>
                      </ul>
                    </div>
                    <Link href="/signup" className="mt-8 block text-center bg-[#C4B5FD] border-4 border-black dark:border-white text-black font-black uppercase py-3 shadow-[4px_4px_0px_0px_#000] hover:shadow-none translate-y-0 active:translate-y-[4px] active:shadow-none transition-all duration-75">
                      Contact Us →
                    </Link>
                  </div>
                </div>

                {/* Translucent overlay */}
                {pricingLocked && (
                  <div className="absolute inset-0 bg-[#FFFDF5]/70 dark:bg-[#121214]/70 backdrop-blur-[2px] z-40 flex items-center justify-center p-4">
                    {/* SVG warning tape diagonal ribbons */}
                    {!pricingWaitlistShowForm ? (
                      <>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                          <line x1="0" y1="0" x2="100%" y2="100%" stroke="url(#stripes)" strokeWidth="48" />
                          <line x1="100%" y1="0" x2="0" y2="100%" stroke="url(#stripes)" strokeWidth="48" />
                          <defs>
                            <pattern id="stripes" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                              <rect width="20" height="40" fill="#FFD93D" />
                              <rect x="20" width="20" height="40" fill="#000" />
                            </pattern>
                          </defs>
                        </svg>
                        
                        {/* Lock Button */}
                        <button
                          onClick={() => setPricingWaitlistShowForm(true)}
                          className="relative z-50 bg-black text-[#FFD93D] border-4 border-[#FFD93D] p-6 rounded-full shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:scale-110 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer"
                        >
                          <Lock className="w-12 h-12 stroke-[2.5px]" />
                        </button>
                      </>
                    ) : (
                      /* Waitlist Component */
                      <div
                        onClick={() => setShowWaitlistNotice(true)}
                        className="relative z-50 max-w-md w-full bg-white dark:bg-black border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] text-center cursor-pointer select-none"
                      >
                        <h3 className="text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                          Unlock Pricing Plans
                        </h3>
                        <p className="text-sm font-bold text-black/60 dark:text-white/60 mb-6">
                          Join the waitlist to get notified when public subscription plans go live.
                        </p>

                        {showWaitlistNotice ? (
                          <div className="bg-[#FFD93D] border-4 border-black text-black p-4 font-bold uppercase text-xs shadow-[3px_3px_0px_0px_#000] rotate-[-1deg] my-4 leading-normal">
                            Join the waitlist while we build the beta, meanwhile alpha is ready for testing.
                          </div>
                        ) : null}

                        {pricingWaitlistSubmitted ? (
                          <div className="bg-[#86EFAC] border-4 border-black text-black p-4 font-bold uppercase text-xs shadow-[3px_3px_0px_0px_#000] rotate-[1deg] mt-4">
                            Thank you! You have been added to the waitlist.
                          </div>
                        ) : (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!pricingWaitlistEmail.trim()) return;
                              setPricingWaitlistSubmitted(true);
                              setShowWaitlistNotice(true);
                            }}
                            className="flex flex-col gap-3"
                          >
                            <input
                              type="email"
                              required
                              value={pricingWaitlistEmail}
                              onChange={(e) => setPricingWaitlistEmail(e.target.value)}
                              placeholder="YOUR EMAIL ADDRESS"
                              className="bg-white dark:bg-[#121214] text-black dark:text-white border-4 border-black px-4 py-3 font-bold text-sm focus:outline-none uppercase placeholder:text-black/30 dark:placeholder:text-white/30"
                              onClick={(e) => e.stopPropagation()} // let input clicks work normally
                            />
                            <button
                              type="submit"
                              className="bg-[#FF6B6B] text-black border-4 border-black py-3 font-black uppercase tracking-wider hover:bg-[#ff5252] transition-colors shadow-[4px_4px_0px_0px_#000]"
                              onClick={(e) => e.stopPropagation()} // let button clicks work normally
                            >
                              Join Waitlist →
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ─── FINAL CTA ─── */}
          <motion.section
            className="py-20 md:py-28 bg-[#FFFDF5] bg-grid relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Decorative floating shapes */}
            <Star className="absolute top-12 right-16 h-12 w-12 fill-[#FFD93D] text-[#FFD93D] animate-spin-slow hidden lg:block" aria-hidden="true" />
            <div className="absolute bottom-16 left-12 w-14 h-14 border-4 border-black bg-[#FF6B6B] rotate-12 shadow-[8px_8px_0px_0px_#000] hidden lg:block" aria-hidden="true" />

            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center relative z-10">
              <div className="bg-[#FFD93D] border-4 border-black p-10 md:p-16 shadow-[12px_12px_0px_0px_#000] text-center max-w-3xl w-full relative">
                {/* Corner badge */}
                <div className="absolute -top-5 -left-3 bg-[#FF6B6B] border-4 border-black px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_#000] -rotate-6 z-10">
                  ★ FREE ★
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                  Your AI Executive
                  <br />
                  Assistant is Ready.
                </h2>
                <p className="mt-4 text-lg font-bold text-black">
                  Set up in 60 seconds. No credit card required.
                </p>
                <Link
                  href="/signup"
                  className="mt-8 inline-block bg-black text-white text-base font-black uppercase tracking-wider px-10 py-4 border-4 border-black shadow-[8px_8px_0px_0px_#000] btn-push hover:bg-[#FF6B6B] hover:text-black transition-colors duration-100"
                >
                  Get Started Free →
                </Link>
              </div>
            </div>
          </motion.section>
        </main>

        {/* ─── FOOTER ─── */}
        <footer className="border-t-4 border-black py-12 bg-black text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 flex flex-col gap-10">
            {/* Top row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-[#FFD93D] border-4 border-black text-black px-3 py-1 text-sm font-black uppercase shadow-[4px_4px_0px_0px_#fff]">
                  SuperEA
                </span>
                <p className="text-sm font-bold">
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
                <a
                  href="mailto:hello@sandipan.ch"
                  className="text-sm font-bold uppercase tracking-wide text-white border-4 border-transparent hover:border-white hover:bg-[#86EFAC] hover:text-black px-3 py-1.5 transition-all duration-100"
                >
                  Contact
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
    </>
  );
}
