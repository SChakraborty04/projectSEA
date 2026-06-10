import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-bold">Superea</h1>
      <p className="mt-4 text-lg">Welcome to Superea, the ultimate AI agent platform.</p>
      <Button className="mt-6">
        <Link href={"/signup"}>Get Started</Link>
      </Button>
      <Button variant="outline" className="mt-6 ml-2">
        <Link href={"/signin"}>Log In</Link>
      </Button>
    </>
  )
}
