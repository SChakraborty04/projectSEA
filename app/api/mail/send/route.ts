import { getSession } from "@/lib/session";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { to, subject, text, html } = body;

    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and text/html" }),
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, text, html });
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: any) {
    console.error("Mail API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
