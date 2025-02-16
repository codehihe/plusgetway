import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import UpiForm from "@/components/UpiForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Power, Ban, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
  const { toast } = useToast();

  const { data: upiIds, isLoading } = useQuery<UpiId[]>({
    queryKey: ["/api/upi"],
  });

  const toggleUpiId = async (id: number) => {
    try {
      await apiRequest("POST", `/api/upi/${id}/toggle`);
      queryClient.invalidateQueries({ queryKey: ["/api/upi"] });
      toast({
        title: "Success",
        description: "UPI ID status updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update UPI ID status",
        variant: "destructive",
      });
    }
  };

  const blockUpiId = async (id: number) => {
    try {
      await apiRequest("POST", `/api/upi/${id}/block`);
      queryClient.invalidateQueries({ queryKey: ["/api/upi"] });
      toast({
        title: "Success",
        description: "UPI ID blocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block UPI ID",
        variant: "destructive",
      });
    }
  };

  const unblockUpiId = async (id: number) => {
    try {
      await apiRequest("POST", `/api/upi/${id}/unblock`);
      queryClient.invalidateQueries({ queryKey: ["/api/upi"] });
      toast({
        title: "Success",
        description: "UPI ID unblocked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock UPI ID",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 text-red-400" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
        </div>

        <Card className="p-6 mb-8 backdrop-blur-lg bg-white/10 border-red-500/20">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Add UPI ID</h2>
          <UpiForm />
        </Card>

        <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Manage UPI IDs</h2>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {upiIds?.map((upi) => (
                  <motion.div
                    key={upi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      upi.blockedAt ? 'bg-red-950/30' : 'bg-white/5'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-red-300">{upi.merchantName}</p>
                      <p className="text-sm text-gray-400">{upi.upiId}</p>
                      {upi.blockedAt && (
                        <p className="text-xs text-red-400 mt-1">
                          Blocked on {new Date(upi.blockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={upi.isActive ? "destructive" : "default"}
                        size="icon"
                        onClick={() => toggleUpiId(upi.id)}
                        disabled={upi.blockedAt !== null}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      {!upi.blockedAt ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => blockUpiId(upi.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => unblockUpiId(upi.id)}
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}