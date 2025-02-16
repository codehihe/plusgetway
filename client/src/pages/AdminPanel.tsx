import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import UpiForm from "@/components/UpiForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Power, Ban, Unlock, History, Trash2, RefreshCw, AlertTriangle, Users, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: upiIds, isLoading, refetch } = useQuery<UpiId[]>({
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

  const deleteUpiId = async () => {
    if (!deleteId) return;
    try {
      await apiRequest("DELETE", `/api/upi/${deleteId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/upi"] });
      toast({
        title: "Success",
        description: "UPI ID deleted successfully",
      });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete UPI ID",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5 text-red-400" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-5 w-5 text-red-400" />
            </Button>
            <Link href="/admin/transactions">
              <Button variant="ghost" size="icon">
                <History className="h-5 w-5 text-red-400" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Active UPIs</p>
                <p className="text-2xl font-bold text-red-400">
                  {upiIds?.filter(u => u.isActive).length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Blocked</p>
                <p className="text-2xl font-bold text-red-400">
                  {upiIds?.filter(u => u.blockedAt).length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Total UPIs</p>
                <p className="text-2xl font-bold text-red-400">
                  {upiIds?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Add UPI Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 mb-8 backdrop-blur-lg bg-white/10 border-red-500/20">
            <h2 className="text-xl font-semibold text-red-400 mb-4">Add UPI ID</h2>
            <UpiForm />
          </Card>
        </motion.div>

        {/* Manage UPI Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-400">Manage UPI IDs</h2>
              <span className="text-sm text-gray-400">
                {upiIds?.length || 0} UPI IDs
              </span>
            </div>

            {isLoading ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 bg-white/5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-red-500/20 rounded w-3/4" />
                      <div className="h-3 bg-red-500/20 rounded w-1/2" />
                      <div className="flex gap-2 justify-end">
                        <div className="h-8 w-8 bg-red-500/20 rounded" />
                        <div className="h-8 w-8 bg-red-500/20 rounded" />
                        <div className="h-8 w-8 bg-red-500/20 rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            ) : upiIds?.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center p-8 text-gray-400"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <AlertTriangle className="h-12 w-12 mb-4 text-red-400" />
                <p className="text-lg font-semibold mb-2">No UPI IDs found</p>
                <p className="text-sm text-center text-gray-500">
                  Add your first UPI ID using the form above
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {upiIds?.map((upi) => (
                    <motion.div
                      key={upi.id}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`rounded-lg overflow-hidden ${
                        upi.blockedAt ? 'bg-red-950/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="p-4">
                        <div className="mb-2">
                          <p className="font-medium text-red-300">{upi.merchantName}</p>
                          <p className="text-sm text-gray-400">{upi.upiId}</p>
                          {upi.blockedAt && (
                            <p className="text-xs text-red-400 mt-1">
                              Blocked on {new Date(upi.blockedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant={upi.isActive ? "destructive" : "default"}
                            size="icon"
                            onClick={() => toggleUpiId(upi.id)}
                            disabled={upi.blockedAt !== null}
                            className="hover:scale-105 transition-transform"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          {!upi.blockedAt ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => blockUpiId(upi.id)}
                              className="hover:scale-105 transition-transform"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => unblockUpiId(upi.id)}
                              className="hover:scale-105 transition-transform"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteId(upi.id)}
                            className="hover:scale-105 transition-transform"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the UPI ID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUpiId}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}