
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { IndianRupee, Shield, Smartphone, Clock, ArrowRight, ChevronRight, Zap, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const [_, setLocation] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

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
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full text-sm font-medium">
              Secure • Fast • Reliable
            </span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 via-red-400 to-orange-500 text-transparent bg-clip-text">
            Next-Gen UPI Payments
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto px-4">
            Experience the future of digital transactions with our advanced UPI platform.
            Featuring real-time tracking, instant notifications, and bank-grade security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-full transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              onClick={() => setLocation("/home")}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-orange-500/20 hover:border-orange-500/40 text-orange-400 hover:text-orange-300 w-full sm:w-auto"
              onClick={() => setLocation("/docs")}
            >
              View Documentation
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-20 px-4"
        >
          {[
            {
              icon: Shield,
              title: "Bank-Grade Security",
              description: "Multi-layer encryption with real-time fraud detection"
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Instant payments with immediate confirmations"
            },
            {
              icon: Smartphone,
              title: "Mobile Optimized",
              description: "Seamless experience across all devices"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-slate-950/90 to-blue-900/90 p-6 rounded-xl border border-orange-500/20 backdrop-blur-lg hover:border-orange-500/40 transition-all duration-300"
            >
              <feature.icon className="h-12 w-12 text-orange-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12 sm:mb-20 px-4"
        >
          {[
            { value: "10M+", label: "Active Users" },
            { value: "₹100Cr+", label: "Daily Volume" },
            { value: "99.99%", label: "Uptime" },
            { value: "24/7", label: "Support" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 bg-gradient-to-br from-slate-950/90 to-blue-900/90 rounded-xl border border-orange-500/20 hover:border-orange-500/40"
            >
              <h4 className="text-3xl font-bold text-orange-400 mb-2">{stat.value}</h4>
              <p className="text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center bg-gradient-to-br from-slate-950/90 to-blue-900/90 p-8 sm:p-12 rounded-xl border border-orange-500/20 mx-4 mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Why Choose Our Platform?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            {[
              "Real-time payment tracking",
              "Automated reconciliation",
              "Detailed analytics",
              "Multi-platform support",
              "Instant settlement",
              "24/7 customer support"
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="h-5 w-5 text-orange-400" />
                <span className="text-gray-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg px-8 py-6"
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
