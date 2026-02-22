"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic,
  FileText,
  ShieldCheck,
  ClipboardList,
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
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      
      {/* Advanced Medical Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#0f172a_0%,#1e293b_50%,#0f172a_100%)] opacity-30" />
        
        {/* Animated Medical Cross Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 text-8xl text-blue-500/20">+</div>
          <div className="absolute bottom-40 right-20 text-9xl text-emerald-500/20">+</div>
          <div className="absolute top-1/3 right-1/4 text-7xl text-pink-500/20">+</div>
        </div>
      </div>

      {/* Floating Medical Icons Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/5"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              rotate: 0 
            }}
            animate={{ 
              y: [null, -30, 30, -30],
              rotate: 360 
            }}
            transition={{ 
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {i % 3 === 0 ? <Heart size={60} /> : i % 3 === 1 ? <Stethoscope size={60} /> : <Pill size={60} />}
          </motion.div>
        ))}
      </div>

      {/* Header with Glass Effect */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Hospital className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Prescripto
              </span>
              <span className="text-white">AI</span>
            </h1>
            
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 text-sm font-medium"
          >
            <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="relative group px-6 py-2 font-semibold text-white overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Get Started</span>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section with Medical Focus */}
      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            
            
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Transform Patient
              </span>
              <br />
              <span className="text-white">Consultations into</span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Structured Prescriptions
              </span>
            </h2>

            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              PrescriptoAI intelligently records, transcribes, and structures medical consultations, 
              reducing documentation time by <span className="text-emerald-400 font-semibold">75%</span>. 
              Maintain focus on your patients while we handle the paperwork.
            </p>

            

           

            {/* Trust Badges */}
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl blur-3xl opacity-20" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              {/* Mock Prescription Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-6 h-6 text-emerald-400" />
                    <span className="font-semibold">Digital Prescription</span>
                  </div>
                  <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-500/20 rounded-full">AI-Generated Draft</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <UserRound className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Patient: Sarah Johnson</span>
                  </div>
                  <div className="flex gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Date: March 15, 2024</span>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Pill className="w-4 h-4" />
                      <span className="text-sm font-medium">Prescribed Medications</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>Amoxicillin 500mg</span>
                        <span className="text-slate-400">1 tab x 3 times/day</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Ibuprofen 400mg</span>
                        <span className="text-slate-400">1 tab x 2 times/day</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <span className="text-xs text-slate-400">Pending Doctor Review</span>
                    <FileSignature className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="relative py-24 border-y border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Streamlined Clinical Workflow
              </span>
            </h3>
            <p className="text-slate-300 text-lg">
              From consultation to prescription in minutes, not hours
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Mic, title: "Record", desc: "Capture consultation audio", color: "emerald" },
              { icon: Brain, title: "Process", desc: "AI extracts medical data", color: "blue" },
              { icon: FileSignature, title: "Review", desc: "Doctor validates & approves", color: "pink" },
              { icon: Download, title: "Share", desc: "Generate & share PDF", color: "purple" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                )}
                <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all">
                  <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent">
                Comprehensive Medical Suite
              </span>
            </h3>
            <p className="text-slate-300">Everything you need for modern practice management</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Patient Management", desc: "Centralized patient records with medical history", color: "emerald" },
              { icon: Mic, title: "Voice Recording", desc: "High-quality browser-based audio capture", color: "blue" },
              { icon: Brain, title: "AI Transcription", desc: "Whisper-powered medical transcription", color: "purple" },
              { icon: ShieldCheck, title: "Secure Authentication", desc: "JWT with HTTP-only cookies", color: "pink" },
              { icon: ClipboardList, title: "Structured Extraction", desc: "Automatic medical data organization", color: "emerald" },
              { icon: FileSignature, title: "Approval Workflow", desc: "Draft → Review → Approve pipeline", color: "blue" },
              { icon: Download, title: "PDF Generation", desc: "Professional prescription formatting", color: "purple" },
              { icon: Clock, title: "Audit Logging", desc: "Complete approval history tracking", color: "pink" },
              { icon: Activity, title: "Analytics", desc: "Practice insights and metrics", color: "emerald" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-slate-900/50 hover:border-white/20 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctor Control Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 via-transparent to-blue-600/20" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12"
          >
            <div className="inline-flex p-4 bg-pink-500/20 rounded-2xl mb-6">
              <ShieldCheck size={48} className="text-pink-400" />
            </div>
            
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Doctor Control is Mandatory
            </h3>
            
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              PrescriptoAI enhances clinical efficiency without compromising medical authority. 
              Every prescription requires doctor review and approval before finalization.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                "AI generates draft only",
                "Doctor reviews & edits",
                "Digital signature required",
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Transform Your Practice?
              </span>
            </h3>
            <p className="text-slate-300 text-lg mb-10">
              Join thousands of doctors saving time on documentation
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Stethoscope className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 border border-white/20 rounded-xl font-semibold backdrop-blur hover:bg-white/10 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Hospital className="w-6 h-6 text-emerald-400" />
                <span className="font-bold text-lg">PrescriptoAI</span>
              </div>
              <p className="text-sm text-slate-400">
                AI-powered clinical documentation for modern healthcare practices.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security", "Updates"] },
              { title: "Resources", links: ["Documentation", "API", "Blog", "Support"] },
              { title: "Legal", links: ["Privacy", "Terms", "HIPAA", "Cookies"] },
            ].map((col, i) => (
              <div key={i}>
                <h5 className="font-semibold mb-4">{col.title}</h5>
                <ul className="space-y-2 text-sm text-slate-400">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link href="#" className="hover:text-emerald-400 transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} PrescriptoAI. All rights reserved. HIPAA compliant and secure.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}