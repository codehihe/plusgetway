import { pgTable, text, serial, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").default("user").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: integer("approved_by"),
  status: text("status").default("pending").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Updated Transactions table without user dependency
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  amount: text("amount").notNull(),
  upiId: text("upi_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  reference: text("reference").notNull().unique(),
  status: text("status").default("pending").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  description: text("description"),
  paymentApp: text("payment_app"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  retryCount: integer("retry_count").default(0),
  paymentMethod: text("payment_method").default("upi"),
  deviceInfo: text("device_info"),
  ipAddress: text("ip_address"),
  geolocation: text("geolocation"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
});

// Enhanced validation for UPI ID format
const upiIdRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z][a-zA-Z0-9]+$/;

// User registration schema
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    isApproved: true,
    approvedAt: true,
    approvedBy: true,
    status: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username cannot exceed 50 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    email: z.string()
      .email("Invalid email address"),
    fullName: z.string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    phone: z.string()
      .regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  });

// Keep existing schemas but update transaction schema
export const insertUpiSchema = createInsertSchema(upiIds)
  .omit({ id: true, isActive: true, blockedAt: true, deletedAt: true, createdAt: true, updatedAt: true })
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

// Updated transaction schema with user validation
export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({
    id: true,
    timestamp: true,
    completedAt: true,
    failedAt: true,
    retryCount: true,
    verifiedBy: true,
    verifiedAt: true
  })
  .extend({
    amount: z.string()
      .min(1, "Amount is required")
      .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number with up to 2 decimal places")
      .transform((val) => parseFloat(val))
      .refine((val) => val > 0, "Amount must be greater than 0")
      .refine((val) => val <= 100000, "Amount cannot exceed ₹1,00,000"),
    reference: z.string()
      .min(10, "Invalid reference number")
      .max(50, "Reference number too long"),
    customerName: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long")
      .optional(),
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
    paymentMethod: z.enum(['upi', 'wallet', 'netbanking'])
      .default('upi'),
    deviceInfo: z.string()
      .optional(),
    ipAddress: z.string()
      .ip({ version: "v4", message: "Invalid IP address" })
      .optional(),
    geolocation: z.string()
      .optional(),
  });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpiId = typeof upiIds.$inferSelect;
export type InsertUpi = z.infer<typeof insertUpiSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Status enums
export const UserStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  BLOCKED: "blocked"
} as const;

export const TransactionStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  BLOCKED: "blocked",
  EXPIRED: "expired",
  REFUNDED: "refunded"
} as const;

// Security check types
export const SecurityCheckTypes = {
  AMOUNT_LIMIT: "amount_limit",
  DAILY_LIMIT: "daily_limit",
  RISK_ASSESSMENT: "risk_assessment",
  LOCATION_VERIFICATION: "location_verification",
  DEVICE_VERIFICATION: "device_verification",
  FRAUD_CHECK: "fraud_check"
} as const;

// Audit trail for user actions
export const userAuditLogs = pgTable("user_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

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

// Export audit log types
export type UserAuditLog = typeof userAuditLogs.$inferSelect;
export type UpiAuditLog = typeof upiAuditLogs.$inferSelect;

// Admin PIN remains unchanged
export const ADMIN_PIN = "Khushi";