"use client"
import { Cable, Brain, Search } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: Cable, num: "01", title: "Connect", desc: "Link your database in minutes." },
  { icon: Brain, num: "02", title: "Analyze", desc: "AI documents your entire schema." },
  { icon: Search, num: "03", title: "Explore", desc: "Ask questions, get answers." },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16"
      >
        Three steps. That's it.
      </motion.h2>

      <div className="grid md:grid-cols-3 gap-12 max-w-3xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
            className="text-center"
          >
            <div className="w-12 h-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-primary font-medium tracking-widest mb-2">{s.num}</p>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
