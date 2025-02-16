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
import { Timer, AlertTriangle, CheckCircle2, XCircle, IndianRupee, Copy, ExternalLink, Smartphone } from "lucide-react";

const PAYMENT_TIMEOUT = 180; // 3 minutes in seconds

const paymentSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Please enter a valid amount")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const generateUpiLink = (upi: UpiId, amount: string, reference: string) => {
  // Ensure proper formatting of amount and reference
  const cleanAmount = parseFloat(amount).toFixed(2);
  const cleanReference = reference.replace(/[^a-zA-Z0-9]/g, '');

  // Format UPI ID and merchant name
  const cleanUpiId = upi.upiId.trim();
  const cleanMerchantName = encodeURIComponent(upi.merchantName.trim());

  // Build UPI deep link with all required parameters
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
};

export default function PaymentCard({ upi }: { upi: UpiId }) {
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
    navigator.clipboard.writeText(upiLink);
    toast({
      description: "Payment link copied to clipboard",
    });
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
      >
        <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20 mb-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-red-400 flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              {upi.merchantName}
            </h2>
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              {upi.upiId}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(upi.upiId);
                  toast({ description: "UPI ID copied to clipboard" });
                }}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </p>
          </div>

          {!showQR ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  step="0.01"
                  min="0.01"
                  {...form.register("amount")}
                  className="pl-9 bg-white/5 border-red-500/20 text-white"
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
                Generate Payment QR
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                <QRCode 
                  value={upiLink} 
                  size={200}
                  level="H"
                  className="w-full h-auto"
                />
                <div className="text-center mt-4">
                  <p className="text-black font-medium">Scan with any UPI app</p>
                  <p className="text-gray-500 text-sm mt-1">Amount: ₹{parseFloat(form.getValues("amount")).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/20 text-red-400"
                  onClick={copyUpiLink}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/20 text-red-400"
                  onClick={() => window.open(upiLink, '_blank')}
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open in App
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>Session expires in</span>
                  </div>
                  <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
                <Progress value={(timeLeft / PAYMENT_TIMEOUT) * 100} className="h-1" />
              </div>

              <div className="flex justify-center">
                {paymentStatus === "pending" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Timer className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                )}
                {paymentStatus === "success" && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
                {paymentStatus === "failed" && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>

              <Button
                variant="outline"
                className="w-full border-red-500/20 text-red-400"
                onClick={() => setShowQR(false)}
              >
                Cancel Payment
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}