import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-none border-4 border-black dark:border-white bg-white dark:bg-[#121214] px-3 py-2 text-xs font-bold transition-all outline-none placeholder:text-black/30 dark:placeholder:text-white/30 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black focus-visible:border-black dark:focus-visible:border-white disabled:cursor-not-allowed disabled:opacity-50 uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
