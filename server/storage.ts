import { UpiId, InsertUpi, Transaction, InsertTransaction, upiIds, transactions } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUpiIds(): Promise<UpiId[]>;
  addUpiId(upi: InsertUpi): Promise<UpiId>;
  toggleUpiId(id: number): Promise<UpiId>;
  blockUpiId(id: number): Promise<UpiId>;
  unblockUpiId(id: number): Promise<UpiId>;
  deleteUpiId(id: number): Promise<void>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransaction(reference: string): Promise<Transaction | undefined>;
  getTransactions(): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUpiIds(): Promise<UpiId[]> {
    return await db.select().from(upiIds);
  }

  async addUpiId(upi: InsertUpi): Promise<UpiId> {
    const [upiId] = await db
      .insert(upiIds)
      .values({ ...upi, isActive: true })
      .returning();
    return upiId;
  }

  async toggleUpiId(id: number): Promise<UpiId> {
    const [upi] = await db.select().from(upiIds).where(eq(upiIds.id, id));
    if (!upi) throw new Error("UPI ID not found");

    const [updated] = await db
      .update(upiIds)
      .set({ isActive: !upi.isActive })
      .where(eq(upiIds.id, id))
      .returning();
    return updated;
  }

  async blockUpiId(id: number): Promise<UpiId> {
    const [updated] = await db
      .update(upiIds)
      .set({ blockedAt: new Date() })
      .where(eq(upiIds.id, id))
      .returning();
    return updated;
  }

  async unblockUpiId(id: number): Promise<UpiId> {
    const [updated] = await db
      .update(upiIds)
      .set({ blockedAt: null })
      .where(eq(upiIds.id, id))
      .returning();
    return updated;
  }

  async deleteUpiId(id: number): Promise<void> {
    await db.delete(upiIds).where(eq(upiIds.id, id));
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...tx,
        status: tx.status || "pending",
        reference: tx.reference,
        timestamp: new Date(),
      })
      .returning();
    return transaction;
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
}

export const storage = new DatabaseStorage();