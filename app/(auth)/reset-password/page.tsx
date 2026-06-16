"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Must be a minimum of 8 characters.' }),
  confirmPassword: z
    .string()
    .min(8, { message: 'Must be a minimum of 8 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Your passwords don't match",
  path: ['confirmPassword'],
})

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new link.")
      return
    }

    try {
      setLoading(true)
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token: token,
      })

      if (error) {
        toast.error(error.message || "Failed to reset password.")
      } else {
        toast.success("Password reset successfully! Please sign in with your new password.")
        router.push("/signin")
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] overflow-hidden max-w-md w-full mx-auto">
      <CardHeader className="text-center border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] py-5">
        <CardTitle className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Reset Password</CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="space-y-4">
            <Field className="space-y-3">
              <div className="grid grid-cols-1 gap-4">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                      <FieldLabel htmlFor="password" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">New Password</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pr-10 border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 normal-case placeholder:uppercase text-xs tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                      <FieldLabel htmlFor="confirm-password" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Confirm New Password</FieldLabel>
                      <div className="relative">
                        <Input
                          {...field}
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="pr-10 border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 normal-case placeholder:uppercase text-xs tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </Field>
            <Button type="submit" disabled={loading} className="w-full bg-[#FFD93D] dark:bg-[#db6802] text-black border-4 border-black dark:border-white py-4 text-sm font-black uppercase tracking-wider hover:bg-[#ffbe25] hover:text-black rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] transition-colors">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#FFFDF5] dark:bg-[#121214]">
      <Suspense fallback={<div className="text-sm font-bold uppercase text-black/60 dark:text-white/60">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
