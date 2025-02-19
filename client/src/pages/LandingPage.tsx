
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { IndianRupee, Shield, Smartphone, Clock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-20"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-red-400 to-orange-500 text-transparent bg-clip-text">
            Secure UPI Payments
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto px-4">
            Experience seamless and secure digital transactions with our advanced UPI payment platform.
            Real-time tracking, instant notifications, and enhanced security measures.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full transform hover:scale-105 transition-all duration-300"
            onClick={() => setLocation("/home")}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 px-4"
        >
          {[
            {
              icon: Shield,
              title: "Secure Transactions",
              description: "Multi-layer security with real-time fraud detection and encryption"
            },
            {
              icon: Clock,
              title: "Instant Payments",
              description: "Lightning-fast transactions with immediate confirmations"
            },
            {
              icon: Smartphone,
              title: "Mobile First",
              description: "Optimized for all devices with a seamless mobile experience"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-950/90 to-blue-900/90 p-6 rounded-xl border border-blue-500/20 backdrop-blur-lg"
            >
              <feature.icon className="h-12 w-12 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 px-4"
        >
          {[
            { value: "10M+", label: "Transactions" },
            { value: "99.9%", label: "Success Rate" },
            { value: "24/7", label: "Support" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 bg-gradient-to-br from-slate-950/90 to-blue-900/90 rounded-xl border border-blue-500/20"
            >
              <h4 className="text-4xl font-bold text-orange-400 mb-2">{stat.value}</h4>
              <p className="text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center bg-gradient-to-br from-slate-950/90 to-blue-900/90 p-8 sm:p-12 rounded-xl border border-blue-500/20 mx-4"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using our secure UPI payment platform.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            onClick={() => setLocation("/home")}
          >
            Start Processing Payments
            <IndianRupee className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
