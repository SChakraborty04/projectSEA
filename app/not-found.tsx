import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FFFDF5] dark:bg-[#121214] text-black dark:text-white p-6 select-none font-mono">
      <div className="max-w-md w-full border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] p-8 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] text-center space-y-6">

        {/* Warning Stripes Accent */}
        <div className="h-6 bg-[repeating-linear-gradient(-45deg,#FFD93D,#FFD93D_10px,#000_10px,#000_20px)] border-b-4 border-black dark:border-white -mx-8 -mt-8" />

        <div className="flex justify-center pt-4">
          <div className="relative flex h-20 w-20 items-center justify-center border-4 border-black dark:border-white bg-[#FF6B6B] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none">
            <FileQuestion className="h-10 w-10 text-black" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter uppercase text-black dark:text-white">404</h1>
          <h2 className="text-sm font-black tracking-widest uppercase text-black/60 dark:text-white/60">
            Page Not Found
          </h2>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider leading-relaxed text-black/60 dark:text-white/60 border-t-2 border-dashed border-black/20 dark:border-white/20 pt-4">
          The requested document could not be retrieved. It may have been relocated, deleted, or never existed in this index.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 h-10 bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 rounded-none cursor-pointer">
              <Home className="h-4 w-4" />
              Homepage
            </button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 h-10 bg-[#C4B5FD] hover:bg-[#b19ffa] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 rounded-none cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
