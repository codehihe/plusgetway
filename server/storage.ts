import { UpiId, InsertUpi, Transaction, InsertTransaction, UpiAuditLog, UserAuditLog, User, InsertUser, UserStatus, upiIds, transactions, upiAuditLogs, userAuditLogs, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull, and, gt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserStatus(id: number, status: string, approvedBy?: number): Promise<User>;
  updateUserLastLogin(id: number): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  createUserAuditLog(audit: {
    userId: number,
    action: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  }): Promise<UserAuditLog>;

  // Session store
  sessionStore: session.Store;

  // Existing UPI methods
  getUpiIds(includeDeleted?: boolean): Promise<UpiId[]>;
  getUpiIdByAddress(upiAddress: string): Promise<UpiId | undefined>;
  addUpiId(upi: InsertUpi): Promise<UpiId>;
  toggleUpiId(id: number): Promise<UpiId>;
  blockUpiId(id: number): Promise<UpiId>;
  unblockUpiId(id: number): Promise<UpiId>;
  deleteUpiId(id: number): Promise<UpiId>;

  // Transaction methods
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(reference: string, status: 'success' | 'failed'): Promise<Transaction>;
  getTransaction(reference: string): Promise<Transaction | undefined>;
  getTransactions(): Promise<Transaction[]>;
  getDailyTransactions(upiId: string): Promise<Transaction[]>;
  logUpiAudit(audit: {
    upiId: number,
    action: string,
    oldValues?: any,
    newValues?: any,
    actionBy?: string,
    ipAddress?: string
  }): Promise<UpiAuditLog>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      createTableIfMissing: true,
      tableName: 'user_sessions'
    });
  }

  // User management methods
  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        status: UserStatus.PENDING,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async updateUserStatus(id: number, status: string, approvedBy?: number): Promise<User> {
    const now = new Date();
    const [user] = await db
      .update(users)
      .set({
        status,
        isApproved: status === UserStatus.APPROVED,
        approvedAt: status === UserStatus.APPROVED ? now : null,
        approvedBy: status === UserStatus.APPROVED ? approvedBy : null,
        updatedAt: now
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.status, UserStatus.PENDING))
      .orderBy(desc(users.createdAt));
  }

  async createUserAuditLog(audit: {
    userId: number,
    action: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  }): Promise<UserAuditLog> {
    const [log] = await db
      .insert(userAuditLogs)
      .values({
        ...audit,
        timestamp: new Date()
      })
      .returning();
    return log;
  }

  async getUpiIds(includeDeleted: boolean = false): Promise<UpiId[]> {
    const query = db.select().from(upiIds)
      .where(includeDeleted ? undefined : isNull(upiIds.deletedAt))
      .orderBy(desc(upiIds.createdAt));
    return await query;
  }

  async getUpiIdByAddress(upiAddress: string): Promise<UpiId | undefined> {
    const [upi] = await db.select()
      .from(upiIds)
      .where(eq(upiIds.upiId, upiAddress));
    return upi;
  }

  async addUpiId(upi: InsertUpi): Promise<UpiId> {
    const now = new Date();
    const [upiId] = await db
      .insert(upiIds)
      .values({
        ...upi,
        isActive: true,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return upiId;
  }

  async toggleUpiId(id: number): Promise<UpiId> {
    const [upi] = await db.select().from(upiIds).where(eq(upiIds.id, id));
    if (!upi) throw new Error("UPI ID not found");

    const [updated] = await db
      .update(upiIds)
      .set({
        isActive: !upi.isActive,
        updatedAt: new Date()
      })
      .where(eq(upiIds.id, id))
      .returning();

    await this.logUpiAudit({
      upiId: id,
      action: updated.isActive ? 'activated' : 'deactivated',
      oldValues: { isActive: upi.isActive },
      newValues: { isActive: updated.isActive }
    });

    return updated;
  }

  async blockUpiId(id: number): Promise<UpiId> {
    const now = new Date();
    const [updated] = await db
      .update(upiIds)
      .set({
        blockedAt: now,
        updatedAt: now
      })
      .where(eq(upiIds.id, id))
      .returning();

    await this.logUpiAudit({
      upiId: id,
      action: 'blocked',
      newValues: { blockedAt: now }
    });

    return updated;
  }

  async unblockUpiId(id: number): Promise<UpiId> {
    const now = new Date();
    const [updated] = await db
      .update(upiIds)
      .set({
        blockedAt: null,
        updatedAt: now
      })
      .where(eq(upiIds.id, id))
      .returning();

    await this.logUpiAudit({
      upiId: id,
      action: 'unblocked',
      oldValues: { blockedAt: updated.blockedAt }
    });

    return updated;
  }

  async deleteUpiId(id: number): Promise<UpiId> {
    const now = new Date();
    const [updated] = await db
      .update(upiIds)
      .set({
        deletedAt: now,
        updatedAt: now
      })
      .where(eq(upiIds.id, id))
      .returning();

    await this.logUpiAudit({
      upiId: id,
      action: 'deleted',
      newValues: { deletedAt: now }
    });

    return updated;
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    try {
      const [transaction] = await db
        .insert(transactions)
        .values({
          amount: tx.amount.toString(),
          upiId: tx.upiId,
          merchantName: tx.merchantName,
          reference: tx.reference,
          status: "pending",
          customerName: tx.customerName,
          customerPhone: tx.customerPhone,
          customerEmail: tx.customerEmail,
          description: tx.description,
          paymentApp: tx.paymentApp,
          paymentMethod: tx.paymentMethod || "upi",
          deviceInfo: tx.deviceInfo,
          ipAddress: tx.ipAddress,
          timestamp: new Date()
        })
        .returning();
      return transaction;
    } catch (error) {
      console.error("Transaction creation error:", error);
      throw error;
    }
  }

  async updateTransactionStatus(reference: string, status: 'success' | 'failed'): Promise<Transaction> {
    const now = new Date();
    const [updated] = await db
      .update(transactions)
      .set({
        status,
        ...(status === 'success' ? { completedAt: now } : { failedAt: now })
      })
      .where(eq(transactions.reference, reference))
      .returning();

    if (!updated) {
      throw new Error(`Transaction ${reference} not found`);
    }

    return updated;
  }

  async getTransaction(reference: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, reference))
      .where(isNull(transactions.deletedAt));
    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp))
      .where(isNull(transactions.deletedAt));
  }

  async getDailyTransactions(upiId: string): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.upiId, upiId),
          gt(transactions.timestamp, today),
          lte(transactions.timestamp, tomorrow)
        )
      )
      .orderBy(desc(transactions.timestamp));
  }

  async logUpiAudit(audit: {
    upiId: number,
    action: string,
    oldValues?: any,
    newValues?: any,
    actionBy?: string,
    ipAddress?: string
  }): Promise<UpiAuditLog> {
    const [log] = await db
      .insert(upiAuditLogs)
      .values({
        ...audit,
        oldValues: audit.oldValues ? JSON.stringify(audit.oldValues) : null,
        newValues: audit.newValues ? JSON.stringify(audit.newValues) : null,
        timestamp: new Date()
      })
      .returning();
    return log;
  }
}

export const storage = new DatabaseStorage();