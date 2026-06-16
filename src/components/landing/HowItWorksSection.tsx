"use client";

import { Cable, Brain, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const steps = [
  {
    icon: Cable,
    num: "01",
    title: "Connect",
    desc: "Paste your database URI — PostgreSQL, MySQL, Snowflake, or Neo4j.",
  },
  {
    icon: Brain,
    num: "02",
    title: "Analyze",
    desc: "AI scans your schema, generates docs, and runs quality audits.",
  },
  {
    icon: Search,
    num: "03",
    title: "Explore",
    desc: "Browse ER diagrams, lineage maps, and the reference manual.",
  },
  {
    icon: Sparkles,
    num: "04",
    title: "Act",
    desc: "Chat with AI, export reports, or use MCP tools in your IDE.",
  },
];

const HowItWorksSection = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress based on section position in viewport
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const startTrigger = windowHeight * 0.8; // Start when section is 80% down the viewport
      const endTrigger = windowHeight * 0.2; // End when section is 20% down the viewport

      let progress = 0;
      if (sectionTop < startTrigger && sectionTop > endTrigger - sectionHeight) {
        progress = (startTrigger - sectionTop) / (startTrigger - (endTrigger - sectionHeight));
      } else if (sectionTop <= endTrigger - sectionHeight) {
        progress = 1;
      }

      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
  <section id="how-it-works" ref={sectionRef} className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Workflow
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Four steps. Full intelligence.
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center relative"
          >
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(Math.max((scrollProgress * (steps.length - 1) - i) * 100, 0), 100)}%`
                  }}
                />
              </div>
            )}
            <div className="w-12 h-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto mb-5 relative z-10">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-primary font-medium tracking-widest mb-2">{s.num}</p>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};

export default HowItWorksSection;
