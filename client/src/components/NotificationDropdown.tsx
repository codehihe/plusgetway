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
            <Card className="p-4 backdrop-blur-lg bg-gradient-to-br from-black/95 to-black/80 border-orange-500/30 overflow-hidden shadow-2xl">
              <h3 className="text-xl font-bold text-orange-400 mb-6 flex items-center gap-2 border-b border-orange-500/20 pb-3">
                <Bell className="h-5 w-5" />
                Recent Transactions
              </h3>
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2">
                {transactions?.length ? (
                  transactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all duration-300 backdrop-blur-sm shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
                        tx.status === "pending" 
                          ? "bg-gradient-to-r from-orange-950/40 to-orange-900/30 border-orange-500/30 hover:shadow-orange-500/30 hover:from-orange-950/50 hover:to-orange-900/40"
                          : tx.status === "success"
                          ? "bg-gradient-to-r from-green-950/40 to-green-900/30 border-green-500/30 hover:shadow-green-500/30 hover:from-green-950/50 hover:to-green-900/40"
                          : "bg-gradient-to-r from-red-950/40 to-red-900/30 border-red-500/30 hover:shadow-red-500/30 hover:from-red-950/50 hover:to-red-900/40"
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
                    className="text-center py-12 px-4"
                  >
                    <Bell className="h-16 w-16 text-orange-500/20 mx-auto mb-4" />
                    <p className="text-gray-400 text-base font-medium">No recent transactions</p>
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