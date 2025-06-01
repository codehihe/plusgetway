import mongoose, { Schema, Document } from 'mongoose';
import { User, UpiId, Transaction, UserAuditLog, UpiAuditLog } from '@shared/schema';

// User Model
const userSchema = new Schema<User & Document>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, default: 'user' },
  isApproved: { type: Boolean, default: false },
  approvedAt: { type: Date },
  approvedBy: { type: String },
  status: { type: String, default: 'pending' },
  lastLoginAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// UPI ID Model
const upiIdSchema = new Schema<UpiId & Document>({
  upiId: { type: String, required: true, unique: true },
  merchantName: { type: String, required: true },
  storeName: { type: String, required: true },
  merchantCategory: { type: String, default: 'general' },
  businessType: { type: String, default: 'retail' },
  dailyLimit: { type: Number, default: 50000 },
  isActive: { type: Boolean, default: true },
  blockedAt: { type: Date },
  deletedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// Transaction Model
const transactionSchema = new Schema<Transaction & Document>({
  amount: { type: String, required: true },
  upiId: { type: String, required: true },
  merchantName: { type: String, required: true },
  reference: { type: String, required: true, unique: true },
  status: { type: String, default: 'pending' },
  customerName: { type: String },
  customerPhone: { type: String },
  customerEmail: { type: String },
  description: { type: String },
  paymentApp: { type: String },
  timestamp: { type: Date, default: Date.now },
  completedAt: { type: Date },
  failedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'upi' },
  deviceInfo: { type: String },
  ipAddress: { type: String },
  geolocation: { type: String },
  verifiedBy: { type: String },
  verifiedAt: { type: Date },
}, {
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// User Audit Log Model
const userAuditLogSchema = new Schema<UserAuditLog & Document>({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// UPI Audit Log Model
const upiAuditLogSchema = new Schema<UpiAuditLog & Document>({
  upiId: { type: String, required: true },
  action: { type: String, required: true },
  oldValues: { type: String },
  newValues: { type: String },
  timestamp: { type: Date, default: Date.now },
  actionBy: { type: String },
  ipAddress: { type: String },
}, {
  toJSON: { 
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

export const UserModel = mongoose.model<User & Document>('User', userSchema);
export const UpiIdModel = mongoose.model<UpiId & Document>('UpiId', upiIdSchema);
export const TransactionModel = mongoose.model<Transaction & Document>('Transaction', transactionSchema);
export const UserAuditLogModel = mongoose.model<UserAuditLog & Document>('UserAuditLog', userAuditLogSchema);
export const UpiAuditLogModel = mongoose.model<UpiAuditLog & Document>('UpiAuditLog', upiAuditLogSchema);