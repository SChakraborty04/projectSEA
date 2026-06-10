"use server"
import {auth} from "@/lib/auth"
import { headers } from "next/dist/server/request/headers"
import { redirect } from "next/navigation"

export async function logout(){
    await auth.api.signOut({
        headers: await headers(),
    })
    redirect("/signin")
}