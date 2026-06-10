"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function signin({ email, password }: { email: string; password: string }) {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
    })
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Sign in failed" }
  }
}