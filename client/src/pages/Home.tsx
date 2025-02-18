import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UpiId } from "@shared/schema";
import PaymentCard from "@/components/PaymentCard";
import AdminLogin from "@/components/AdminLogin";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, Shield, Smartphone, Clock, Zap, CheckCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiGooglepay, SiPhonepe, SiPaytm } from "react-icons/si";
import NotificationDropdown from "@/components/NotificationDropdown";

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950 via-red-900 to-black">
      <div className="w-full px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          {/* Add Notification Icon */}
          <div className="absolute top-4 right-4">
            <NotificationDropdown />
          </div>

          <div className="text-center">
            {/* Hero Section with updated colors */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-300 via-red-400 to-orange-500 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.6 }}
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
                {[
                  { icon: Shield, text: "Bank Grade Security" },
                  { icon: Zap, text: "Instant Transfers" },
                  { icon: CheckCircle, text: "Zero Transaction Fees" }
                ].map((badge, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.1, y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-400">
                      <badge.icon className="w-4 h-4 mr-1" /> {badge.text}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Payment Section - Enhanced and Moved Up */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 mb-16"
            >
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-300 via-red-400 to-orange-500 bg-clip-text text-transparent mb-4">
                  Make a Payment
                </h2>
                <p className="text-xl text-gray-400">Choose your preferred payment method</p>

                {/* Payment App Icons */}
                <motion.div
                  className="flex flex-wrap justify-center gap-6 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    { Icon: SiGooglepay, name: "Google Pay" },
                    { Icon: SiPhonepe, name: "PhonePe" },
                    { Icon: SiPaytm, name: "Paytm" }
                  ].map((app, index) => (
                    <motion.div
                      key={index}
                      whileHover={{
                        scale: 1.1,
                        rotate: index % 2 === 0 ? 5 : -5,
                        y: -5
                      }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="p-4 bg-white/5 rounded-2xl border-2 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                        <app.Icon className="w-16 h-16 text-white" />
                      </div>
                      <span className="text-sm text-gray-400">{app.name}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-8 backdrop-blur-lg bg-white/10 border-orange-500/20 rounded-[2rem]">
                      <div className="flex flex-col items-center space-y-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="relative"
                        >
                          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full" />
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Smartphone className="w-6 h-6 text-orange-400" />
                          </motion.div>
                        </motion.div>
                        <p className="text-lg text-gray-400 animate-pulse">Loading payment options...</p>
                      </div>
                    </Card>
                  </motion.div>
                ) : activeUpiIds.length > 0 ? (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                  >
                    {activeUpiIds.map(upi => (
                      <motion.div
                        key={upi.id}
                        variants={item}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
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
                    <Card className="p-8 backdrop-blur-lg bg-white/10 border-orange-500/20 rounded-[2rem]">
                      <div className="flex flex-col items-center text-center space-y-6">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <AlertCircle className="w-20 h-20 text-orange-400" />
                        </motion.div>
                        <div>
                          <h2 className="text-2xl font-bold text-orange-400 mb-3">
                            No Payment Methods Available
                          </h2>
                          <p className="text-gray-400 text-lg">
                            No active UPI IDs are currently configured.
                          </p>
                          <p className="text-gray-500 text-base mt-2">
                            Please contact the administrator to set up payment methods.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="mt-6 border-orange-500/20 text-orange-400 hover:bg-orange-500/10 rounded-xl px-6 py-3 text-lg"
                          onClick={() => setShowAdminLogin(true)}
                        >
                          <motion.div
                            className="flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Settings className="w-5 h-5" />
                            Admin Login
                          </motion.div>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>


            {/* Trust Badges Section */}
            <motion.div
              className="max-w-6xl mx-auto px-4 py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { value: "100%", label: "Secure Transactions" },
                  { value: "24/7", label: "Customer Support" },
                  { value: "0%", label: "Transaction Fees" },
                  { value: "1M+", label: "Happy Customers" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="p-6 bg-white/5 rounded-[2rem] border-2 border-orange-500/20 text-center transform hover:scale-105 transition-all duration-300 hover:bg-white/10 hover:border-orange-500/40 shadow-lg hover:shadow-orange-500/20"
                    whileHover={{ y: -5 }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    <motion.div
                      className="text-4xl font-bold bg-gradient-to-r from-orange-300 to-red-400 bg-clip-text text-transparent mb-2"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Website Banner */}
            <motion.div
              className="w-full max-w-4xl mx-auto mt-12 p-8 rounded-2xl bg-gradient-to-r from-orange-950/90 to-red-900/90 border border-orange-500/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-center mb-4 animate-pulse"
                animate={{
                  background: ["linear-gradient(to right, #FFA726, #FF5722, #FFA726)"],
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Plusenode Payment
              </motion.h2>
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
                <h3 className="text-2xl font-bold text-orange-400">10M+</h3>
                <p className="text-gray-400 text-sm">Daily Transactions</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h3 className="text-2xl font-bold text-orange-400">50K+</h3>
                <p className="text-gray-400 text-sm">Active Merchants</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h3 className="text-2xl font-bold text-orange-400">99.9%</h3>
                <p className="text-gray-400 text-sm">Success Rate</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h3 className="text-2xl font-bold text-orange-400">24/7</h3>
                <p className="text-gray-400 text-sm">Support</p>
              </div>
            </motion.div>

            {/* Payment Apps Section  - REPLACED */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-white/5 border-orange-500/20 p-6 flex flex-col items-center space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="w-8 h-8 text-orange-400" />
                    <div>
                      <h3 className="text-lg font-medium text-orange-400">24/7 Support</h3>
                      <p className="text-sm text-gray-400">Round-the-clock assistance for all your payment needs</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/5 border-orange-500/20 p-6 flex flex-col items-center space-y-4 mt-6"> {/* Added mt-6 for spacing */}
                  <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-orange-400" />
                    <div>
                      <h3 className="text-lg font-medium text-orange-400">Super Secure</h3>
                      <p className="text-sm text-gray-400">Bank-grade protection for your money</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/5 border-orange-500/20 p-6 flex flex-col items-center space-y-4 mt-6"> {/* Added mt-6 for spacing */}
                  <div className="flex items-center gap-4">
                    <Zap className="w-8 h-8 text-orange-400" />
                    <div>
                      <h3 className="text-lg font-medium text-orange-400">Lightning Fast</h3>
                      <p className="text-sm text-gray-400">Instant payments at your fingertips</p>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>

            {/* New Section: Payment Process Steps */}
            <motion.div
              className="max-w-6xl mx-auto px-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-center text-orange-400 mb-12">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="relative p-6 bg-white/5 rounded-lg border border-orange-500/20">
                  <div className="absolute -top-4 left-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-orange-400 mt-4 mb-3">Enter Amount</h3>
                  <p className="text-gray-400">Simply enter the payment amount you wish to transfer</p>
                </div>
                <div className="relative p-6 bg-white/5 rounded-lg border border-orange-500/20">
                  <div className="absolute -top-4 left-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-orange-400 mt-4 mb-3">Scan QR Code</h3>
                  <p className="text-gray-400">Use any UPI app to scan the generated QR code</p>
                </div>
                <div className="relative p-6 bg-white/5 rounded-lg border border-orange-500/20">
                  <div className="absolute -top-4 left-4 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-orange-400 mt-4 mb-3">Confirm Payment</h3>
                  <p className="text-gray-400">Verify and confirm the payment in your UPI app</p>
                </div>
              </div>
            </motion.div>

            <div className="max-w-lg mx-auto px-4 pb-12">

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-orange-400 mb-6">Why Choose Us</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Lock className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-orange-300">Secure Platform</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Multi-layer security with real-time fraud detection
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-orange-300">Instant Payments</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Lightning-fast transactions with immediate confirmation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Smartphone className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-orange-300">Universal Compatibility</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Works with all major UPI apps and providers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-orange-300">24/7 Support</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Round-the-clock assistance for all your payment needs
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>


              {/* Features Grid - More Cartoonish */}
              <motion.div
                className="max-w-4xl mx-auto px-4 mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: Shield,
                      title: "Super Secure",
                      description: "Bank-grade protection for your money",
                      color: "orange"
                    },
                    {
                      icon: Zap,
                      title: "Lightning Fast",
                      description: "Instant payments at your fingertips",
                      color: "red"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className={`p-8 rounded-[2rem] bg-gradient-to-br from-${feature.color}-950/90 to-${feature.color}-900/50 border-2 border-${feature.color}-500/20 hover:border-${feature.color}-500/40 transform hover:scale-105 transition-all duration-300`}
                      whileHover={{ y: -5 }}
                      initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <motion.div
                        className={`w-16 h-16 rounded-2xl bg-${feature.color}-500/20 p-4 mb-4`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8, type: "spring" }}
                      >
                        <feature.icon className={`w-full h-full text-${feature.color}-400`} />
                      </motion.div>
                      <h3 className={`text-2xl font-bold text-${feature.color}-400 mb-2`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-400">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Admin Access Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-16 pt-8 border-t border-orange-500/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-orange-300">Admin Access</h3>
                    <p className="text-sm text-gray-400">Secure administrative controls</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminLogin(true)}
                    className="border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Login
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <AdminLogin
        open={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
      />
    </div>
  );
}