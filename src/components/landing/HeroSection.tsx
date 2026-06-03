"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import RotatingEarth from "./wireframe-dotted-globe";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-[#050505]">
      {/* Background Globe */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="relative"
        >
          {/* Subtle Glow behind the globe */}
          <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full" />
          <RotatingEarth width={900} height={900} />
        </motion.div>
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase mb-6">
            Intelligent Data Dictionary Agent
          </p>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] mb-8 text-white">
            Understand your
            <br />
            data <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">instantly.</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed">
            Auto-document schemas, audit data quality, chat with AI, export reports,
            and integrate with Cursor — all from one intelligent data dictionary.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/connect">
              <Button size="lg" className="h-14 px-10 rounded-full font-bold text-base shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                Connect Database
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#showcase">
              <Button size="lg" variant="ghost" className="h-14 px-10 rounded-full font-bold text-base text-white hover:bg-white/5">
                See Features
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Minimal Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-2xl p-8 shadow-2xl relative">
             {/* Decorative Dots */}
            <div className="flex gap-2 mb-8">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Health Grade", value: "B+" },
                { label: "AI Enriched", value: "100%" },
                { label: "Export Formats", value: "4" },
                { label: "Time to Insight", value: "<30s" },
              ].map((s) => (
                <div key={s.label} className="text-left border-l border-white/10 pl-6">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">{s.label}</p>
                  <p className="text-3xl font-bold text-white tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;