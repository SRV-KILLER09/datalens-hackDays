"use client";

import {
  BookOpen,
  Brain,
  FileDown,
  GitBranch,
  MessageSquare,
  Network,
  Plug,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "Auto Data Dictionary",
    desc: "Catalog every table, column, key, and index automatically.",
  },
  {
    icon: Brain,
    title: "AI Descriptions",
    desc: "Gemini-powered plain-language schema explanations.",
  },
  {
    icon: BarChart3,
    title: "Quality Health Score",
    desc: "Database grade, type profiles, and structural audit issues.",
  },
  {
    icon: MessageSquare,
    title: "Schema Chat & Reports",
    desc: "Ask questions and generate executive business reports.",
  },
  {
    icon: GitBranch,
    title: "ER Diagrams & Lineage",
    desc: "Interactive relationship maps and data flow visualization.",
  },
  {
    icon: BookOpen,
    title: "Reference Manual Portal",
    desc: "Fullscreen docs with entity graphs and live table search.",
  },
  {
    icon: FileDown,
    title: "Dark PDF & Exports",
    desc: "Print-ready PDF plus JSON and Markdown export formats.",
  },
  {
    icon: Network,
    title: "Neo4j Graph Support",
    desc: "Explore node labels, edges, and graph relationships.",
  },
  {
    icon: Plug,
    title: "Cursor & VS Code MCP",
    desc: "Schema intelligence directly in your IDE via MCP tools.",
  },
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
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Capabilities
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Everything you need.
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          From documentation to governance, quality audits to IDE integration — one platform.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="bg-card p-8 hover:bg-secondary/30 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
