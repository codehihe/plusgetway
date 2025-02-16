import { useState } from "react";
import { UpiId } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "react-qr-code";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function PaymentCard({ upi }: { upi: UpiId }) {
  const [showQR, setShowQR] = useState(false);
  const [reference, setReference] = useState("");
  const { toast } = useToast();
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const amount = parseInt(data.amount);
      const res = await apiRequest("POST", "/api/transactions", {
        amount,
        upiId: upi.upiId,
        merchantName: upi.merchantName,
        status: "pending",
      });
      const tx = await res.json();
      setReference(tx.reference);
      setShowQR(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment",
        variant: "destructive",
      });
    }
  };

  const upiLink = showQR
    ? `upi://pay?pa=${upi.upiId}&pn=${encodeURIComponent(upi.merchantName)}&am=${form.getValues("amount")}&tr=${reference}`
    : "";

  return (
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
  );
}
