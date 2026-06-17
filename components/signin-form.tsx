"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { cn } from "@/lib/utils"
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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signin } from "@/actions/signin"
import { authClient } from "@/lib/auth-client"

const formSchema = z.object({
  email: z.email("Invalid Email address"),
  password: z.string().min(1, { message: "Password is required" }),
})

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [view, setView] = useState<'signin' | 'forgot-password'>('signin')
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show success toast when user arrives from email verification link
  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Email verified successfully! You can now sign in.", { duration: 6000 })
      // Clean the URL so refreshing doesn't re-trigger the toast
      router.replace("/signin", { scroll: false })
    }
  }, [searchParams, router])
  
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      router.push("/dashboard")
      return
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router])

  const handleRedirect = useCallback(() => {
    toast.success("Signed in successfully!")
    setCountdown(3)
  }, [])

  const resendVerificationEmail = async (email: string) => {
    try {
      const res = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      })
      if (res.error) {
        toast.error(res.error.message || "Failed to resend verification email")
      } else {
        toast.success("Verification email sent! Check your inbox.")
      }
    } catch {
      toast.error("Failed to resend. Please try again.")
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const result = await signin(data)
      if (result.success) {
        handleRedirect()
      } else {
        const isUnverified =
          result.error?.toLowerCase().includes("not verified") ||
          result.error?.toLowerCase().includes("email not verified") ||
          result.error?.toLowerCase().includes("verify your email")

        if (isUnverified) {
          toast.error(
            "Email not verified. Please check your inbox or resend the link.",
            {
              duration: 10000,
              action: {
                label: "Resend verification email",
                onClick: () => resendVerificationEmail(data.email),
              },
            }
          )
        } else {
          toast.error(result.error)
        }
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (view === 'forgot-password') {
    return (
      <div className={cn("flex flex-col gap-4", className)} {...props}>
        <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] overflow-hidden">
          <CardHeader className="text-center border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] py-5">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Reset Password</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
              Enter your email to receive a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!forgotEmail) {
                toast.error("Please enter your email");
                return;
              }
              try {
                setForgotLoading(true);
                const result = await authClient.requestPasswordReset({
                  email: forgotEmail,
                  redirectTo: "/reset-password",
                });
                if (result.error) {
                  toast.error(result.error.message || "Failed to send reset link");
                } else {
                  toast.success("Password reset email sent! Check your inbox.");
                  setView('signin');
                }
              } catch {
                toast.error("An error occurred. Please try again.");
              } finally {
                setForgotLoading(false);
              }
            }}>
              <FieldGroup className="space-y-4">
                <Field className="space-y-0.5">
                  <FieldLabel htmlFor="forgot-email" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Email Address</FieldLabel>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="YOUR EMAIL"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 normal-case placeholder:uppercase text-xs tracking-wider"
                  />
                </Field>
                <Field className="space-y-3 pt-2">
                  <Button type="submit" disabled={forgotLoading} className="w-full bg-[#FFD93D] dark:bg-[#db6802] text-black border-4 border-black dark:border-white py-4 text-sm font-black uppercase tracking-wider hover:bg-[#ffbe25] hover:text-black rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] transition-colors flex items-center justify-center">
                    {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setView('signin')}
                    className="w-full border-4 border-black dark:border-white rounded-none font-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:bg-[#FFFDF5] dark:hover:bg-[#121214] uppercase text-xs py-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-75 text-black dark:text-white cursor-pointer"
                  >
                    Back to Sign In
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card className="border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] overflow-hidden">
        <CardHeader className="text-center border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] py-5">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Welcome back</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
            Signin with Google account
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="space-y-4">
              <Field>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  disabled={loading || countdown !== null}
                  className="w-full border-4 border-black dark:border-white rounded-none font-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:bg-[#FFFDF5] dark:hover:bg-[#121214] uppercase text-xs flex gap-2 justify-center py-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-75 text-black dark:text-white cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {loading ? "Signing in..." : "Sign in with Google"}
                </Button>
              </Field>
              
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t-2 border-black dark:border-white"></div>
                <span className="flex-shrink mx-3 text-[10px] font-black uppercase text-black/50 dark:text-white/50">Or continue with</span>
                <div className="flex-grow border-t-2 border-black dark:border-white"></div>
              </div>

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
                      className="border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 normal-case placeholder:uppercase text-xs tracking-wider"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="space-y-0.5">
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Password</FieldLabel>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setView('forgot-password');
                        }}
                        className="ml-auto text-[9px] font-black uppercase text-black/60 dark:text-white/60 hover:text-[#FF6B6B] dark:hover:text-[#FFD93D] transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        aria-invalid={fieldState.invalid}
                        className="pr-10 border-4 border-black dark:border-white focus-visible:ring-0 focus-visible:bg-[#FFD93D] dark:focus-visible:bg-[#db6802] focus-visible:text-black rounded-none px-3 py-3 font-bold text-black dark:text-white bg-white dark:bg-[#121214] focus:outline-none placeholder:text-black/30 dark:placeholder:text-white/30 normal-case placeholder:uppercase text-xs tracking-wider"
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
              <Field className="space-y-3 pt-1">
                <Button type="submit" disabled={loading || countdown !== null} className="w-full bg-[#FFD93D] dark:bg-[#db6802] text-black border-4 border-black dark:border-white py-4 text-sm font-black uppercase tracking-wider hover:bg-[#ffbe25] hover:text-black rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] btn-push transition-colors duration-100 flex items-center justify-center">
                  {countdown !== null
                    ? `Redirecting in ${countdown}...`
                    : loading
                      ? "Logging in..."
                      : "Signin"}
                </Button>
                <div className="text-center text-xs font-bold text-black/60 dark:text-white/60">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="font-black uppercase text-black dark:text-white hover:text-[#FF6B6B] dark:hover:text-[#FFD93D] transition-colors underline">
                    Sign Up
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
