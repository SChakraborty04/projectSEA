"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { useState, useEffect, useCallback } from "react"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signup } from "@/actions/signup"

const formSchema = z.object({
  name: z
  .string()
  .min(1, { message: 'Name is Required' }),
  email: z
  .email("Invalid Email address"),
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  const handleRedirect = useCallback(() => {
    toast.success("Signed up successfully!");
    setCountdown(3);
  }, []);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const result = await signup(data);
      if (result.success) {
        handleRedirect();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] overflow-hidden">
        <CardHeader className="text-center border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] py-5">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Create your account</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                    <FieldLabel htmlFor="name" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Full Name</FieldLabel>
                    <Input
                      {...field}
                      id="name"
                      type="text"
                      placeholder="JOHN DOE"
                      aria-invalid={fieldState.invalid}
                      className="border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 uppercase text-xs tracking-wider"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                    <FieldLabel htmlFor="email" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="YOUR EMAIL"
                      aria-invalid={fieldState.invalid}
                      className="border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 uppercase text-xs tracking-wider"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                        <FieldLabel htmlFor="password" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Password</FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            aria-invalid={fieldState.invalid}
                            className="pr-10 border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 uppercase text-xs tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                        <FieldLabel htmlFor="confirm-password" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">
                          Confirm Password
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            aria-invalid={fieldState.invalid}
                            className="pr-10 border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 uppercase text-xs tracking-wider"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                            tabIndex={-1}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <div className="text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-wide">
                  Must be at least 8 characters long.
                </div>
              </Field>
              <Field className="space-y-3 pt-1">
                <Button type="submit" disabled={loading || countdown !== null} className="w-full bg-[#FFD93D] dark:bg-[#db6802] text-black border-4 border-black dark:border-white py-4 text-sm font-black uppercase tracking-wider hover:bg-[#ffbe25] hover:text-black rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] btn-push transition-colors duration-100 flex items-center justify-center">
                  {countdown !== null
                    ? `Redirecting in ${countdown}...`
                    : loading
                      ? "Creating Account..."
                      : "Create Account"}
                </Button>
                <div className="text-center text-xs font-bold text-black/60 dark:text-white/60">
                  Already have an account?{" "}
                  <Link href="/signin" className="font-black uppercase text-black dark:text-white hover:text-[#FF6B6B] dark:hover:text-[#FFD93D] transition-colors underline">
                    Sign in
                  </Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="px-6 text-center text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-wide">
        By clicking continue, you agree to our <Link href="/terms" className="underline hover:text-[#FFD93D] dark:hover:text-[#FF6B6B]">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-[#FFD93D] dark:hover:text-[#FF6B6B]">Privacy Policy</Link>.
      </div>
    </div>
  )
}