import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-none border-4 border-black dark:border-white bg-white dark:bg-[#121214] px-3 py-2 text-xs font-bold transition-all outline-none placeholder:text-black/30 dark:placeholder:text-white/30 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black focus-visible:border-black dark:focus-visible:border-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export { Input }
