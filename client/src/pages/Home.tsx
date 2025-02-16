import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import PaymentCard from "@/components/PaymentCard";
import AdminLogin from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const { data: upiIds } = useQuery<UpiId[]>({
    queryKey: ["/api/upi"],
  });

  const activeUpiIds = upiIds?.filter(upi => upi.isActive) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500">UPI Payment</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowAdminLogin(true)}
          >
            <Settings className="h-5 w-5 text-red-400" />
          </Button>
        </div>

        {activeUpiIds.length > 0 ? (
          activeUpiIds.map(upi => (
            <PaymentCard key={upi.id} upi={upi} />
          ))
        ) : (
          <div className="text-center text-gray-400 mt-12">
            <p>No UPI IDs configured.</p>
            <p>Please contact the administrator.</p>
          </div>
        )}
      </div>

      <AdminLogin 
        open={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
    </div>
  );
}
