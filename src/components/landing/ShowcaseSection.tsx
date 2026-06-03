"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  FileDown,
  GitBranch,
  MessageSquare,
  Network,
  Sparkles,
} from "lucide-react";

const showcases = [
  {
    id: "quality",
    tag: "Data Quality",
    icon: BarChart3,
    title: "Health scores & structural audits",
    desc: "Get a dynamic database grade, data-type breakdown charts, and an issues log with remediation tips — missing keys, naming issues, and constraint gaps flagged automatically.",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-500",
    preview: (
      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray="220 264" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">B+</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Grade</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: "String", pct: 42, color: "bg-blue-500" },
              { label: "Numeric", pct: 31, color: "bg-emerald-500" },
              { label: "Temporal", pct: 18, color: "bg-amber-500" },
              { label: "Other", pct: 9, color: "bg-zinc-600" },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-14">{t.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${t.color}`} style={{ width: `${t.pct}%` }} />
                </div>
                <span className="text-[10px] text-zinc-400 w-6">{t.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
          <span className="text-amber-500 text-xs mt-0.5">⚠</span>
          <div>
            <p className="text-xs font-medium text-amber-200">3 tables missing primary keys</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Add PK constraints to improve integrity score</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "manual",
    tag: "Reference Manual",
    icon: BookOpen,
    title: "Widescreen documentation portal",
    desc: "Fullscreen reference manual with interactive entity network graphs, live table search, and book-style markdown — shareable at a dedicated document URL.",
    accent: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
    preview: (
      <div className="flex gap-3 h-full min-h-[160px]">
        <div className="w-28 shrink-0 rounded-lg border border-white/10 bg-zinc-900/80 p-2 space-y-1.5">
          <div className="h-5 rounded bg-zinc-800 px-2 flex items-center">
            <span className="text-[8px] text-zinc-500">Search tables…</span>
          </div>
          {["customers", "orders", "products"].map((t, i) => (
            <div
              key={t}
              className={`text-[9px] px-2 py-1 rounded font-mono ${i === 0 ? "bg-primary/20 text-primary" : "text-zinc-500"}`}
            >
              {t}
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-lg border border-white/10 bg-zinc-900/60 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">customers</p>
          <div className="h-px bg-white/10" />
          {["id · uuid · PK", "email · varchar", "created_at · timestamp"].map((col) => (
            <p key={col} className="text-[9px] font-mono text-zinc-400">{col}</p>
          ))}
          <div className="mt-2 flex justify-center">
            <svg viewBox="0 0 120 60" className="w-full max-w-[120px] opacity-60">
              <circle cx="30" cy="30" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
              <circle cx="90" cy="30" r="12" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
              <line x1="42" y1="30" x2="78" y2="30" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3 2" />
              <text x="30" y="33" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">cust</text>
              <text x="90" y="33" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="6">ord</text>
            </svg>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "ai",
    tag: "AI Powered",
    icon: MessageSquare,
    title: "Schema chat & business reports",
    desc: "Ask natural-language questions about your schema. Gemini generates executive overviews, governance insights, and key findings — metadata only, zero raw data exposure.",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    preview: (
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="rounded-2xl rounded-tr-sm bg-primary/20 border border-primary/30 px-3 py-2 max-w-[85%]">
            <p className="text-[10px] text-emerald-100">Which tables reference customers?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-zinc-800/80 border border-white/10 px-3 py-2 flex-1">
            <p className="text-[10px] text-zinc-300 leading-relaxed">
              <span className="text-primary font-semibold">orders</span>,{" "}
              <span className="text-primary font-semibold">subscriptions</span>, and{" "}
              <span className="text-primary font-semibold">support_tickets</span> all have FK → customers.id
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["Executive Report", "Governance", "Key Findings"].map((chip) => (
            <span key={chip} className="text-[8px] px-2 py-0.5 rounded-full border border-white/10 text-zinc-500">
              {chip}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "lineage",
    tag: "Visualization",
    icon: GitBranch,
    title: "ER diagrams & data lineage",
    desc: "Interactive relationship maps with clickable nodes, schema grouping, and lineage views that trace how data flows across your tables and foreign keys.",
    accent: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
    preview: (
      <div className="relative flex items-center justify-center min-h-[160px]">
        <svg viewBox="0 0 200 120" className="w-full max-w-[200px]">
          {[
            { x: 30, y: 60, label: "users", color: "#a78bfa" },
            { x: 100, y: 30, label: "orders", color: "hsl(var(--primary))" },
            { x: 100, y: 90, label: "products", color: "#60a5fa" },
            { x: 170, y: 60, label: "payments", color: "#fbbf24" },
          ].map((node) => (
            <g key={node.label}>
              <rect
                x={node.x - 28} y={node.y - 14} width="56" height="28" rx="6"
                fill="hsl(var(--card))" stroke={node.color} strokeWidth="1.5"
              />
              <text x={node.x} y={node.y + 4} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="8" fontFamily="monospace">
                {node.label}
              </text>
            </g>
          ))}
          <line x1="58" y1="55" x2="72" y2="38" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
          <line x1="58" y1="65" x2="72" y2="82" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
          <line x1="128" y1="38" x2="142" y2="55" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
          <line x1="128" y1="82" x2="142" y2="65" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    ),
  },
  {
    id: "export",
    tag: "Export",
    icon: FileDown,
    title: "Premium dark PDF & multi-format export",
    desc: "Browser-native print engine with opaque dark backgrounds, page-break safeguards, and exports to JSON, Markdown, and full report formats.",
    accent: "from-zinc-500/20 to-zinc-400/10",
    border: "border-zinc-500/20",
    iconColor: "text-zinc-300",
    preview: (
      <div className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-[#0d0d0d] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-[8px] text-zinc-600 ml-2">Data Dictionary Report</span>
          </div>
          <div className="h-1 w-16 bg-primary/60 rounded" />
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-zinc-800 rounded" />
            <div className="h-1.5 w-4/5 bg-zinc-800 rounded" />
            <div className="h-1.5 w-3/5 bg-zinc-800 rounded" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["PDF", "Dict MD", "Dict JSON", "Full Report"].map((fmt) => (
            <span
              key={fmt}
              className="text-[9px] px-2.5 py-1 rounded-md border border-white/10 bg-zinc-800/50 text-zinc-400 font-mono"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "graph",
    tag: "Graph DB",
    icon: Network,
    title: "Neo4j & relational support",
    desc: "Connect PostgreSQL, MySQL, Snowflake, or Neo4j. Explore node labels, edge types, and property structures with dedicated graph visualizations.",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    preview: (
      <div className="flex items-center justify-center min-h-[160px]">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <div className="px-3 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-[9px] font-mono text-cyan-300">
              :Person
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-zinc-600 uppercase tracking-wider">ACTED_IN</span>
              <div className="w-12 h-px bg-zinc-600" />
            </div>
            <div className="px-3 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-[9px] font-mono text-blue-300">
              :Movie
            </div>
          </div>
          <p className="text-[9px] text-zinc-500 font-mono">
            {"(:Person {name}) ──→ (:Movie {title})"}
          </p>
        </div>
      </div>
    ),
  },
];

const ShowcaseSection = () => (
  <section id="showcase" className="py-24 border-t border-border/50 bg-[#050505]">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
          Product Showcase
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          See it in action.
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto">
          From quality audits to AI chat — every capability built for real schema work.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {showcases.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className={`group rounded-2xl border ${item.border} bg-gradient-to-br ${item.accent} backdrop-blur-sm overflow-hidden hover:border-white/20 transition-all duration-300`}
          >
            <div className="p-6 pb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-1.5 rounded-lg bg-black/30 ${item.iconColor}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
            <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-4 min-h-[180px]">
              {item.preview}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ShowcaseSection;
