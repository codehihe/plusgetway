import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { ADMIN_PIN, insertUpiSchema, insertTransactionSchema } from "@shared/schema";
import { setupWebSocketServer } from "./websocket";

export async function registerRoutes(app: Express) {
  const server = createServer(app);
  const { broadcastPaymentUpdate } = setupWebSocketServer(server);

  // Admin authentication
  app.post("/api/admin/login", (req, res) => {
    const { pin } = req.body;
    if (pin === ADMIN_PIN) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid PIN" });
    }
  });

  // UPI Management
  app.get("/api/upi", async (req, res) => {
    try {
      const upiIds = await storage.getUpiIds();
      res.json(upiIds);
    } catch (error) {
      console.error("Error fetching UPI IDs:", error);
      res.status(500).json({ message: "Failed to fetch UPI IDs" });
    }
  });

  app.post("/api/upi", async (req, res) => {
    try {
      const result = insertUpiSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: "Invalid UPI details", errors: result.error.errors });
        return;
      }

      // Check if UPI ID already exists
      const existingUpi = await storage.getUpiIdByAddress(result.data.upiId);
      if (existingUpi) {
        res.status(409).json({
          message: "This UPI ID already exists",
          code: "DUPLICATE_UPI"
        });
        return;
      }

      const upiId = await storage.addUpiId(result.data);
      res.json(upiId);
    } catch (error: any) {
      console.error("Error adding UPI ID:", error);
      res.status(500).json({
        message: "Failed to add UPI ID",
        error: error.message,
        code: "UPI_ADD_FAILED"
      });
    }
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

  // Transaction Management
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
        res.status(404).json({
          message: "Invalid UPI ID. Please check and try again.",
          code: "INVALID_UPI"
        });
        return;
      }

      if (upiDetails.blockedAt) {
        res.status(403).json({
          message: "This UPI ID is blocked. Please contact support.",
          code: "UPI_BLOCKED"
        });
        return;
      }

      // Generate unique reference ID if not provided
      const reference = result.data.reference || nanoid();

      // Create transaction with validated data
      const transaction = await storage.createTransaction({
        ...result.data,
        reference,
        merchantName: upiDetails.merchantName,
      });

      // Return detailed response
      res.json({
        ...transaction,
        upiDetails: {
          id: upiDetails.upiId,
          name: upiDetails.merchantName,
          isActive: upiDetails.isActive
        }
      });
    } catch (error) {
      console.error("Transaction creation error:", error);
      res.status(500).json({
        message: "Failed to process transaction. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
        code: "TRANSACTION_FAILED"
      });
    }
  });

  app.post("/api/transactions/verify", async (req, res) => {
    try {
      const { reference, transactionId } = req.body;
      if (!reference || !transactionId) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      const transaction = await storage.updateTransactionStatus(reference, "pending");
      await storage.updateTransactionDetails(reference, { transactionId });

      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Transaction verification error:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  app.post("/api/transactions/:reference/verify", async (req, res) => {
    try {
      const { reference } = req.params;
      const { status } = req.body;

      if (!['success', 'failed'].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      const transaction = await storage.updateTransactionStatus(reference, status);
      broadcastPaymentUpdate(reference, status as 'success' | 'failed');

      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
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

  // UPI Gateway Webhook Handler
  app.post("/api/webhook/upi-status", async (req, res) => {
    try {
      const { reference, status, signature } = req.body;

      // TODO: Verify webhook signature with UPI gateway's public key
      // This should be implemented based on your UPI gateway provider's specifications

      if (!reference || !status) {
        res.status(400).json({
          message: "Missing required fields",
          code: "INVALID_WEBHOOK_DATA"
        });
        return;
      }

      // Validate status
      if (!['success', 'failed'].includes(status)) {
        res.status(400).json({
          message: "Invalid status",
          code: "INVALID_STATUS"
        });
        return;
      }

      // Update transaction status
      const transaction = await storage.updateTransactionStatus(reference, status);

      // Broadcast status update via WebSocket
      broadcastPaymentUpdate(reference, status);

      res.json({
        success: true,
        transaction,
        message: `Transaction ${status === 'success' ? 'completed' : 'failed'} successfully`
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : "Unknown error",
        code: "WEBHOOK_FAILED"
      });
    }
  });

  return server;
}