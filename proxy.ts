import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/session";

export async function proxy(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    // For API routes, return 401 JSON
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For page routes, redirect to signin
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    // Add more protected routes here
  ],
};