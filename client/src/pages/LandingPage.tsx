import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { IndianRupee, Shield, Smartphone, Clock, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-red-400 to-orange-500 text-transparent bg-clip-text">
            Secure UPI Payments
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience seamless and secure digital transactions with our advanced UPI payment platform.
            Real-time tracking, instant notifications, and enhanced security measures.
          </p>
          <Link href="/home">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg px-8 py-6 rounded-full transform hover:scale-105 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
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
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
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
          className="text-center bg-gradient-to-br from-slate-950/90 to-blue-900/90 p-12 rounded-xl border border-blue-500/20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using our secure UPI payment platform.
          </p>
          <Link href="/home">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              Start Processing Payments
              <IndianRupee className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
