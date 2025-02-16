import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { ADMIN_PIN, insertUpiSchema, insertTransactionSchema } from "@shared/schema";
import { setupWebSocketServer } from "./websocket";

export async function registerRoutes(app: Express) {
  const server = createServer(app);
  const { broadcastPaymentUpdate } = setupWebSocketServer(server);

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
      res.status(400).json({ message: "Invalid UPI details", errors: result.error.errors });
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

  app.post("/api/upi/:id/block", async (req, res) => {
    const id = parseInt(req.params.id);
    const upiId = await storage.blockUpiId(id);
    res.json(upiId);
  });

  app.post("/api/upi/:id/unblock", async (req, res) => {
    const id = parseInt(req.params.id);
    const upiId = await storage.unblockUpiId(id);
    res.json(upiId);
  });

  app.delete("/api/upi/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const upiId = await storage.deleteUpiId(id);
    res.json(upiId);
  });

  app.get("/api/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ 
          message: "Invalid transaction details", 
          errors: result.error.errors 
        });
        return;
      }

      // Validate UPI ID status
      const upiDetails = await storage.getUpiIdByAddress(result.data.upiId);
      if (!upiDetails) {
        res.status(404).json({ message: "UPI ID not found" });
        return;
      }

      if (upiDetails.blockedAt) {
        res.status(403).json({ message: "This UPI ID is blocked" });
        return;
      }

      if (upiDetails.deletedAt) {
        res.status(403).json({ message: "This UPI ID is no longer active" });
        return;
      }

      if (!upiDetails.isActive) {
        res.status(403).json({ message: "This UPI ID is currently inactive" });
        return;
      }

      // Generate unique reference ID
      const reference = nanoid();

      // Create transaction with validated data
      const transaction = await storage.createTransaction({
        ...result.data,
        reference,
        status: "pending"
      });

      res.json(transaction);
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(500).json({ 
        message: "Failed to process transaction",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/transactions/:reference", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.reference);
      if (!transaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
      }

      // If transaction status changes, broadcast via WebSocket
      if (transaction.status !== "pending") {
        broadcastPaymentUpdate(transaction.reference, transaction.status as 'success' | 'failed');
      }

      res.json(transaction);
    } catch (error) {
      console.error("Transaction fetch error:", error);
      res.status(500).json({ 
        message: "Failed to fetch transaction",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return server;
}