import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminLogin({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/admin/login", { pin });
      setLocation("/admin");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid PIN",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-lg bg-white/10 border-red-500/20">
        <DialogHeader>
          <DialogTitle className="text-red-400">Admin Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="bg-white/5 border-red-500/20 text-white"
          />
          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
            Login
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
