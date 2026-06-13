"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Table2,
  BarChart3,
  ShieldCheck,
  GitBranch,
  MessageSquare,
  Settings,
  Database,
  ChevronLeft,
  Menu,
  X,
  PlusCircle,
  CodeXml,
  LogOut,
  Sparkles,
  ShieldAlert,
  Gamepad2,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useState, useEffect } from "react";
import { authClient } from "@/src/components/landing/auth";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastConnId, setLastConnId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    
    const storedId = localStorage.getItem("last_connection_id");
    if (storedId) {
      setLastConnId(storedId);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, path: "/dashboard", base: "/dashboard", exact: true },
    { 
      label: "Tables", 
      icon: Table2, 
      path: lastConnId ? `/dashboard/tables/${lastConnId}` : "/dashboard/tables",
      base: "/dashboard/tables"
    },
    { label: "Data Quality", icon: BarChart3, path: lastConnId ? `/dashboard/quality/${lastConnId}` : "/dashboard/quality", base: "/dashboard/quality" },
    // { label: "Compliance", icon: ShieldCheck, path: "/dashboard/compliance", base: "/dashboard/compliance" },
    { label: "Lineage", icon: GitBranch, path: lastConnId ? `/dashboard/lineage/${lastConnId}` : "/dashboard/lineage", base: "/dashboard/lineage" },
    { label: "Interactive Playground", icon: Gamepad2, path: lastConnId ? `/dashboard/playground/${lastConnId}` : "/dashboard/playground", base: "/dashboard/playground" },
    { label: "Impact Simulator", icon: ShieldAlert, path: lastConnId ? `/dashboard/impact/${lastConnId}` : "/dashboard/impact", base: "/dashboard/impact" },
    { label: "Text-to-SQL", icon: Sparkles, path: lastConnId ? `/dashboard/studio/${lastConnId}` : "/dashboard/studio", base: "/dashboard/studio" },
    { label: "Query Runner", icon: CodeXml, path: "/dashboard/query", base: "/dashboard/query" }
//    { label: "AI Chat", icon: MessageSquare, path: "/dashboard/chat", base: "/dashboard/chat" },
    // { label: "Settings", icon: Settings, path: "/dashboard/settings", base: "/dashboard/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div
        className={`fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-3 select-none">
            <Database className="w-5 h-5 text-primary shrink-0" />
            {(!collapsed || isMobileMenuOpen) && (
              <span className="text-sm font-bold tracking-tight text-sidebar-accent-foreground whitespace-nowrap">
                DataLens AI
              </span>
            )}
          </Link>
          <button 
            className="lg:hidden p-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.base 
              : pathname.startsWith(item.base);

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(!collapsed || isMobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}

          {(!collapsed || isMobileMenuOpen) && (
            <div className="px-3 mt-6 select-none animate-in fade-in duration-200">
              <div className="border border-emerald-500/25 bg-emerald-500/10 p-3.5 rounded-xl space-y-3.5 shadow-[0_0_12px_rgba(16,185,129,0.08)] hover:border-emerald-500/40 hover:shadow-[0_0_18px_rgba(16,185,129,0.15)] transition-all duration-300">
                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Newly Added
                </span>
                <div className="space-y-3 text-xs text-sidebar-foreground/85 font-medium">
                  {/* CLI Agent */}
                  <div className="flex items-center gap-1.5">
                    <span>CLI Agent</span>
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">CLI</span>
                  </div>

                  {/* Agent on Site */}
                  <div className="flex items-center gap-1.5">
                    <span>Agent on Site</span>
                    <span className="text-[8px] bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">Site</span>
                  </div>

                  {/* MCP Client */}
                  <div className="flex items-center gap-1.5">
                    <span>MCP Client</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">MCP</span>
                  </div>

                  {/* Documentation Engine */}
                  <div className="flex items-center gap-1.5">
                    <span>Documentation</span>
                    <span className="text-[8px] bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded uppercase font-bold font-mono">Docs</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Actions Section */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            href="/connect"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary hover:bg-primary/10 transition-all font-medium"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            {(!collapsed || isMobileMenuOpen) && <span>Connect New DB</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!collapsed || isMobileMenuOpen) && <span>Logout</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex lg:hidden items-center justify-between h-16 px-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">DataLens AI</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-sidebar-accent"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;