import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}