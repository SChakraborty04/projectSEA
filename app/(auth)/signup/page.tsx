import { SignupForm } from "@/components/signup-form"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FFFDF5] dark:bg-[#121214] text-black dark:text-white p-6 md:p-10 relative">
      {/* Halftone texture overlay */}
      <div className="bg-halftone" aria-hidden="true" />

      <div className="flex w-full max-w-lg flex-col gap-6 relative z-10">
        <Link href="/" className="flex items-center gap-2 self-center">
          <span className="bg-[#FFD93D] dark:bg-[#db6802] border-4 border-black px-3 py-1 text-base font-black uppercase tracking-tight shadow-[4px_4px_0px_0px_#000]">
            SuperEA
          </span>
          <span className="text-[10px] font-black bg-black text-[#FFD93D] border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
            v1 α
          </span>
        </Link>
        <SignupForm />
      </div>
    </div>
  )
}
