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
    title: "Column-Level Lineage",
    desc: "Trace how columns connect across tables — see what breaks if you change a field.",
  },
  {
    icon: MessageSquare,
    title: "Text-to-SQL Studio",
    desc: "Ask in plain English, get SQL, and run read-only queries with table or chart views.",
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
  <section id="features" className="py-24 bg-white dark:bg-background">
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

      <div className="relative bg-gradient-to-br from-card via-card to-secondary/20 rounded-2xl border border-border/50 shadow-xl p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
        <div className="relative grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border/50 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300 shadow-sm">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesSection;
