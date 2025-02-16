import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import PaymentCard from "@/components/PaymentCard";
import AdminLogin from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, Shield, Smartphone, Clock, ChevronRight, CheckCircle, Lock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950 via-gray-900 to-black">
      {/* Hero Section */}
      <div className="w-full px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-300 via-red-500 to-red-700 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          >
            Secure UPI Payments
          </motion.h1>
          <motion.div
            className="space-y-4 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-lg md:text-xl text-gray-400">
              Experience fast, secure, and hassle-free digital payments
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="bg-red-500/10 text-red-400">
                <Shield className="w-4 h-4 mr-1" /> Bank Grade Security
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-400">
                <Zap className="w-4 h-4 mr-1" /> Instant Transfers
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-400">
                <CheckCircle className="w-4 h-4 mr-1" /> Zero Transaction Fees
              </Badge>
            </div>
          </motion.div>

          {/* Website Banner */}
          <motion.div
            className="w-full max-w-4xl mx-auto mb-12 p-8 rounded-2xl bg-gradient-to-r from-red-950/90 to-gray-900/90 border border-red-500/20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-red-300 via-purple-400 to-red-500 animate-gradient bg-clip-text text-transparent bg-[length:200%_auto]">
                Plusenode Payment
              </span>
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto">
              Your trusted platform for seamless digital payments. Experience secure, instant, and hassle-free transactions with India's leading UPI payment system.
            </p>
          </motion.div>

          {/* Statistics Section */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <h3 className="text-2xl font-bold text-red-400">10M+</h3>
              <p className="text-gray-400 text-sm">Daily Transactions</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <h3 className="text-2xl font-bold text-red-400">50K+</h3>
              <p className="text-gray-400 text-sm">Active Merchants</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <h3 className="text-2xl font-bold text-red-400">99.9%</h3>
              <p className="text-gray-400 text-sm">Success Rate</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <h3 className="text-2xl font-bold text-red-400">24/7</h3>
              <p className="text-gray-400 text-sm">Support</p>
            </div>
          </motion.div>

          {/* Payment Apps Section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-red-500/20 p-6 flex flex-col items-center space-y-4 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/10">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <SiGooglepay className="w-16 h-16 text-white/80" />
              </motion.div>
              <h3 className="text-lg font-medium text-red-400">Google Pay</h3>
              <p className="text-sm text-gray-400 text-center">Quick and secure payments through Google Pay</p>
            </Card>
            <Card className="bg-white/5 border-red-500/20 p-6 flex flex-col items-center space-y-4">
              <SiPhonepe className="w-16 h-16 text-white/80" />
              <h3 className="text-lg font-medium text-red-400">PhonePe</h3>
              <p className="text-sm text-gray-400 text-center">India's most trusted payment platform</p>
            </Card>
            <Card className="bg-white/5 border-red-500/20 p-6 flex flex-col items-center space-y-4">
              <SiPaytm className="w-16 h-16 text-white/80" />
              <h3 className="text-lg font-medium text-red-400">Paytm</h3>
              <p className="text-sm text-gray-400 text-center">Seamless payments with Paytm wallet</p>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* New Section: Payment Process Steps */}
      <motion.div 
        className="max-w-6xl mx-auto px-4 mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-center text-red-400 mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative p-6 bg-white/5 rounded-lg border border-red-500/20">
            <div className="absolute -top-4 left-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-red-400 mt-4 mb-3">Enter Amount</h3>
            <p className="text-gray-400">Simply enter the payment amount you wish to transfer</p>
          </div>
          <div className="relative p-6 bg-white/5 rounded-lg border border-red-500/20">
            <div className="absolute -top-4 left-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-red-400 mt-4 mb-3">Scan QR Code</h3>
            <p className="text-gray-400">Use any UPI app to scan the generated QR code</p>
          </div>
          <div className="relative p-6 bg-white/5 rounded-lg border border-red-500/20">
            <div className="absolute -top-4 left-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-red-400 mt-4 mb-3">Confirm Payment</h3>
            <p className="text-gray-400">Verify and confirm the payment in your UPI app</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 pb-12">

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Card className="p-6 backdrop-blur-lg bg-white/5 border-red-500/20 hover:bg-white/10 transition-all duration-300">
            <Shield className="h-8 w-8 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Bank-Grade Security</h3>
            <p className="text-gray-400 mb-4">End-to-end encrypted transactions with advanced security measures</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                256-bit SSL Encryption
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Real-time Monitoring
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Fraud Protection
              </li>
            </ul>
          </Card>

          <Card className="p-6 backdrop-blur-lg bg-white/5 border-red-500/20 hover:bg-white/10 transition-all duration-300">
            <Zap className="h-8 w-8 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-red-400 mb-2">Lightning Fast</h3>
            <p className="text-gray-400 mb-4">Process payments instantly with real-time verification</p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instant Transfers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Quick QR Scanning
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                24/7 Availability
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* Payment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-red-400 mb-2">Make a Payment</h2>
              <p className="text-gray-400 text-sm">Choose your preferred payment method</p>
            </div>
          </div>

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
                      className="mt-4 border-red-500/20 text-red-400 hover:bg-red-500/10"
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
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          <Card className="bg-white/5 border-red-500/20 p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
            <motion.h3 
              className="text-4xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              99.9%
            </motion.h3>
            <p className="text-gray-400 mt-3 font-medium">Uptime Guarantee</p>
          </Card>
          <Card className="bg-white/5 border-red-500/20 p-6 text-center">
            <h3 className="text-3xl font-bold text-red-400">10M+</h3>
            <p className="text-gray-400 mt-2">Transactions</p>
          </Card>
          <Card className="bg-white/5 border-red-500/20 p-6 text-center">
            <h3 className="text-3xl font-bold text-red-400">1M+</h3>
            <p className="text-gray-400 mt-2">Happy Users</p>
          </Card>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-red-400 mb-6">Why Choose Us</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Lock className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-300">Secure Platform</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Multi-layer security with real-time fraud detection
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-300">Instant Payments</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Lightning-fast transactions with immediate confirmation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Smartphone className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-300">Universal Compatibility</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Works with all major UPI apps and providers
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-300">24/7 Support</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Round-the-clock assistance for all your payment needs
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* New Section: Trust Badges */}
        <motion.div
          className="max-w-6xl mx-auto px-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white/5 rounded-lg border border-red-500/20 text-center">
              <motion.div
                className="text-4xl font-bold text-red-400 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                100%
              </motion.div>
              <p className="text-gray-400">Secure Transactions</p>
            </div>
            <div className="p-6 bg-white/5 rounded-lg border border-red-500/20 text-center">
              <motion.div
                className="text-4xl font-bold text-red-400 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                24/7
              </motion.div>
              <p className="text-gray-400">Customer Support</p>
            </div>
            <div className="p-6 bg-white/5 rounded-lg border border-red-500/20 text-center">
              <motion.div
                className="text-4xl font-bold text-red-400 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                0%
              </motion.div>
              <p className="text-gray-400">Transaction Fees</p>
            </div>
            <div className="p-6 bg-white/5 rounded-lg border border-red-500/20 text-center">
              <motion.div
                className="text-4xl font-bold text-red-400 mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                1M+
              </motion.div>
              <p className="text-gray-400">Happy Customers</p>
            </div>
          </div>
        </motion.div>

        {/* Admin Access Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-8 border-t border-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-red-300">Admin Access</h3>
              <p className="text-sm text-gray-400">Secure administrative controls</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowAdminLogin(true)}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Login
            </Button>
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