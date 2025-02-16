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
import { Timer, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const PAYMENT_TIMEOUT = 180; // 3 minutes in seconds

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

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
              description: "Your payment has been processed successfully.",
            });
          } else if (transaction.status === "failed") {
            setPaymentStatus("failed");
            clearInterval(statusCheck);
            toast({
              title: "Payment Failed",
              description: "Please try again or contact support.",
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
        title: "Payment Timeout",
        description: "The payment session has expired. Please try again.",
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
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const upiLink = showQR
    ? `upi://pay?pa=${upi.upiId}&pn=${encodeURIComponent(upi.merchantName)}&am=${form.getValues("amount")}&tr=${reference}`
    : "";

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
              <p className="text-sm text-gray-400">This UPI ID is currently blocked</p>
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
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-red-400">{upi.merchantName}</h2>
            <p className="text-sm text-gray-400">{upi.upiId}</p>
          </div>

          {!showQR ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...form.register("amount")}
                  className="bg-white/5 border-red-500/20 text-white"
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-400 mt-1">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
                Pay Now
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCode value={upiLink} className="w-full h-auto" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>Time remaining</span>
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
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}