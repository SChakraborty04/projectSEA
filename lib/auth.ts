import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "@/lib/mail";
import { getVerificationEmailHtml, getResetPasswordEmailHtml } from "@/lib/mail-templates";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
    emailAndPassword: { 
        enabled: true, 
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }) => {
            await sendEmail({
                to: user.email,
                subject: "Reset your SuperEA password",
                html: getResetPasswordEmailHtml(url, user.name)
            });
        }
    }, 
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            console.log(`[Auth Email Verification] Triggered for user: ${user.email}, url: ${url}`);
            try {
                const result = await sendEmail({
                    to: user.email,
                    subject: "Verify your SuperEA email address",
                    html: getVerificationEmailHtml(url, user.name)
                });
                console.log(`[Auth Email Verification] sendEmail result:`, JSON.stringify(result));
            } catch (err) {
                console.error(`[Auth Email Verification] sendEmail threw:`, err);
            }
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    trustedOrigins: [
        "https://superea.app",
        "https://www.superea.app",
        "http://localhost:3000"
    ],
    user: {
        deleteUser: {
            enabled: true,
        }
    },
    advanced: {
        ipAddress: {
            ipAddressHeaders: [
                "x-vercel-forwarded-for",
                "x-forwarded-for",
                "x-real-ip"
            ]
        }
    },
    plugins: [nextCookies()]
});