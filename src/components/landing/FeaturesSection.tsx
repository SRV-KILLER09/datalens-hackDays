"use client"
import { BookOpen, Brain, Shield, BarChart3, MessageSquare, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: BookOpen, title: "Auto Data Dictionary", desc: "Catalog every table and column automatically." },
  { icon: Brain, title: "AI Descriptions", desc: "Plain-language explanations of your data." },
  { icon: Shield, title: "Sensitive Data Detection", desc: "Flag PII and compliance-sensitive fields." },
  { icon: BarChart3, title: "Quality Monitoring", desc: "Track freshness, completeness, anomalies." },
  { icon: MessageSquare, title: "Natural Language Chat", desc: "Ask questions about your database in English." },
  { icon: RefreshCw, title: "Incremental Sync", desc: "Real-time updates keep docs always current." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Everything you need.
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          From documentation to governance — one platform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card p-8 hover:bg-secondary/30 transition-colors"
          >
            <f.icon className="w-5 h-5 text-primary mb-4" />
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
