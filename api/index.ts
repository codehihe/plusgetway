// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ message });
});

export default app;