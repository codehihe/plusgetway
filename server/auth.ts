import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserStatus } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (user.status !== UserStatus.APPROVED) {
          return done(null, false, { message: "Account is pending approval" });
        }

        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Update last login time
        await storage.updateUserLastLogin(user.id);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        role: "user",
        status: UserStatus.PENDING
      });

      // Create audit log for registration
      await storage.createUserAuditLog({
        userId: user.id,
        action: "REGISTER",
        details: "User registration",
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || ""
      });

      res.status(201).json({
        ...user,
        password: undefined,
        message: "Registration successful. Please wait for admin approval."
      });
    } catch (err) {
      next(err);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: SelectUser, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);

      req.logIn(user, async (err) => {
        if (err) return next(err);

        // Create audit log for login
        await storage.createUserAuditLog({
          userId: user.id,
          action: "LOGIN",
          details: "User login",
          ipAddress: req.ip,
          userAgent: req.get("user-agent") || ""
        });

        res.json({ ...user, password: undefined });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", async (req, res, next) => {
    if (req.user) {
      const userId = req.user.id;
      req.logout((err) => {
        if (err) return next(err);
        // Create audit log for logout
        storage.createUserAuditLog({
          userId,
          action: "LOGOUT",
          details: "User logout",
          ipAddress: req.ip,
          userAgent: req.get("user-agent") || ""
        });
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json({ ...req.user, password: undefined });
  });

  // Admin only: User approval endpoints
  app.patch("/api/users/:userId/approve", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      const user = await storage.updateUserStatus(userId, UserStatus.APPROVED, req.user.id);

      // Create audit log for approval
      await storage.createUserAuditLog({
        userId,
        action: "APPROVE",
        details: `User approved by admin ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || ""
      });

      res.json({ ...user, password: undefined });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/users/:userId/reject", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId);
      const user = await storage.updateUserStatus(userId, UserStatus.REJECTED, req.user.id);

      // Create audit log for rejection
      await storage.createUserAuditLog({
        userId,
        action: "REJECT",
        details: `User rejected by admin ${req.user.id}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || ""
      });

      res.json({ ...user, password: undefined });
    } catch (err) {
      next(err);
    }
  });

  // Admin only: Get pending users
  app.get("/api/users/pending", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers.map(user => ({ ...user, password: undefined })));
    } catch (err) {
      next(err);
    }
  });
}
