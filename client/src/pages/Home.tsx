import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import PaymentCard from "@/components/PaymentCard";
import AdminLogin from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, Shield, Smartphone, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const { data: upiIds, isLoading } = useQuery<UpiId[]>({
    queryKey: ["/api/upi"],
  });

  const activeUpiIds = upiIds?.filter(upi => upi.isActive && !upi.deletedAt) || [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-red-500"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Secure UPI Payment
          </motion.h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowAdminLogin(true)}
          >
            <Settings className="h-5 w-5 text-red-400" />
          </Button>
        </div>

        {/* Feature Highlights Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4 backdrop-blur-lg bg-white/5 border-red-500/20">
            <Shield className="h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-lg font-semibold text-red-400">Secure</h3>
            <p className="text-sm text-gray-400">End-to-end encrypted transactions with advanced security measures</p>
            <ul className="text-xs text-gray-500 mt-2 list-disc list-inside">
              <li>SSL Encryption</li>
              <li>Real-time monitoring</li>
              <li>Fraud protection</li>
            </ul>
          </Card>
          <Card className="p-4 backdrop-blur-lg bg-white/5 border-red-500/20">
            <Smartphone className="h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-lg font-semibold text-red-400">Convenient</h3>
            <p className="text-sm text-gray-400">Pay using any UPI app</p>
          </Card>
          <Card className="p-4 backdrop-blur-lg bg-white/5 border-red-500/20">
            <Clock className="h-8 w-8 text-red-400 mb-2" />
            <h3 className="text-lg font-semibold text-red-400">Instant</h3>
            <p className="text-sm text-gray-400">Real-time payment verification</p>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-8 backdrop-blur-lg bg-white/10 border-red-500/20">
                <div className="flex flex-col items-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
                  </motion.div>
                  <p className="text-gray-400">Loading payment options...</p>
                </div>
              </Card>
            </motion.div>
          ) : activeUpiIds.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h2 className="text-xl font-semibold text-red-400 mb-2">Available Payment Methods</h2>
                <p className="text-gray-400 text-sm">Select a payment method below to proceed with your transaction</p>
              </motion.div>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
              >
                {activeUpiIds.map(upi => (
                  <motion.div key={upi.id} variants={item}>
                    <PaymentCard upi={upi} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              key="no-upi"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="p-8 backdrop-blur-lg bg-white/10 border-red-500/20">
                <div className="flex flex-col items-center text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-red-400 mb-2">
                      No Payment Methods Available
                    </h2>
                    <p className="text-gray-400">
                      No active UPI IDs are currently configured.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Please contact the administrator to set up payment methods.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 border-red-500/20 text-red-400"
                    onClick={() => setShowAdminLogin(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Login
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust and Security Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 backdrop-blur-lg bg-white/5 border-red-500/20 rounded-lg"
        >
          <h2 className="text-xl font-semibold text-red-400 mb-4">Trusted & Secure</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-300">Advanced Security</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Your transactions are protected with industry-standard encryption
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Smartphone className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-300">Multiple UPI Apps</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Compatible with all major UPI payment apps including Google Pay, PhonePe, and Paytm
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-300">24/7 Support</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Our team is available round the clock to assist you with any payment issues
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AdminLogin 
        open={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
      />
    </div>
  );
}