import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const userDailyContexts = pgTable("user_daily_contexts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // format: YYYY-MM-DD
  context: text("context").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_daily_contexts_user_date_uidx").on(table.userId, table.date)
]);

export const processedProactiveEmails = pgTable("processed_proactive_emails", {
  entityId: text("entity_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
