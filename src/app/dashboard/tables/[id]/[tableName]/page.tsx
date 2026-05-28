"use client";

import { useEffect, useState, use } from "react";
import DashboardLayout from "../../../../../components/dashboard/DashboardLayout";
import { getSingleTableDetails, getTableRows, getConnectionStringById } from "../../../../../actions/db";
import { ArrowLeft, Loader2, Table2, Database, ChevronDown, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { authClient } from "@/src/components/landing/auth";

const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI!;

export default function TableDetailPage({ params }: { params: Promise<{ id: string; tableName: string }> }) {
  const { id, tableName } = use(params);
  const { data: session, isPending: authLoading } = authClient.useSession();

  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEffectiveUri = async () => {
    if (!session?.user?.id) return FALLBACK_URI;
    const uri = await getConnectionStringById(id, session.user.id);
    return uri || FALLBACK_URI;
  };

  useEffect(() => {
    async function initLoad() {
      if (authLoading) return;
      if (!tableName) return;

      try {
        const uri = await getEffectiveUri();

        // Load Schema Definition
        const colResult = await getSingleTableDetails(uri, tableName);
        if (colResult.success && colResult.data) {
          setColumns(colResult.data);
        }

        // Load Initial Data Preview
        const rowResult = await getTableRows(uri, tableName, 1);
        if (rowResult.success && rowResult.data) {
          setRows(rowResult.data);
          setPage(2);
        } else {
          setError(rowResult.error || "Failed to fetch table rows.");
        }
      } catch (err) {
        setError("An unexpected error occurred during inspection.");
      } finally {
        setLoading(false);
      }
    }
    initLoad();
  }, [id, tableName, session, authLoading]);

  const fetchNextPage = async () => {
    setLoadingRows(true);
    try {
      const uri = await getEffectiveUri();
      const result = await getTableRows(uri, tableName, page);
      
      if (result.success && result.data) {
        setRows(prev => [...prev, ...result.data]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setLoadingRows(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-40 border border-dashed rounded-2xl">
          <Loader2 className="w-10 h-10 animate-spin text-primary/40 mb-4" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Querying {tableName}...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href={`/dashboard/tables/${id}`} className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-3 h-3 mr-1" /> Back to Overview
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Table2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono uppercase tracking-tight">{tableName}</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Detailed Inspection {!session?.user?.id && "(Guest Mode)"}</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Schema Definition</h2>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-left">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Column</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-right">Constraints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {columns.map((col) => (
                    <tr key={col.name} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-primary">{col.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground font-mono text-xs">{col.type}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {col.is_nullable === "NO" && (
                            <Badge variant="outline" className="text-[10px] bg-muted">NOT NULL</Badge>
                          )}
                          {col.is_primary_key && (
                            <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 bg-amber-500/10">PK</Badge>
                          )}
                          {col.is_foreign_key && col.foreign_table_name && col.foreign_column_name && (
                            <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-600 bg-blue-500/10 gap-1 flex items-center">
                              FK <span className="opacity-50">→</span> {col.foreign_table_name}.{col.foreign_column_name}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="pb-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live Data Preview</h2>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Total Loaded: {rows.length}</span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      {rows.length > 0 && Object.keys(rows[0]).map(key => (
                        <th key={key} className="px-4 py-3 font-mono text-muted-foreground border-r last:border-0 whitespace-nowrap uppercase tracking-tighter bg-muted/30">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-2.5 truncate max-w-[200px] border-r last:border-0 font-mono text-[11px]">
                            {val === null ? <span className="text-muted-foreground/30 italic">null</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 bg-muted/20 flex justify-center border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchNextPage} 
                  disabled={loadingRows}
                  className="text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all"
                >
                  {loadingRows ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="w-3 h-3 mr-2" />
                  )}
                  FETCH MORE RECORDS
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}