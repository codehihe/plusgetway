import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function TransactionHistory() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 text-red-400" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-500">Transaction History</h1>
        </div>

        <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              {transactions?.map((tx) => (
                <motion.div
                  key={tx.reference}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <p className="font-medium text-red-300">
                        {formatAmount(tx.amount)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{tx.merchantName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{tx.reference}</p>
                    <p className="text-xs text-gray-500">{tx.upiId}</p>
                  </div>
                </motion.div>
              ))}

              {transactions?.length === 0 && (
                <div className="text-center text-gray-400">
                  No transactions found
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
