"use client";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  Table2,
  RefreshCw,
  Database,
  Loader2,
  ArrowRight,
  BarChart3,
  GitBranch,
  CodeXml,
  Sparkles,
  ChevronRight,
  BookOpen,
  MessageSquare,
  FileDown,
  Network,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/src/components/landing/auth";
import { getDashboardStats } from "@/src/actions/db";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function DashboardOverview() {
  const { data: session, isPending: authLoading } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [documentedTables, setDocumentedTables] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastConnId, setLastConnId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("last_connection_id");
    if (storedId) setLastConnId(storedId);
  }, []);

  useEffect(() => {
    async function loadStats() {
      if (authLoading) return;

      if (session?.user?.id) {
        const result = await getDashboardStats(session.user.id);
        if (result.success && result.data) {
          setConnections(result.data.connections);
          setDocumentedTables(result.data.documentedTables);
          setProviderCount(result.data.providerCount);
          if (!localStorage.getItem("last_connection_id") && result.data.connections.length > 0) {
            setLastConnId(result.data.connections[0].id);
          }
        }
      }
      setIsLoading(false);
    }
    loadStats();
  }, [session, authLoading]);

  const tablesHref = lastConnId ? `/dashboard/tables/${lastConnId}` : "/dashboard/tables";
  const documentHref = lastConnId ? `/dashboard/tables/${lastConnId}/document` : "/dashboard/tables";
  const firstName = session?.user?.name?.split(" ")[0] || "Explorer";

  const stats = [
    {
      label: "Active sources",
      value: isLoading ? "—" : connections.length,
      icon: Database,
      hint: connections.length > 0 ? "connected" : "none yet",
    },
    {
      label: "AI docs",
      value: isLoading ? "—" : documentedTables,
      icon: BookOpen,
      hint: documentedTables > 0 ? "tables documented" : "sync to generate",
    },
    {
      label: "Providers",
      value: isLoading ? "—" : providerCount,
      icon: Network,
      hint: providerCount > 0 ? "unique types" : "pg, mysql, neo4j…",
    },
    {
      label: "Exports",
      value: "4",
      icon: FileDown,
      hint: "pdf · md · json",
    },
  ];

  const quickActions = [
    {
      title: "Explore Schema",
      desc: "Tables, columns, and AI-generated docs",
      icon: Table2,
      href: tablesHref,
      accent: "group-hover:text-blue-400",
      glow: "group-hover:shadow-blue-500/10",
    },
    {
      title: "Quality Audit",
      desc: "Health scores and structural issues",
      icon: BarChart3,
      href: "/dashboard/quality",
      accent: "group-hover:text-amber-400",
      glow: "group-hover:shadow-amber-500/10",
    },
    {
      title: "Data Lineage",
      desc: "ER diagrams and relationship maps",
      icon: GitBranch,
      href: "/dashboard/lineage",
      accent: "group-hover:text-purple-400",
      glow: "group-hover:shadow-purple-500/10",
    },
    {
      title: "Query Runner",
      desc: "Run SQL and inspect results",
      icon: CodeXml,
      href: "/dashboard/query",
      accent: "group-hover:text-emerald-400",
      glow: "group-hover:shadow-emerald-500/10",
    },
    {
      title: "Reference Manual",
      desc: "Fullscreen portal with entity graphs",
      icon: BookOpen,
      href: documentHref,
      accent: "group-hover:text-cyan-400",
      glow: "group-hover:shadow-cyan-500/10",
    },
    {
      title: "AI Chat & Reports",
      desc: "Ask questions, get executive summaries",
      icon: MessageSquare,
      href: tablesHref,
      accent: "group-hover:text-violet-400",
      glow: "group-hover:shadow-violet-500/10",
    },
  ];

  return (
    <DashboardLayout>
      {/* Hero banner with integrated stats */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="relative mb-10 rounded-2xl border border-white/[0.06] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <p className="text-primary text-[11px] font-semibold tracking-[0.25em] uppercase mb-3">
                Overview
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2.5">
                Hey, {firstName}
                <Sparkles className="w-6 h-6 text-amber-400/80" />
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md leading-relaxed">
                {connections.length > 0
                  ? `${connections.length} database${connections.length !== 1 ? "s" : ""} connected — explore, audit, and document your schemas.`
                  : "Connect a database to start documenting, auditing, and exploring your schema."}
              </p>
            </div>
            <Link href="/connect" className="shrink-0">
              <Button size="lg" className="gap-2 rounded-full shadow-lg shadow-primary/15">
                <Plus className="w-4 h-4" />
                Connect Database
              </Button>
            </Link>
          </div>

          {/* Inline stats — no boxes */}
          <div className="mt-8 pt-7 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-white/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <s.icon className="w-3.5 h-3.5 text-primary/70" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                {isLoading && s.value === "—" ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-1" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">{s.value}</p>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
        {/* Quick access — list rows, not cards */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="lg:col-span-3"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Jump to</h2>
            <span className="text-[11px] text-muted-foreground">{quickActions.length} areas</span>
          </div>

          <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.06] overflow-hidden bg-card/30">
            {quickActions.map((action, i) => (
              <Link key={action.title} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className={`group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-all cursor-pointer ${action.glow} hover:shadow-[inset_3px_0_0_0] hover:shadow-primary/60`}
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 group-hover:bg-secondary transition-colors">
                    <action.icon className={`w-4 h-4 text-muted-foreground transition-colors ${action.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Connected sources — minimal panel */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Your sources</h2>
            {connections.length > 0 && (
              <Link href="/dashboard/tables" className="text-[11px] text-primary hover:underline">
                View all
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-card/30 overflow-hidden">
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="animate-spin text-muted-foreground w-5 h-5" />
              </div>
            ) : connections.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {connections.slice(0, 6).map((conn) => (
                  <Link key={conn.id} href={`/dashboard/tables/${conn.id}`}>
                    <div className="group flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {conn.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {conn.provider}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
                  <Database className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">No databases yet</p>
                <p className="text-xs text-muted-foreground/60 mb-5">
                  Paste a connection string to get started in under 30 seconds.
                </p>
                <Link href="/connect">
                  <Button size="sm" className="rounded-full gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Connect now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Contextual tip when connected */}
          {connections.length > 0 && documentedTables === 0 && !isLoading && (
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed px-1">
              <span className="text-amber-400/90 font-medium">Tip:</span> Open a schema and hit{" "}
              <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded">SYNC AI</span>{" "}
              to generate documentation and enable chat.
            </p>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
