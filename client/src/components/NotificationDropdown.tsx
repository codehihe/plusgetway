import { Bell, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: number;
  amount: string;
  status: "pending" | "success" | "failed";
  timestamp: string;
  reference: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-6 w-6 text-orange-400" />
          {transactions?.length ? (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center">
              {transactions.length}
            </span>
          ) : null}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 z-50"
          >
            <Card className="p-4 backdrop-blur-lg bg-black/80 border-orange-500/20 overflow-hidden">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Recent Transactions</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions?.length ? (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between p-3 bg-orange-950/30 rounded-lg border border-orange-500/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          ₹{tx.amount}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {tx.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded ${
                          tx.status === "success" 
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No recent transactions</p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
