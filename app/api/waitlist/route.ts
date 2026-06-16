import { db } from "@/db";
import { waitlist } from "@/db/schema/waitlist";
import crypto from "crypto";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = waitlistSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error.issues[0].message }),
        { status: 400 }
      );
    }

    const { email } = result.data;

    await db
      .insert(waitlist)
      .values({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
      })
      .onConflictDoNothing();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("Waitlist API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
