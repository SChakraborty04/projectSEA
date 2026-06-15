import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";

// db/schema/agent.ts
export const agentProfiles = pgTable("agent_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id),
  userMobile: text("user_mobile"),
  vapiAssistantId: text("vapi_assistant_id"), // <-- Add this!
  agentName: text("agent_name").default("Assistant"),
  agentVoice: text("agent_voice").default("openai-alloy"),
  
  // Business Context
  companyName: text("company_name"),
  designation: text("designation"), // Title/Designation of the user (e.g. CEO, Founder, Senior Engineer)
  businessDescription: text("business_description"),
  
  // Scheduling Rules
  timezone: text("timezone").default("Asia/Kolkata"),
  workingHoursStart: text("working_hours_start").default("10:00"),
  workingHoursEnd: text("working_hours_end").default("18:00"),
  workingDays: jsonb("working_days").default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  bufferMinutes: integer("buffer_minutes").default(15),
  minNoticeHours: integer("min_notice_hours").default(2),
  
  // Custom Persona Instructions
  customInstructions: text("custom_instructions"),
  firstMessage: text("first_message").default("Hello, how can I help you today?"),
});
