import { UpiId, InsertUpi, Transaction, InsertTransaction } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  getUpiIds(): Promise<UpiId[]>;
  addUpiId(upi: InsertUpi): Promise<UpiId>;
  toggleUpiId(id: number): Promise<UpiId>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransaction(reference: string): Promise<Transaction | undefined>;
}

export class MemStorage implements IStorage {
  private upiIds: Map<number, UpiId>;
  private transactions: Map<string, Transaction>;
  private currentId: number;

  constructor() {
    this.upiIds = new Map();
    this.transactions = new Map();
    this.currentId = 1;
  }

  async getUpiIds(): Promise<UpiId[]> {
    return Array.from(this.upiIds.values());
  }

  async addUpiId(upi: InsertUpi): Promise<UpiId> {
    const id = this.currentId++;
    const upiId: UpiId = { ...upi, id, isActive: true };
    this.upiIds.set(id, upiId);
    return upiId;
  }

  async toggleUpiId(id: number): Promise<UpiId> {
    const upi = this.upiIds.get(id);
    if (!upi) throw new Error("UPI ID not found");
    const updated = { ...upi, isActive: !upi.isActive };
    this.upiIds.set(id, updated);
    return updated;
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const reference = nanoid();
    const transaction: Transaction = {
      ...tx,
      id: this.currentId++,
      reference,
      timestamp: new Date(),
    };
    this.transactions.set(reference, transaction);
    return transaction;
  }

  async getTransaction(reference: string): Promise<Transaction | undefined> {
    return this.transactions.get(reference);
  }
}

export const storage = new MemStorage();
