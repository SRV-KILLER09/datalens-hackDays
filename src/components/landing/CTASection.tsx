"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

const CTASection = () => (
  <section className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden p-10 md:p-16 text-center"
      >
        <div className="absolute inset-0 bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Your database, documented in seconds.
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Connect any database and get a living data dictionary, quality audits,
            AI chat, and export-ready reports — all in under 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/connect">
              <Button size="lg" className="h-12 px-8 rounded-full font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                Connect Your Database
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full font-bold">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
