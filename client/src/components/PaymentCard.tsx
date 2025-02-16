import React, { useState, useEffect } from "react";
import { UpiId } from "@shared/schema";
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
import { Timer, AlertTriangle, CheckCircle2, XCircle, IndianRupee, Copy, ExternalLink,
  Smartphone, ShoppingCart, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";

const PAYMENT_TIMEOUT = 180; // 3 minutes in seconds

const paymentSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0")
    .refine((val) => parseFloat(val) <= 100000, "Amount cannot exceed ₹1,00,000"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const generateUpiLink = (upi: UpiId, amount: string, reference: string) => {
  try {
    const cleanAmount = parseFloat(amount).toFixed(2);
    const cleanReference = reference.replace(/[^a-zA-Z0-9]/g, '');

    const cleanUpiId = upi.upiId.trim();
    const cleanMerchantName = encodeURIComponent(upi.merchantName.trim());

    const upiIdRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z][a-zA-Z0-9]+$/;
    if (!upiIdRegex.test(cleanUpiId)) {
      throw new Error("Invalid UPI ID format");
    }

    const params = new URLSearchParams({
      pa: cleanUpiId,
      pn: cleanMerchantName,
      am: cleanAmount,
      tr: cleanReference,
      cu: "INR",
      tn: `Payment to ${cleanMerchantName}`,
      mc: "0000",  // Merchant category code
      mode: "04",  // QR code mode
    });

    return `upi://pay?${params.toString()}`;
  } catch (error) {
    console.error("Error generating UPI link:", error);
    return null;
  }
};

const PaymentCard = ({ upi }: { upi: UpiId }) => {
  const [showQR, setShowQR] = useState(false);
  const [reference, setReference] = useState("");
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed">("pending");
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let statusCheck: NodeJS.Timeout;

    if (showQR && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      statusCheck = setInterval(async () => {
        try {
          const res = await apiRequest("GET", `/api/transactions/${reference}`);
          const transaction = await res.json();
          if (transaction.status === "success") {
            setPaymentStatus("success");
            clearInterval(statusCheck);
            toast({
              title: "Payment Successful",
              description: "Thank you! Your payment has been processed successfully.",
            });
          } else if (transaction.status === "failed") {
            setPaymentStatus("failed");
            clearInterval(statusCheck);
            toast({
              title: "Payment Failed",
              description: "The payment couldn't be processed. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to check payment status:", error);
        }
      }, 5000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(statusCheck);
    };
  }, [showQR, timeLeft, reference, toast]);

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

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const res = await apiRequest("POST", "/api/transactions", {
        amount: data.amount,
        upiId: upi.upiId,
        merchantName: upi.merchantName,
        status: "pending",
      });
      const tx = await res.json();
      setReference(tx.reference);
      setTimeLeft(PAYMENT_TIMEOUT);
      setPaymentStatus("pending");
      setShowQR(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const upiLink = showQR ? generateUpiLink(upi, form.getValues("amount"), reference) : "";

  const copyUpiLink = () => {
    if (upiLink) {
      navigator.clipboard.writeText(upiLink);
      toast({
        description: "Payment link copied to clipboard",
      });
    } else {
      toast({
        title: "Error",
        description: "Unable to copy payment link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  if (upi.blockedAt) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20 mb-4">
          <div className="flex items-center gap-4 text-red-400">
            <AlertTriangle className="w-8 h-8" />
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
      >
        <Card className="p-6 backdrop-blur-lg bg-gradient-to-br from-red-950/80 to-gray-900/80 border-red-500/20 mb-4 shadow-xl hover:shadow-red-500/10 transition-all duration-300">
          <div className="mb-6">
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  <span>{upi.merchantName}</span>
                  <Badge variant="secondary" className="ml-2 bg-red-500/20 text-red-300">
                    Verified
                  </Badge>
                </h2>
              </div>
              <QrCode className="w-6 h-6 text-red-400" />
            </motion.div>
          </div>

          {!showQR ? (
            <motion.form 
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Enter Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max="100000"
                    {...form.register("amount")}
                    className="pl-9 bg-white/5 border-red-500/20 text-white focus:ring-red-500/30 transition-all duration-300 text-lg font-medium"
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

              <div className="py-4">
                <p className="text-sm text-gray-400 mb-3">Pay using any of these apps</p>
                <div className="flex justify-around items-center bg-white/5 p-4 rounded-lg">
                  <SiGooglepay className="w-10 h-10 text-white/80 hover:text-white transition-colors" />
                  <SiPhonepe className="w-10 h-10 text-white/80 hover:text-white transition-colors" />
                  <SiPaytm className="w-10 h-10 text-white/80 hover:text-white transition-colors" />
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-400">Transaction Details</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transaction Limit</span>
                  <span className="text-white">₹1,00,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing Fee</span>
                  <span className="text-green-400">Free</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-500 hover:bg-red-600 transform hover:scale-[1.02] transition-all duration-300"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Proceed to Pay
              </Button>
            </motion.form>
          ) : (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white p-6 rounded-lg flex flex-col items-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white opacity-10 rounded-lg" />

                {upiLink ? (
                  <>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white p-4 rounded-lg"
                    >
                      <QRCode
                        value={upiLink}
                        size={200}
                        level="H"
                        className="w-full h-auto"
                      />
                    </motion.div>
                    <motion.div 
                      className="text-center mt-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-white font-medium">Scan QR with any UPI app</p>
                      <p className="text-red-400 text-xl font-bold mt-2">
                        {formatAmount(form.getValues("amount"))}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        To: {upi.merchantName}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-500 font-medium">Invalid UPI Configuration</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Please contact the administrator
                    </p>
                  </div>
                )}
              </div>

              <motion.div 
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  onClick={copyUpiLink}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                  onClick={() => {
                    if (upiLink) {
                      window.open(upiLink, '_blank');
                    }
                  }}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open in App
                </Button>
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>Session expires in</span>
                  </div>
                  <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Progress value={(timeLeft / PAYMENT_TIMEOUT) * 100} className="h-1" />
                </motion.div>
              </motion.div>

              <Button
                variant="outline"
                className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                onClick={() => setShowQR(false)}
              >
                Cancel Payment
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentCard;