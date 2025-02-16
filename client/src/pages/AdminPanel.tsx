import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import UpiForm from "@/components/UpiForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Power } from "lucide-react";

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
              {upiIds?.map((upi) => (
                <div key={upi.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="font-medium text-red-300">{upi.merchantName}</p>
                    <p className="text-sm text-gray-400">{upi.upiId}</p>
                  </div>
                  <Button
                    variant={upi.isActive ? "destructive" : "default"}
                    size="icon"
                    onClick={() => toggleUpiId(upi.id)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
