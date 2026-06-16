import { Geist, Geist_Mono, Noto_Sans, Nunito_Sans } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "SuperEA — Autonomous AI Executive Assistant",
  description: "Your Inbox, Calendar, and Tasks managed by an autonomous AI copilot. Built for speed, security, and zero-click productivity.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest"
}

const nunitoSansHeading = Nunito_Sans({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", notoSans.variable, nunitoSansHeading.variable)}
    >
      <head>
        <meta name="google-site-verification" content="fidbxHSJKJdRPgb5ex6pFkOpwwRDfFYgUz6Kpcq5VqA" />
      </head>
      <body>
        
        <ThemeProvider>
          <TooltipProvider>
          {children}
          <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
