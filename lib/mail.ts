import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

const token = process.env.MAILTRAP_TOKEN || "";

export const transporter = nodemailer.createTransport(
  MailtrapTransport({
    token: token || "dummy-token",
  }) as any
);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  const sender = {
    address: "no_reply@superea.app",
    name: "SuperEA Auth",
  };

  try {
    if (!token) {
      console.log(`\n================= MOCK EMAIL SENT =================`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text:    ${text || "(none)"}`);
      console.log(`HTML:    ${html || "(none)"}`);
      console.log(`====================================================\n`);
      return { success: true, mock: true };
    }

    const recipients = Array.isArray(to) ? to : [to];
    const info = await transporter.sendMail({
      from: sender,
      to: recipients,
      subject: subject,
      text: text,
      html: html,
      category: "Authentication",
    } as any);
    
    console.log("Email sent successfully via Mailtrap:", info);
    return { success: true, info };
  } catch (error) {
    console.error("Failed to send email via Mailtrap:", error);
    return { success: false, error };
  }
}
