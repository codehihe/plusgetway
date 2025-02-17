import React, { useState, useEffect, useCallback, useRef } from "react";
import { UpiId, TransactionStatus, SecurityCheckTypes } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "react-qr-code";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, AlertTriangle, CheckCircle2, XCircle, IndianRupee, ExternalLink,
  Smartphone, ShoppingCart, QrCode, Shield, Clock, Lock, XOctagon, AlertCircle, RefreshCcw,
  Loader2, ShieldCheck, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import { getWebSocketUrl } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from "@tanstack/react-query";

const PAYMENT_TIMEOUT = 60; // 1 minute in seconds
const VERIFICATION_INTERVAL = 3000; // 3 seconds

const paymentSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount")
    .refine((val) => parseFloat(val) >= 1, "Minimum amount is ₹1")
    .refine((val) => parseFloat(val) <= 100000, "Amount cannot exceed ₹1,00,000"),
});

const verificationSchema = z.object({
  transactionId: z.string()
    .min(1, "Transaction ID is required")
    .max(50, "Transaction ID is too long"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

const generateUpiLink = (upi: UpiId, amount: string, reference: string) => {
  try {
    if (!upi?.upiId || !amount || !reference) {
      console.error("Missing required parameters for UPI link generation");
      return null;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      console.error("Invalid amount for UPI link generation");
      return null;
    }

    const cleanAmount = parsedAmount.toFixed(2);
    const cleanMerchantName = encodeURIComponent(upi.merchantName.trim());
    const cleanReference = encodeURIComponent(reference.trim());

    const params = new URLSearchParams({
      pa: upi.upiId.trim(),
      pn: cleanMerchantName,
      tn: `Payment_${cleanReference}`,
      am: cleanAmount,
      cu: "INR",
      tr: cleanReference,
      mc: upi.merchantCategory || "0000",
      url: window.location.origin,
      sign: btoa(`${upi.upiId}:${cleanAmount}:${cleanReference}`),
    });

    return `upi://pay?${params.toString()}`;
  } catch (error) {
    console.error("Error generating UPI link:", error);
    return null;
  }
};

const formatAmount = (amount: string) => {
  try {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount);
  } catch (error) {
    console.error("Error formatting amount:", error);
    return "₹0.00";
  }
};

const SecurityVerification = ({ status }: { status: string }) => {
  const checks = [
    { id: SecurityCheckTypes.AMOUNT_LIMIT, label: "Amount Verification", icon: IndianRupee },
    { id: SecurityCheckTypes.RISK_ASSESSMENT, label: "Risk Assessment", icon: ShieldCheck },
    { id: SecurityCheckTypes.LOCATION_VERIFICATION, label: "Location Check", icon: Globe },
  ];

  return (
    <div className="space-y-2">
      {checks.map((check, index) => {
        const Icon = check.icon;
        const isChecking = status === "processing" && index === 1;
        const isComplete = status !== "pending" || index === 0;

        return (
          <div key={check.id} className="flex items-center gap-2 text-sm">
            <div className={`p-1 rounded-full ${
              isComplete ? "bg-green-500/20" : "bg-gray-500/20"
            }`}>
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Icon className={`w-4 h-4 ${
                  isComplete ? "text-green-400" : "text-gray-400"
                }`} />
              )}
            </div>
            <span className={isComplete ? "text-green-400" : "text-gray-400"}>
              {check.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PaymentCard = ({ upi }: { upi: UpiId }) => {
  const [showQR, setShowQR] = useState(false);
  const [reference, setReference] = useState("");
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "processing">("pending");
  const [wsConnected, setWsConnected] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      transactionId: "",
    },
  });

  const setupWebSocket = useCallback(() => {
    if (!reference) return;

    const wsUrl = getWebSocketUrl();
    console.log("Connecting to WebSocket:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setWsConnected(true);
        ws.send(JSON.stringify({ type: 'subscribe', reference }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'connected') {
            console.log('Successfully connected to payment server');
          } else if (data.type === 'payment_status' && data.reference === reference) {
            setPaymentStatus(data.status);
            if (data.status === 'success') {
              toast({
                title: "✅ Payment Approved",
                description: `Your payment of ${formatAmount(form.getValues("amount"))} has been verified and accepted by the merchant.`,
                variant: "default",
                duration: 5000,
              });
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else if (data.status === 'failed') {
              toast({
                title: "❌ Payment Declined",
                description: "Your payment was declined by the merchant. If you believe this is an error, please contact support.",
                variant: "destructive",
                duration: 7000,
              });
            }
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        toast({
          title: "Connection Error",
          description: "Unable to establish real-time connection. Payment status updates may be delayed.",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setWsConnected(false);
        setTimeout(() => {
          if (timeLeft > 0) {
            setupWebSocket();
          }
        }, 3000);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      toast({
        title: "Connection Error",
        description: "Unable to establish real-time connection. Payment status updates may be delayed.",
        variant: "destructive",
      });
      return undefined;
    }
  }, [reference, toast, form, timeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let statusCheck: NodeJS.Timeout | null = null;

    const clearTimers = () => {
      if (timer) clearInterval(timer);
      if (statusCheck) clearInterval(statusCheck);
    };

    if (showQR && timeLeft > 0 && !wsConnected) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      statusCheck = setInterval(async () => {
        try {
          if (!reference) {
            console.error("Missing reference for status check");
            return;
          }

          const res = await apiRequest("GET", `/api/transactions/${reference}`);
          const transaction = await res.json();

          if (transaction.status === "success") {
            setPaymentStatus("success");
            clearTimers();
            toast({
              title: "✅ Payment Successful",
              description: `Payment of ${formatAmount(form.getValues("amount"))} received successfully. Transaction ID: ${reference}`,
              variant: "default",
              duration: 5000,
            });
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else if (transaction.status === "failed") {
            setPaymentStatus("failed");
            clearTimers();
            toast({
              title: "❌ Payment Failed",
              description: "Transaction failed or was cancelled. Please try again or contact support if the amount was deducted.",
              variant: "destructive",
              duration: 7000,
            });
          } else if (transaction.status === "pending" && timeLeft <= 0) {
            setPaymentStatus("failed");
            clearTimers();
            toast({
              title: "⚠️ Payment Timeout",
              description: "Payment session expired. Please try again.",
              variant: "destructive",
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("Failed to check payment status:", error);
          if (!wsConnected) {
            toast({
              title: "Error",
              description: "Unable to verify payment status. Please check your transaction history.",
              variant: "destructive",
            });
          }
        }
      }, 3000);
    }

    return () => {
      clearTimers();
    };
  }, [showQR, timeLeft, reference, toast, form, wsConnected]);

  useEffect(() => {
    if (showQR && reference) {
      const cleanup = setupWebSocket();
      return () => {
        cleanup?.();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    }
  }, [showQR, reference, setupWebSocket]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (showQR && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showQR, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setShowQR(false);
      setPaymentStatus("failed");
      toast({
        title: "Session Expired",
        description: "The payment session has timed out. Please start again.",
        variant: "destructive",
      });
    }
  }, [timeLeft, toast]);

  const performSecurityChecks = async (amount: string) => {
    const checks = [];
    const parsedAmount = parseFloat(amount);
    const dailyLimit = parseFloat(String(upi.dailyLimit));

    if (!isNaN(dailyLimit) && parsedAmount <= dailyLimit) {
      checks.push(SecurityCheckTypes.AMOUNT_LIMIT);
    }

    if (navigator.userAgent) {
      checks.push(SecurityCheckTypes.DEVICE_VERIFICATION);
    }

    if (upi.merchantCategory && !upi.blockedAt) {
      checks.push(SecurityCheckTypes.RISK_ASSESSMENT);
    }

    return checks;
  };


  const onSubmit = async (data: PaymentFormData) => {
    try {
      setPaymentStatus("pending");
      setReference("");
      setShowVerification(false);

      const amount = parseFloat(data.amount);
      if (amount < 1) {
        toast({
          title: "⚠️ Invalid Amount",
          description: "Minimum transaction amount is ₹1",
          variant: "destructive",
        });
        return;
      }

      if (!upi || !upi.upiId) {
        throw new Error("Invalid UPI configuration");
      }

      if (upi.blockedAt) {
        setPaymentStatus("failed");
        toast({
          title: "❌ Transaction Blocked",
          description: "This UPI ID is currently blocked by authorities. Please try another payment method.",
          variant: "destructive",
          duration: 7000,
        });
        return;
      }

      if (!upi.isActive || upi.deletedAt) {
        setPaymentStatus("failed");
        toast({
          title: "❌ UPI ID Inactive",
          description: "This payment method is no longer available. Please contact the merchant.",
          variant: "destructive",
          duration: 7000,
        });
        return;
      }

      setPaymentStatus("processing");

      const txReference = uuidv4();
      setReference(txReference);

      const securityChecks = await performSecurityChecks(data.amount);

      const response = await apiRequest("POST", "/api/transactions", {
        amount: data.amount,
        upiId: upi.upiId,
        merchantName: upi.merchantName,
        status: "pending",
        deviceInfo: navigator.userAgent || "unknown",
        ipAddress: "127.0.0.1",
        paymentMethod: "upi",
        securityChecks,
        reference: txReference,
      });

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create transaction" }));
        if (errorData.code === "BLOCKED_BY_AUTHORITY") {
          throw new Error("Transaction blocked by authorities for security reasons");
        }
        throw new Error(errorData.message || "Failed to create transaction");
      }

      const tx = await response.json();
      if (!tx || !tx.reference) {
        throw new Error("Invalid transaction response");
      }

      setTimeLeft(PAYMENT_TIMEOUT);
      setShowQR(true);

    } catch (error: any) {
      console.error("Payment initiation error:", error);
      setPaymentStatus("failed");
      setReference("");
      setShowVerification(false);

      const errorMessage = error instanceof Error ? error.message : "Unable to initiate payment";

      toast({
        title: "❌ Payment Error",
        description: errorMessage.includes("blocked by authorities")
          ? "For security reasons, sending money from your account for this payment is not permitted."
          : `${errorMessage}. Please try again.`,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const handleVerificationSubmit = async (data: VerificationFormData) => {
    try {
      if (!reference) {
        toast({
          title: "❌ Error",
          description: "Invalid transaction reference",
          variant: "destructive",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/transactions/verify", {
        reference,
        transactionId: data.transactionId
      });

      if (!response.ok) {
        throw new Error("Failed to submit transaction ID");
      }

      toast({
        title: "✅ Transaction ID Submitted",
        description: "We'll verify your payment and update the status shortly.",
        variant: "default",
      });

      // Start checking for status updates
      setPaymentStatus("processing");
    } catch (error) {
      console.error("Verification submission error:", error);
      toast({
        title: "❌ Submission Failed",
        description: "Unable to submit transaction ID. Please try again.",
        variant: "destructive",
      });
    }
  };

  const upiLink = showQR ? generateUpiLink(upi, form.getValues("amount"), reference) : "";

  if (upi.blockedAt) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="transform-gpu"
      >
        <Card className="p-6 backdrop-blur-lg bg-red-950/80 border-red-500/20 mb-4">
          <div className="flex items-center gap-4 text-red-400">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
            <div>
              <h2 className="text-xl font-semibold">Account Blocked</h2>
              <p className="text-sm text-gray-400">This UPI ID is currently unavailable</p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="transform-gpu max-w-xl mx-auto"
    >
      <AnimatePresence mode="wait">
        <Card className="overflow-hidden backdrop-blur-lg bg-gradient-to-br from-blue-950/90 to-indigo-900/90 border-blue-500/20 mb-4 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 rounded-xl">
          <div className="p-6 border-b border-blue-500/20 bg-gradient-to-r from-blue-950/50 to-indigo-900/50">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IndianRupee className="w-6 h-6" />
                  </motion.div>
                  <span>{upi.merchantName}</span>
                  <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-300">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      Verified
                    </motion.span>
                  </Badge>
                </h2>
                <motion.p
                  className="text-lg mt-2"
                  style={{
                    backgroundSize: '200% auto',
                    animation: 'gradient 3s linear infinite'
                  }}
                >
                  <span className="bg-gradient-to-r from-blue-300 via-purple-400 to-blue-500 animate-gradient bg-clip-text text-transparent bg-[length:200%_auto]">
                    {upi.storeName}
                  </span>
                </motion.p>
              </div>
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="bg-blue-500/10 p-3 rounded-full"
              >
                <QrCode className="w-8 h-8 text-blue-400" />
              </motion.div>
            </motion.div>
          </div>

          <div className="p-8">
            {!showQR ? (
              <motion.form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3">
                  <label className="text-lg font-medium text-blue-400">Enter Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <IndianRupee className="h-5 w-5 text-blue-400" />
                      </motion.div>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      max="100000"
                      {...form.register("amount")}
                      className="pl-10 bg-white/5 border-blue-500/20 text-white focus:ring-blue-500/30 transition-all duration-300 text-xl font-medium h-14 rounded-xl"
                    />
                  </div>
                  {form.formState.errors.amount && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 mt-1"
                    >
                      {form.formState.errors.amount.message}
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { icon: Shield, text: "Secure", color: "green" },
                    { icon: Clock, text: "Instant", color: "blue" },
                    { icon: Smartphone, text: "Mobile", color: "purple" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="flex flex-col items-center p-4 bg-white/5 rounded-lg border border-blue-500/10 hover:border-blue-500/20 transition-all duration-300"
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className={`w-8 h-8 text-${item.color}-400 mb-2`} />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-300 rounded-xl h-12"
                >
                  <motion.div
                    className="flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Proceed to Pay
                  </motion.div>
                </Button>
                <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-400">Transaction Details</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Transaction Limit</span>
                    <span className="text-white">₹1,00,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing Fee</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Settlement Time</span>
                    <span className="text-white">Instant</span>
                  </div>
                </div>

                <div className="py-4">
                  <p className="text-sm text-gray-400 mb-3">Supported Payment Apps</p>
                  <div className="grid grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <SiGooglepay className="w-12 h-12 text-white/80 hover:text-white transition-colors" />
                      <span className="text-xs text-gray-400">Google Pay</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <SiPhonepe className="w-12 h-12 text-white/80 hover:text-white transition-colors" />
                      <span className="text-xs text-gray-400">PhonePe</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <SiPaytm className="w-12 h-12 text-white/80 hover:text-white transition-colors" />
                      <span className="text-xs text-gray-400">Paytm</span>
                    </motion.div>
                  </div>
                </div>
              </motion.form>
            ) : (
              <div className="space-y-6">
                {upiLink && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-4 rounded-lg shadow-xl mx-auto w-fit"
                    >
                      <QRCode
                        value={upiLink}
                        size={200}
                        level="H"
                        className="w-full h-auto"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-2"
                    >
                      <p className="text-white font-medium">Scan QR with any UPI app</p>
                      <p className="text-blue-400 text-2xl font-bold">
                        {formatAmount(form.getValues("amount"))}
                      </p>
                      <p className="text-gray-400 text-sm">To: {upi.merchantName}</p>
                      <p className="text-gray-500 text-xs">Reference: {reference}</p>
                    </motion.div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                        onClick={() => {
                          const amount = form.getValues("amount");
                          const paymentLink = `upi://pay?pa=${upi.upiId}&pn=${encodeURIComponent(upi.merchantName)}&am=${amount}&cu=INR`;
                          window.open(paymentLink, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in App
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                        onClick={() => setShowQR(false)}
                      >
                        Cancel Payment
                      </Button>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-400">
                            Enter your UPI Transaction ID
                          </label>
                          <Input
                            type="text"
                            {...verificationForm.register("transactionId")}
                            className="bg-white/10 border-blue-500/20"
                            placeholder="Enter the transaction ID from your UPI app"
                          />
                          {verificationForm.formState.errors.transactionId && (
                            <p className="text-sm text-red-400">
                              {verificationForm.formState.errors.transactionId.message}
                            </p>
                          )}
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-green-500 hover:bg-green-600"
                        >
                          Submit Transaction ID
                        </Button>
                      </form>
                    </motion.div>

                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-lg space-y-3">
                        <h4 className="text-blue-400 font-medium">Payment Security</h4>
                        <SecurityVerification status={paymentStatus}/>
                      </div>

                      <div className="bg-white/5 p-4 rounded-lg space-y-3">
                        <h4 className="text-blue-400 font-medium">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Merchant</span>
                            <span className="text-white">{upi.merchantName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">UPI ID</span>
                            <span className="text-white">{upi.upiId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Reference</span>
                            <span className="text-white">{reference}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          <span>Session expires in</span>
                        </div>
                        <span className="font-mono">
                          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <Progress
                        value={(timeLeft / PAYMENT_TIMEOUT) * 100}
                        className="h-1 bg-blue-950"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentCard;