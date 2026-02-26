"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic,
  FileText,
  ShieldCheck,
  Heart,
  Activity,
  Stethoscope,
  Pill,
  Calendar,
  Users,
  FileSignature,
  Download,
  Clock,
  BadgeCheck,
  Sparkles,
  Brain,
  UserRound,
  Hospital,
  Syringe,
} from "lucide-react";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Simplified Background - Mobile Optimized */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-600/10 via-transparent to-transparent" />
      </div>

      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 sm:gap-2"
          >
            <Hospital className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Prescripto
              </span>
              <span className="text-white text-sm sm:text-base">AI</span>
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 sm:gap-4 text-xs sm:text-sm font-medium"
          >
            <Link href="/login" className="px-2 sm:px-4 py-1.5 sm:py-2 text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="relative group px-3 sm:px-6 py-1.5 sm:py-2 font-semibold text-white overflow-hidden rounded-lg sm:rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 transition-transform group-hover:scale-105" />
              <span className="relative">Get Started</span>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section - Mobile First */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Transform Patient
              </span>
              <br className="hidden sm:block" />
              <span className="text-white"> Consultations into </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Structured Prescriptions
              </span>
            </h2>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              PrescriptoAI intelligently records, transcribes, and structures medical consultations, 
              reducing documentation time. Maintain focus on patients while we handle the paperwork.
            </p>

            {/* Mobile Optimized CTA Buttons */}
            
          </motion.div>

          {/* Hero Card - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-20" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    <span className="font-semibold text-sm sm:text-base">Digital Prescription</span>
                  </div>
                  <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-500/20 rounded-full">AI-Generated</span>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex gap-2 text-sm">
                    <UserRound className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">Patient: Rohan Shah</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-300">Date: March 15, 2024</span>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Pill className="w-4 h-4" />
                      <span className="text-sm font-medium">Prescribed Medications</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm">
                      <li className="flex justify-between gap-2">
                        <span>Amoxicillin 500mg</span>
                        <span className="text-slate-400">1 tab x 3/day</span>
                      </li>
                      <li className="flex justify-between gap-2">
                        <span>Ibuprofen 400mg</span>
                        <span className="text-slate-400">1 tab x 2/day</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 justify-end items-center">
                    <span className="text-xs text-slate-400">Pending Review</span>
                    <FileSignature className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Section - Mobile Optimized */}
      <section className="relative py-12 sm:py-16 md:py-24 border-y border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Simple 4-Step Workflow
              </span>
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 px-4">
              From consultation to prescription in minutes!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12 md:mt-16">
            {[
              { icon: Mic, title: "Record", desc: "Capture consultation audio", color: "emerald" },
              { icon: Brain, title: "Process", desc: "LLM extracts medical data", color: "blue" },
              { icon: FileSignature, title: "Review", desc: "Doctor validates & approves", color: "pink" },
              { icon: Download, title: "Export", desc: "Print/share PDF", color: "purple" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 group-hover:border-white/20 transition-all">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-${step.color}-500/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0`}>
                    <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${step.color}-400`} />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-center sm:text-left">{step.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctor Control Section - Mobile Optimized */}
      <section className="relative py-12 sm:py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-transparent to-blue-600/20" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12"
          >
            <div className="inline-flex p-3 sm:p-4 bg-pink-500/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
              <ShieldCheck size={32} className="sm:w-12 sm:h-12 text-pink-400" />
            </div>
            
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Doctor Review is Mandatory
            </h3>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              PrescriptoAI enhances clinical efficiency without compromising medical authority. 
              Every prescription requires doctor review and approval before finalization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12">
              {[
                "AI generates draft only",
                "Doctor reviews & edits",
                
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="border-t border-white/10 py-8 sm:py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6 sm:mb-8">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Hospital className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                <span className="font-bold text-base sm:text-lg">PrescriptoAI</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
                AI-powered clinical documentation for modern healthcare practices.
              </p>
            </div>
     
            
          </div>
          
          <div className="pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-slate-400">
            <p>© {new Date().getFullYear()} PrescriptoAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}