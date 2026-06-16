import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!url) {
    return "https://superea.app";
  }
  return url.replace(/\/+$/, "");
}
