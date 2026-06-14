"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Database, Table } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("../../lib/three-scene"), { ssr: false });

export default function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const handleScrollToDemo = () => {
    const el = document.getElementById("showcase");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen bg-background text-foreground flex flex-col justify-center overflow-hidden border-b border-border"
    >
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-60">
        <ThreeScene />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col justify-between min-h-screen">
        {/* Empty top slot to push header spacing */}
        <div className="h-14"></div>

        {/* Hero Typography */}
        <div className="flex flex-col gap-6 md:gap-10 max-w-4xl">
          <motion.h1
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter"
          >
            <span className="block text-foreground">SCATTERED SCHEMAS.</span>
            <span className="block text-primary">ONE DICTIONARY.</span>
          </motion.h1>

          <motion.p
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="font-sans text-lg sm:text-xl md:text-2xl text-foreground max-w-2xl leading-relaxed"
          >
            DataLens turns scattered databases, unstructured schemas and complex relationships into a professional data dictionary in under 60 seconds.
          </motion.p>

          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mt-4 font-sans tracking-widest text-[11px] font-bold"
          >
            <Link href="/connect">
              <button
                className="bg-primary text-primary-foreground px-8 py-4 border border-primary hover:bg-foreground hover:text-background transition-colors duration-200 w-full sm:w-auto"
              >
                Connect Database
              </button>
            </Link>
            <button
              onClick={handleScrollToDemo}
              className="bg-transparent text-foreground px-8 py-4 border border-foreground hover:bg-foreground hover:text-background transition-colors duration-200"
            >
              See Features
            </button>
          </motion.div>
        </div>

        {/* Floating 3D Document Cards (Hidden on mobile for clarity) */}
        <div className="hidden lg:block absolute inset-y-0 right-10 w-96 pointer-events-none select-none z-20">
          {/* SQL Dump Card */}
          <motion.div
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotateY: 15, rotateX: 10, z: 20 }}
            className="pointer-events-auto absolute top-[15%] right-[20%] w-60 border border-border bg-card p-4 font-mono text-[9px] text-foreground flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Database className="w-3.5 h-3.5 text-primary" />
                SCHEMA_DUMP.SQL
              </span>
              <span className="text-primary">4.2MB</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 bg-primary w-3/4"></div>
              <div className="h-1.5 bg-muted-foreground/50 w-full"></div>
              <div className="h-1.5 bg-muted-foreground/50 w-5/6"></div>
              <div className="h-1.5 bg-muted-foreground/50 w-2/3"></div>
            </div>
            <div className="border-t border-border pt-2 text-right text-[7px] text-primary">
              UNSTRUCTURED RAW DATA
            </div>
          </motion.div>

          {/* Table Card */}
          <motion.div
            style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            animate={{ y: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            whileHover={{ scale: 1.05, rotateY: -15, rotateX: -10, z: 20 }}
            className="pointer-events-auto absolute bottom-[15%] right-[-5%] w-56 border border-primary bg-card p-4 font-mono text-[9px] text-primary flex flex-col gap-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-center border-b border-primary pb-2 text-foreground">
              <span className="flex items-center gap-1.5 font-bold">
                <Table className="w-3.5 h-3.5 text-foreground" />
                USERS_TABLE.CSV
              </span>
              <span>10K ROWS</span>
            </div>
            <div className="border border-dashed border-primary h-20 flex items-center justify-center">
              <span className="text-[7px] tracking-widest uppercase text-foreground font-sans font-bold">
                MAPPING SCHEMA
              </span>
            </div>
            <div className="text-[7px] text-foreground">
              EXTRACTED FOREIGN KEYS
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
