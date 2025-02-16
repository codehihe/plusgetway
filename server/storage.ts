import { UpiId, InsertUpi, Transaction, InsertTransaction, UpiAuditLog, upiIds, transactions, upiAuditLogs } from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull, and, gt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  getUpiIds(includeDeleted?: boolean): Promise<UpiId[]>;
  getUpiIdByAddress(upiAddress: string): Promise<UpiId | undefined>;
  addUpiId(upi: InsertUpi): Promise<UpiId>;
  toggleUpiId(id: number): Promise<UpiId>;
  blockUpiId(id: number): Promise<UpiId>;
  unblockUpiId(id: number): Promise<UpiId>;
  deleteUpiId(id: number): Promise<UpiId>;
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
    const [transaction] = await db
      .insert(transactions)
      .values({
        amount: tx.amount.toString(),
        upiId: tx.upiId,
        merchantName: tx.merchantName,
        reference: tx.reference || uuidv4(),
        status: tx.status || "pending",
        customerName: tx.customerName,
        customerPhone: tx.customerPhone,
        customerEmail: tx.customerEmail,
        description: tx.description,
        paymentApp: tx.paymentApp,
        timestamp: new Date()
      })
      .returning();
    return transaction;
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
      .where(eq(transactions.reference, reference));
    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.timestamp));
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