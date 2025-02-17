import { Bell, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWebSocketUrl } from "@/lib/utils";
import { Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    refetchInterval: 10000, // Refetch every 10 seconds,
    select: (data) => data?.slice(0, 5) // Show only 5 most recent transactions
  });

  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'payment_status' && data.status) {
          // Invalidate and refetch transactions
          queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient]);

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
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center"
            >
              {transactions.length}
            </motion.span>
          ) : null}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 z-50"
          >
            <Card className="p-4 backdrop-blur-lg bg-black/90 border-orange-500/20 overflow-hidden shadow-xl">
              <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Transactions
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                {transactions?.length ? (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all duration-200 backdrop-blur-sm shadow-lg",
                        tx.status === "pending" 
                          ? "bg-orange-950/30 border-orange-500/20 hover:bg-orange-950/40 hover:scale-102 hover:shadow-orange-500/20"
                          : tx.status === "success"
                          ? "bg-green-950/30 border-green-500/20 hover:bg-green-950/40 hover:scale-102 hover:shadow-green-500/20"
                          : "bg-red-950/30 border-red-500/20 hover:bg-red-950/40 hover:scale-102 hover:shadow-red-500/20"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-white flex items-center gap-2">
                          ₹{tx.amount}
                          {tx.status === "success" && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              Approved
                            </span>
                          )}
                          {tx.status === "failed" && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                              Declined
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ref: {tx.reference}
                        </p>
                      </div>
                      {tx.status === "pending" && (
                        <div className="flex gap-2">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium"
                          >
                            Pending Approval
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 text-sm">No recent transactions</p>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}