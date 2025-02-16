import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const upiIds = pgTable("upi_ids", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull().unique(),
  merchantName: text("merchant_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: integer("amount").notNull(),
  upiId: text("upi_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  reference: text("reference").notNull(),
  status: text("status").notNull().default("pending"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUpiSchema = createInsertSchema(upiIds).omit({ id: true, isActive: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, timestamp: true });

export type UpiId = typeof upiIds.$inferSelect;
export type InsertUpi = z.infer<typeof insertUpiSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const ADMIN_PIN = "123456";
