"use client";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import {
  Table2,
  ShieldAlert,
  RefreshCw,
  TrendingUp,
  Database,
  Loader2,
  ArrowRight,
  BarChart3,
  GitBranch,
  CodeXml,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { authClient } from "@/src/components/landing/auth";
import { getUserConnections } from "@/src/actions/db";
import Link from "next/link";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export default function DashboardOverview() {
  const { data: session, isPending: authLoading } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (authLoading) return;

      if (session?.user?.id) {
        const result = await getUserConnections(session.user.id);
        if (result.success && Array.isArray(result.data)) {
          setConnections(result.data);
        }
      }
      setIsLoading(false);
    }
    loadStats();
  }, [session, authLoading]);

  const quickActions = [
    {
      title: "Explore Schema",
      desc: "Browse tables and AI-generated documentation.",
      icon: Table2,
      href: "/dashboard/tables",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Quality Audit",
      desc: "Check for nulls, uniqueness, and data health.",
      icon: BarChart3,
      href: "/dashboard/quality",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "Data Lineage",
      desc: "Visualize how your data flows across tables.",
      icon: GitBranch,
      href: "/dashboard/lineage",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      title: "Query Runner",
      desc: "Execute SQL and view live results.",
      icon: CodeXml,
      href: "/dashboard/query",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    }
  ];

  return (
    <DashboardLayout>
      {/* Hero Greeting */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Explorer'} <Sparkles className="w-6 h-6 text-amber-500" />
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your Intelligent Data Dictionary is synced and ready.
          </p>
        </div>
        <Link href="/connect">
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
            <Database className="w-4 h-4" /> Connect New Database
          </Button>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Card className="p-6 transition-all hover:shadow-md border-primary/20 bg-primary/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Sources</span>
            <Database className="w-5 h-5 text-primary" />
          </div>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <p className="text-3xl font-bold">{connections.length}</p>}
          <p className="text-xs text-muted-foreground mt-2 font-medium text-emerald-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Auto-sync enabled
          </p>
        </Card>

        <Card className="p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sync Health</span>
            <RefreshCw className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold">100%</p>
          <p className="text-xs text-emerald-600 mt-2 font-medium">All systems healthy</p>
        </Card>

        <Card className="p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Enrichment</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">Ready</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium">Gemini-2.5 Flash active</p>
        </Card>

        <Card className="p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Performance</span>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">42ms</p>
          <p className="text-xs text-muted-foreground mt-2 font-medium text-blue-600">Average Latency</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Access Grid - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Functional Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="p-5 h-full transition-all hover:border-primary group cursor-pointer relative overflow-hidden bg-card/50 backdrop-blur-sm">
                  <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                    {action.title} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{action.desc}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Real Data List - Right Column */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Connected Sources</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : connections.length > 0 ? (
              connections.slice(0, 5).map((conn) => (
                <Link key={conn.id} href={`/dashboard/tables/${conn.id}`}>
                  <div className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        <Database className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate max-w-[140px]">{conn.name}</p>
                        <p className="text-[10px] uppercase text-muted-foreground font-bold">{conn.provider}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">No databases connected yet.</p>
                <Link href="/connect">
                  <Button variant="outline" size="sm">Connect Now</Button>
                </Link>
              </div>
            )}
            {connections.length > 5 && (
              <Link href="/dashboard/connections" className="block p-3 text-center text-xs font-bold text-primary hover:bg-muted/50">
                View All {connections.length} Sources
              </Link>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}