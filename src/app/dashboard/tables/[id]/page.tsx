"use client";

import { useEffect, useState, use } from "react";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { Table2, Eye, Loader2, AlertCircle, Database, ArrowLeft, RefreshCw, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { getDatabaseMetadata, getConnectionStringById } from "../../../../actions/db";
import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/components/landing/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { DocumentationTab } from "@/src/components/dashboard/DocumentationTab";
import { ChatTab } from "@/src/components/dashboard/ChatTab";

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
}
const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI!;

const DashboardTables = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { data: session, isPending: authLoading } = authClient.useSession();

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing-tables' | 'syncing-ai' | 'completed'>('idle');
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);

  const getEffectiveUri = async () => {
    if (!session?.user?.id) return FALLBACK_URI;
    const uri = await getConnectionStringById(id, session.user.id);
    return uri || FALLBACK_URI;
  };

  const loadMetadata = async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      const connString = await getEffectiveUri();
      const result = await getDatabaseMetadata(connString);

      if (result.success && result.data) {
        const { schema, counts } = result.data;
        const organized = schema.reduce((acc: any, curr: any) => {
          if (!acc[curr.table_name]) acc[curr.table_name] = [];
          acc[curr.table_name].push(curr.column_name);
          return acc;
        }, {});

        const formattedTables = Object.entries(organized).map(([name, columns]) => {
          const countObj = counts.find((c: any) => c.table_name === name);
          return {
            name,
            columns: columns as string[],
            rowCount: countObj ? parseInt(countObj.row_count) : 0,
          };
        });

        setTables(formattedTables);
      } else {
        setError(result.error || "Failed to fetch schema");
      }
    } catch (err: any) {
      setError("An unexpected error occurred while connecting.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, [id, session, authLoading]);

  const handleCombinedSync = async () => {
    const { toast } = await import("sonner");
    setSyncStatus('syncing-tables');
    
    try {
      // 1. Sync Table Metadata
      const connString = await getEffectiveUri();
      const metaResult = await getDatabaseMetadata(connString);
      if (!metaResult.success || !metaResult.data) throw new Error("Failed to fetch fresh metadata");

      const { syncTableMetadata } = await import('../../../../actions/metadata');
      const organized = metaResult.data.schema.reduce((acc: any, curr: any) => {
        if (!acc[curr.table_name]) {
          acc[curr.table_name] = { name: curr.table_name, columns: [] };
        }
        acc[curr.table_name].columns.push(curr);
        return acc;
      }, {});

      const tableSync = await syncTableMetadata(id, Object.values(organized));
      if (!tableSync.success) throw new Error(tableSync.error || "Table sync failed");

      // 2. Sync AI Documentation
      setSyncStatus('syncing-ai');
      const { syncAIDocumentation } = await import('../../../../actions/rag');
      const aiSync = await syncAIDocumentation(id);
      
      if (!aiSync.success) throw new Error(aiSync.error || "AI sync failed");

      setSyncStatus('completed');
      toast.success("Database and AI successfully synchronized");
      await loadMetadata();

      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err: any) {
      toast.error(err.message || "Synchronization failed");
      setSyncStatus('idle');
    }
  };

  const handleGenerateInference = async () => {
    setIsGeneratingGraph(true);
    try {
      const { buildGraphForInference } = await import('../../../../actions/graphBuilder');
      const result = await buildGraphForInference(id);
      if (!result.success) throw new Error(result.error || "Failed to construct Graph DB.");
      alert("Graph successfully constructed for LLM inference.");
    } catch (err: any) {
      setError(err.message || "An error occurred generating the graph");
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Connections
        </Link>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Database Schema</h1>
            <p className="text-sm text-muted-foreground mt-1 text-wrap max-w-md">
              Live inspection for <span className="font-mono text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">{id}</span>
              {!session?.user?.id && <span className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-tighter">Guest Mode (Demo)</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGenerateInference} 
              className="gap-2 h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white border-amber-500" 
              variant="outline" 
              disabled={isGeneratingGraph || syncStatus !== 'idle' || loading}
            >
              {isGeneratingGraph ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              {isGeneratingGraph ? "GENERATING..." : "BUILD GRAPH"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleCombinedSync}
              disabled={syncStatus !== 'idle' || loading}
              className={`gap-2 h-8 text-xs font-bold transition-all duration-300 ${
                syncStatus === 'completed' ? "bg-green-600 hover:bg-green-600" : ""
              }`}
            >
              {syncStatus === 'idle' && (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  SYNC AI
                </>
              )}
              {syncStatus === 'syncing-tables' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  SYNCING TABLES...
                </>
              )}
              {syncStatus === 'syncing-ai' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  INDEXING AI...
                </>
              )}
              {syncStatus === 'completed' && (
                <>
                  <Check className="w-3.5 h-3.5" />
                  COMPLETE
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="schema" className="font-bold text-xs uppercase tracking-wider">
            Schema Explorer
          </TabsTrigger>
          <TabsTrigger value="documentation" className="font-bold text-xs uppercase tracking-wider">
            AI Documentation
          </TabsTrigger>
          <TabsTrigger value="chat" className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Chat with AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-card border border-dashed rounded-xl">
              <Loader2 className="w-10 h-10 animate-spin text-primary/50 mb-4" />
              <p className="text-sm font-medium animate-pulse uppercase tracking-widest text-muted-foreground">Mapping Data Objects...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive mb-6">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto font-bold uppercase text-[10px]">Dismiss</Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Table Name</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Structure Preview</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Rows</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tables.map((t) => (
                    <tr key={t.name} className="hover:bg-muted/30 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/10 transition-colors">
                            <Table2 className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold font-mono text-sm">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {t.columns.slice(0, 4).map(col => (
                            <code key={col} className="text-[10px] bg-muted px-2 py-0.5 rounded border border-border/50 font-medium">
                              {col}
                            </code>
                          ))}
                          {t.columns.length > 4 && (
                            <span className="text-[10px] text-muted-foreground font-bold self-center">+{t.columns.length - 4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className="font-semibold text-foreground">
                          {t.rowCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/tables/${id}/${t.name}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-primary hover:text-primary-foreground font-bold text-[10px] uppercase tracking-tighter transition-all">
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tables.length === 0 && (
                <div className="py-20 text-center text-muted-foreground italic font-mono text-xs">
                  NO TABLES DETECTED IN TARGET SCHEMA.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentation" className="mt-0">
          <DocumentationTab connectionId={id as string} userId={session?.user?.id as string} />
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <ChatTab connectionId={id as string} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardTables;