import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { ADMIN_PIN, insertUpiSchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  app.post("/api/admin/login", (req, res) => {
    const { pin } = req.body;
    if (pin === ADMIN_PIN) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid PIN" });
    }
  });

  app.get("/api/upi", async (req, res) => {
    const upiIds = await storage.getUpiIds();
    res.json(upiIds);
  });

  app.post("/api/upi", async (req, res) => {
    const result = insertUpiSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid UPI details" });
      return;
    }

    const upiId = await storage.addUpiId(result.data);
    res.json(upiId);
  });

  app.post("/api/upi/:id/toggle", async (req, res) => {
    const id = parseInt(req.params.id);
    const upiId = await storage.toggleUpiId(id);
    res.json(upiId);
  });

  app.post("/api/transactions", async (req, res) => {
    const result = insertTransactionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid transaction details" });
      return;
    }

    const transaction = await storage.createTransaction(result.data);
    res.json(transaction);
  });

  app.get("/api/transactions/:reference", async (req, res) => {
    const transaction = await storage.getTransaction(req.params.reference);
    if (!transaction) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }
    res.json(transaction);
  });

  return createServer(app);
}
