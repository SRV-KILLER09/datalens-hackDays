"use client"
import { Clock, ShieldCheck, Users, Bug } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { icon: Clock, title: "Save hours", desc: "No more manual documentation." },
  { icon: ShieldCheck, title: "Stay compliant", desc: "Automated governance insights." },
  { icon: Users, title: "Empower teams", desc: "Anyone can understand data." },
  { icon: Bug, title: "Prevent errors", desc: "Catch issues before they spread." },
];

const BenefitsSection = () => (
  <section className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16"
      >
        Why DataLens AI.
      </motion.h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <b.icon className="w-5 h-5 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
            <p className="text-xs text-muted-foreground">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
