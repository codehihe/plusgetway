import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const upiIds = pgTable("upi_ids", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull().unique(),
  merchantName: text("merchant_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  blockedAt: timestamp("blocked_at"),
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

// Enhanced validation for UPI ID format
const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

export const insertUpiSchema = createInsertSchema(upiIds)
  .omit({ id: true, isActive: true, blockedAt: true })
  .extend({
    upiId: z.string()
      .min(5, "UPI ID must be at least 5 characters")
      .max(50, "UPI ID cannot exceed 50 characters")
      .regex(upiIdRegex, "Invalid UPI ID format. Example: username@upi"),
    merchantName: z.string()
      .min(2, "Merchant name must be at least 2 characters")
      .max(100, "Merchant name cannot exceed 100 characters"),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, timestamp: true, reference: true })
  .extend({
    amount: z.string().transform((val) => parseInt(val, 10)),
  });

export type UpiId = typeof upiIds.$inferSelect;
export type InsertUpi = z.infer<typeof insertUpiSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const ADMIN_PIN = "123456";