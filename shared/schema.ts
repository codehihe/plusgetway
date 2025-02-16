import { pgTable, text, serial, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// UPI IDs table
export const upiIds = pgTable("upi_ids", {
  id: serial("id").primaryKey(),
  upiId: text("upi_id").notNull().unique(),
  merchantName: text("merchant_name").notNull(),
  storeName: text("store_name").notNull(),
  merchantCategory: text("merchant_category").default('general').notNull(),
  businessType: text("business_type").default('retail').notNull(),
  dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("50000.00").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  blockedAt: timestamp("blocked_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  upiId: text("upi_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  reference: text("reference").notNull().unique(),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  description: text("description"),
  paymentApp: text("payment_app"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  retryCount: integer("retry_count").default(0),
});

// Enhanced validation for UPI ID format
const upiIdRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z][a-zA-Z0-9]+$/;

export const insertUpiSchema = createInsertSchema(upiIds)
  .omit({ 
    id: true, 
    isActive: true, 
    blockedAt: true, 
    deletedAt: true, 
    createdAt: true, 
    updatedAt: true 
  })
  .extend({
    upiId: z.string()
      .min(5, "UPI ID must be at least 5 characters")
      .max(50, "UPI ID cannot exceed 50 characters")
      .regex(upiIdRegex, "Invalid UPI ID format. Example: name@upi or username.ref@bank"),
    merchantName: z.string()
      .min(2, "Merchant name must be at least 2 characters")
      .max(100, "Merchant name cannot exceed 100 characters"),
    storeName: z.string()
      .min(2, "Store name must be at least 2 characters")
      .max(100, "Store name cannot exceed 100 characters"),
    merchantCategory: z.enum(['general', 'food', 'retail', 'services', 'education', 'healthcare'])
      .optional(),
    businessType: z.enum(['retail', 'online', 'wholesale', 'service'])
      .optional(),
    dailyLimit: z.number()
      .min(0, "Daily limit cannot be negative")
      .max(1000000, "Daily limit cannot exceed 10,00,000")
      .optional(),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ 
    id: true,
    timestamp: true, 
    completedAt: true, 
    failedAt: true, 
    retryCount: true 
  })
  .extend({
    amount: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number with up to 2 decimal places")
      .transform((val) => parseFloat(val))
      .refine((val) => val > 0, "Amount must be greater than 0")
      .refine((val) => val <= 100000, "Amount cannot exceed ₹1,00,000"),
    reference: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string()
      .regex(/^[0-9]{10}$/, "Invalid phone number")
      .optional(),
    customerEmail: z.string()
      .email("Invalid email address")
      .optional(),
    description: z.string()
      .max(200, "Description cannot exceed 200 characters")
      .optional(),
    paymentApp: z.enum(['gpay', 'phonepe', 'paytm', 'bhim', 'other'])
      .optional(),
  });

export type UpiId = typeof upiIds.$inferSelect;
export type InsertUpi = z.infer<typeof insertUpiSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const ADMIN_PIN = "Khushi";

// Audit trail for UPI ID changes
export const upiAuditLogs = pgTable("upi_audit_logs", {
  id: serial("id").primaryKey(),
  upiId: integer("upi_id").notNull(),
  action: text("action").notNull(),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  actionBy: text("action_by"),
  ipAddress: text("ip_address"),
});

export type UpiAuditLog = typeof upiAuditLogs.$inferSelect;