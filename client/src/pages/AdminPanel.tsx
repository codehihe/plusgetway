
import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import UpiForm from "@/components/UpiForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Power, Ban, Unlock, History, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5 text-red-400" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-red-500">Admin Panel</h1>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-5 w-5 text-red-400" />
          </Button>
          <Link href="/admin/transactions">
            <Button variant="ghost" size="icon">
              <History className="h-5 w-5 text-red-400" />
            </Button>
          </Link>
        </div>

        <Card className="p-6 mb-8 backdrop-blur-lg bg-white/10 border-red-500/20">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Add UPI ID</h2>
          <UpiForm />
        </Card>

        <Card className="p-6 backdrop-blur-lg bg-white/10 border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-400">Manage UPI IDs</h2>
            <span className="text-sm text-gray-400">
              {upiIds?.length || 0} UPI IDs
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 text-red-400 animate-spin" />
            </div>
          ) : upiIds?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>No UPI IDs found</p>
            </div>
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
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteId(upi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
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
