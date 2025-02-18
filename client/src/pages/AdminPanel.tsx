import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UpiId } from "@shared/schema";
import UpiForm from "@/components/UpiForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  ArrowLeft, Power, Ban, Unlock, History, Trash2, RefreshCw,
  AlertTriangle, Users, Shield, Search, TrendingUp, ArrowUpRight
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export default function AdminPanel() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: upiIds, isLoading, refetch } = useQuery<UpiId[]>({
    queryKey: ["/api/upi"],
  });

  const filteredUpiIds = upiIds?.filter(upi => {
    const searchLower = searchTerm.toLowerCase();
    return (
      upi.merchantName.toLowerCase().includes(searchLower) ||
      upi.upiId.toLowerCase().includes(searchLower) ||
      upi.merchantCategory?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    active: upiIds?.filter(u => u.isActive && !u.deletedAt).length || 0,
    blocked: upiIds?.filter(u => u.blockedAt).length || 0,
    total: upiIds?.length || 0,
    pending: upiIds?.filter(u => !u.blockedAt && !u.deletedAt && !u.isActive).length || 0
  };


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
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-red-500">Admin Dashboard</h1>
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={async () => {
                await apiRequest('POST', '/api/logout');
                setLocation('/');
              }}
            >
              <LogOut className="h-5 w-5 text-red-400" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20 hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Users className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active UPIs</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-red-400">{stats.active}</p>
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20 hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Ban className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Blocked</p>
                <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20 hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-red-400">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 backdrop-blur-lg bg-white/10 border-red-500/20 hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Shield className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total UPIs</p>
                <p className="text-2xl font-bold text-red-400">{stats.total}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by merchant name, UPI ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-red-500/20 text-white placeholder:text-gray-400"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-400">Manage UPI IDs</h2>
              <span className="text-sm text-gray-400">
                {filteredUpiIds?.length || 0} UPI IDs
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
            ) : filteredUpiIds?.length === 0 ? (
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
                  {filteredUpiIds?.map((upi) => (
                    <motion.div
                      key={upi.id}
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`rounded-lg overflow-hidden ${
                        upi.deletedAt
                          ? 'bg-gray-950/30 opacity-50'
                          : upi.blockedAt
                            ? 'bg-red-950/30'
                            : 'bg-white/5'
                      }`}
                    >
                      <div className="p-4">
                        <div className="mb-4">
                          <p className="font-medium text-red-300">{upi.merchantName}</p>
                          <p className="text-sm text-gray-400">{upi.upiId}</p>
                          {upi.blockedAt && (
                            <p className="text-xs text-red-400 mt-1">
                              Blocked on {new Date(upi.blockedAt).toLocaleDateString()}
                            </p>
                          )}
                          {upi.deletedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Deleted on {new Date(upi.deletedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant={upi.isActive ? "destructive" : "default"}
                            size="icon"
                            onClick={() => toggleUpiId(upi.id)}
                            disabled={upi.blockedAt !== null || upi.deletedAt !== null}
                            className="hover:scale-105 transition-transform"
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          {!upi.blockedAt ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => blockUpiId(upi.id)}
                              disabled={upi.deletedAt !== null}
                              className="hover:scale-105 transition-transform"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => unblockUpiId(upi.id)}
                              disabled={upi.deletedAt !== null}
                              className="hover:scale-105 transition-transform"
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteId(upi.id)}
                            disabled={upi.deletedAt !== null}
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

        <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="bg-gray-900 border border-red-500/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. The UPI ID will be permanently marked as deleted
                and hidden from users, but will remain visible in the admin panel for audit purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 text-gray-300 hover:bg-gray-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteUpiId}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}