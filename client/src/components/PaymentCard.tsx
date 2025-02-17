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

const PAYMENT_TIMEOUT = 180; // 3 minutes in seconds
const VERIFICATION_INTERVAL = 3000; // 3 seconds

const paymentSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount")
    .refine((val) => parseFloat(val) >= 1, "Minimum amount is ₹1")
    .refine((val) => parseFloat(val) <= 100000, "Amount cannot exceed ₹1,00,000"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Enhanced UPI link generation with security parameters
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

    // Add additional security parameters
    const params = new URLSearchParams({
      pa: upi.upiId.trim(),
      pn: cleanMerchantName,
      tn: `Payment_${cleanReference}`,
      am: cleanAmount,
      cu: "INR",
      tr: cleanReference,
      mc: upi.merchantCategory || "0000",
      url: window.location.origin,
      sign: btoa(`${upi.upiId}:${cleanAmount}:${cleanReference}`), // Basic integrity check
    });

    return `upi://pay?${params.toString()}`;
  } catch (error) {
    console.error("Error generating UPI link:", error);
    return null;
  }
};

// Enhanced amount formatting with currency symbol
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

// Security verification component
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
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
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
                title: "✅ Payment Successful",
                description: `Payment of ${formatAmount(form.getValues("amount"))} received successfully. Transaction ID: ${reference}`,
                variant: "default",
                duration: 5000,
              });
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            } else if (data.status === 'failed') {
              toast({
                title: "❌ Payment Failed",
                description: "Transaction failed or was cancelled. Please try again or contact support if the amount was deducted.",
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

  // Add security check function
  const performSecurityChecks = async (amount: string) => {
    const checks = [];
    const parsedAmount = parseFloat(amount);
    const dailyLimit = parseFloat(String(upi.dailyLimit));

    // Amount limit check
    if (!isNaN(dailyLimit) && parsedAmount <= dailyLimit) {
      checks.push(SecurityCheckTypes.AMOUNT_LIMIT);
    }

    // Device and location verification
    if (navigator.userAgent) {
      checks.push(SecurityCheckTypes.DEVICE_VERIFICATION);
    }

    // Risk assessment based on amount and merchant category
    if (upi.merchantCategory && !upi.blockedAt) {
      checks.push(SecurityCheckTypes.RISK_ASSESSMENT);
    }

    return checks;
  };


  const onSubmit = async (data: PaymentFormData) => {
    try {
      const amount = parseFloat(data.amount);
      if (amount < 1) {
        toast({
          title: "⚠️ Invalid Amount",
          description: "Minimum transaction amount is ₹1",
          variant: "destructive",
        });
        return;
      }

      // Enhanced validation before transaction
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

      // Perform security checks
      const securityChecks = await performSecurityChecks(data.amount);

      const res = await apiRequest("POST", "/api/transactions", {
        amount: data.amount,
        upiId: upi.upiId,
        merchantName: upi.merchantName,
        status: "pending",
        deviceInfo: navigator.userAgent,
        ipAddress: window.location.hostname,
        paymentMethod: "upi",
        securityChecks,
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.code === "BLOCKED_BY_AUTHORITY") {
          throw new Error("Transaction blocked by authorities for security reasons");
        }
        throw new Error(errorData.message || "Failed to create transaction");
      }

      const tx = await res.json();
      setReference(tx.reference);
      setTimeLeft(PAYMENT_TIMEOUT);
      setPaymentStatus("pending");
      setShowQR(true);
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentStatus("failed");
      const errorMessage = error instanceof Error ? error.message : "Unable to initiate payment";

      if (errorMessage.includes("blocked by authorities")) {
        toast({
          title: "❌ Transaction Blocked",
          description: "For security reasons, sending money from your account for this payment is not permitted.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "❌ Payment Error",
          description: errorMessage + ". Please try again.",
          variant: "destructive",
          duration: 7000,
        });
      }
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
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="transform-gpu max-w-xl mx-auto"
      >
        <Card className="overflow-hidden backdrop-blur-lg bg-gradient-to-br from-red-950/90 to-gray-900/90 border-red-500/20 mb-4 shadow-2xl hover:shadow-red-500/10 transition-all duration-300 rounded-xl">
          <div className="p-6 border-b border-red-500/20 bg-gradient-to-r from-red-950/50 to-gray-900/50">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                  <IndianRupee className="w-6 h-6" />
                  <span>{upi.merchantName}</span>
                  <Badge variant="secondary" className="ml-2 bg-red-500/20 text-red-300">
                    Verified
                  </Badge>
                </h2>
                <motion.p
                  className="text-lg mt-2 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent font-medium animate-gradient"
                  style={{
                    backgroundSize: '200% auto',
                    animation: 'gradient 3s linear infinite'
                  }}
                >
                  <span className="bg-gradient-to-r from-red-300 via-purple-400 to-red-500 animate-gradient bg-clip-text text-transparent bg-[length:200%_auto]">
                    {upi.storeName}
                  </span>
                </motion.p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-full">
                <QrCode className="w-8 h-8 text-red-400" />
              </div>
            </motion.div>
          </div>

          <div className="p-8">
            {!showQR ? (
              <motion.div className="space-y-8">
                <motion.form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="space-y-3">
                    <label className="text-lg font-medium text-red-400">Enter Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-5 w-5 text-red-400" />
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        max="100000"
                        {...form.register("amount")}
                        className="pl-10 bg-white/5 border-red-500/20 text-white focus:ring-red-500/30 transition-all duration-300 text-xl font-medium h-14"
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
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center p-4 bg-white/5 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
                    >
                      <Shield className="w-8 h-8 text-green-400 mb-2" />
                      <span className="text-sm font-medium text-gray-300">Secure</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center p-4 bg-white/5 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
                    >
                      <Clock className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-sm font-medium text-gray-300">Instant</span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center p-4 bg-white/5 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
                    >
                      <Smartphone className="w-8 h-8 text-purple-400 mb-2" />
                      <span className="text-sm font-medium text-gray-300">Mobile</span>
                    </motion.div>
                  </div>
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Proceed to Pay
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
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gradient-to-br from-gray-900 to-red-950 p-6 rounded-lg flex flex-col items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/5 mask-gradient" />

                  {upiLink ? (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-4 rounded-lg shadow-xl"
                      >
                        <QRCode
                          value={upiLink}
                          size={200}
                          level="H"
                          className="w-full h-auto"
                        />
                      </motion.div>
                      <motion.div
                        className="text-center mt-6 space-y-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-white font-medium">Scan QR with any UPI app</p>
                        <p className="text-red-400 text-2xl font-bold">
                          {formatAmount(form.getValues("amount"))}
                        </p>
                        <p className="text-gray-400 text-sm">
                          To: {upi.merchantName}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Reference: {reference}
                        </p>
                      </motion.div>
                      <SecurityVerification status={paymentStatus}/>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-4">
                      <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/20">
                        <XOctagon className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                        <h3 className="text-xl font-semibold text-red-400 mb-2">
                          Transaction Blocked
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          For security reasons, sending money from your account for this payment is not permitted.
                        </p>
                        <div className="flex flex-col gap-3">
                          <Button
                            variant="outline"
                            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              setShowQR(false);
                              setPaymentStatus("pending");
                            }}
                          >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                          </Button>
                          <p className="text-xs text-gray-500">
                            If you believe this is an error, please contact your bank or UPI provider.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <motion.div
                  className="space-y-4 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white/5 p-4 rounded-lg space-y-3">
                    <h4 className="text-red-400 font-medium">Payment Security</h4>
                    <SecurityVerification status={paymentStatus}/>
                  </div>


                  <div className="bg-white/5 p-4 rounded-lg space-y-3">
                    <h4 className="text-red-400 font-medium">Transaction Details</h4>
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
                </motion.div>

                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    onClick={() => {
                      const amount = form.getValues("amount");
                      const paymentLink = `upi://pay?pa=${upi.upiId}&pn=${encodeURIComponent(upi.merchantName)}&am=${amount}&cu=INR`;
                      window.open(paymentLink, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in App
                  </Button>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
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
                    className="h-1 bg-red-950"
                  />
                </motion.div>

                {paymentStatus !== "pending" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      paymentStatus === "success"
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-red-500/10 border border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {paymentStatus === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          paymentStatus === "success" ? "text-green-400" : "text-red-400"
                        }`}>
                          {paymentStatus === "success" ? "Payment Successful" : "Payment Failed"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {paymentStatus === "success"
                            ? "Your transaction has been completed"
                            : "Please try again or contact support"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  variant="outline"
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  onClick={() => setShowQR(false)}
                >
                  Cancel Payment
                </Button>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentCard;