"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function signup({ name, email, password }: { name: string; email: string; password: string }) {
  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: await headers(),
    })
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Sign up failed" }
  }
}