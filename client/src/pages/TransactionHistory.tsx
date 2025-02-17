import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/utils/api"; // Assuming this function exists for API calls

export default function TransactionHistory() {
  const { data: transactions, isLoading, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const formatAmount = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
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

  const handleVerifyTransaction = async (reference: string, status: "success" | "failed") => {
    try {
      await apiRequest("POST", `/api/transactions/${reference}/verify`, { status });
      refetch();
    } catch (error) {
      console.error("Error verifying transaction:", error);
      // Add error handling as needed (e.g., display an error message to the user)
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
            <div className="text-center text-gray-400">Loading transactions...</div>
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
                    {tx.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleVerifyTransaction(tx.reference, "success")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVerifyTransaction(tx.reference, "failed")}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {transactions?.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No transactions found</p>
                  <p className="text-gray-500 text-sm">
                    Transactions will appear here once payments are made
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}