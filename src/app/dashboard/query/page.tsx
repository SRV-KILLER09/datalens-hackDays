"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { getUserConnections, runCustomQuery, analyzeImpactAction } from "../../../actions/db";
import { getDataQualityMetrics, getStructuralAnalysis } from "../../../actions/dataQuality";
import { Progress } from "../../../components/ui/progress";
import { authClient } from "@/src/components/landing/auth";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Loader2, Play, FileJson, Database, ShieldAlert, Zap, Network, BarChart3, AlertTriangle, CheckCircle2, History, Code2, ScrollText } from "lucide-react";

const DEMO_ID = "demo-neon-db";

export default function QueryPage() {
  const { data: session } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConn, setSelectedConn] = useState(DEMO_ID);
  const [sqlText, setSqlText] = useState(`SELECT 
    oi.order_id,
    oi.product_id,
    oi.seller_id,
    oi.price,
    s.seller_city,
    op.payment_type
FROM olist_order_items_dataset oi
JOIN olist_sellers_dataset s ON oi.seller_id = s.seller_id
LEFT JOIN olist_order_payments_dataset op ON oi.order_id = op.order_id
LIMIT 10;`);
  const [results, setResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<{ depth: number; impact: string; relations: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "quality" | "execution">("graph");
  const [qualityResults, setQualityResults] = useState<any>(null);
  const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
  const [riskLevel, setRiskLevel] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [structuralInsights, setStructuralInsights] = useState<any>(null);



  useEffect(() => {
    const fetchConns = async () => {
      let userConns: any[] = [];
      if (session?.user?.id) {
        const res = await getUserConnections(session.user.id);
        if (res.success) userConns = res.data || [];
      }
      setConnections([{ id: DEMO_ID, name: "✨ Demo eCommerce DB" }, ...userConns]);
    };
    fetchConns();
  }, [session]);

  const analyzeImpactWithGroq = async (query: string) => {
    const res = await analyzeImpactAction(query);
    if (res.success) {
      return res.data;
    } else {
      console.error("Groq Analysis Failed", res.error);
      return null;
    }
  };

  const execute = async () => {
    const trimmedSql = sqlText.trim();
    if (!trimmedSql) return;

    const readOnlyRegex = /^\s*(SELECT|WITH|SHOW|DESCRIBE|EXPLAIN)\b/i;
    if (!readOnlyRegex.test(trimmedSql)) {
      setError("Security Policy: Only read-only queries are permitted.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults([]);
    setImpactAnalysis(null);

    try {
      // Cascade Risk Amplifier
      const isDropQuery = trimmedSql.toUpperCase().includes("DROP TABLE");
      let currentRisk: "LOW" | "MEDIUM" | "HIGH" = isDropQuery ? "MEDIUM" : "LOW";

      const [dbRes, analysis] = await Promise.all([
        runCustomQuery(selectedConn, session?.user?.id, trimmedSql),
        analyzeImpactAction(trimmedSql)
      ]);

      setImpactAnalysis(analysis.success ? analysis.data : null);

      if (isDropQuery) {
        // Run quality check to amplify risk
        const tableNameMatch = trimmedSql.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
        if (tableNameMatch?.[1]) {
          const qual = await getDataQualityMetrics(tableNameMatch[1], selectedConn, session?.user?.id!);
          if (qual.success && qual.data.health.score < 70) {
            currentRisk = "HIGH";
            setError(`CASCADE RISK AMPLIFIED: Table ${tableNameMatch[1]} has low health score (${qual.data.health.score}). Proceed with extreme caution.`);
          }
        }
      }
      setRiskLevel(currentRisk);

      if (dbRes.success) {
        const data = (dbRes.data as any[]) || [];
        setResults(data);
        if (data.length === 0) setError("Query successful, but no rows were returned.");

        // Auto-run quality analysis for the first table detected in the query (simple heuristic)
        const tableMatch = trimmedSql.match(/FROM\s+(\w+)/i);
        if (tableMatch?.[1]) {
          fetchQualityMetrics(tableMatch[1]);
        }
      } else {
        setError(dbRes.error || "An error occurred.");
      }
    } catch (err: any) {
      setError(err.message || "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const fetchQualityMetrics = async (tableName: string) => {
    setIsAnalyzingQuality(true);
    const res = await getDataQualityMetrics(tableName, selectedConn, session?.user?.id!);
    if (res.success) {
      setQualityResults(res.data);
    }
    setIsAnalyzingQuality(false);
    fetchStructuralInsights();
  };

  const fetchStructuralInsights = async () => {
    const res = await getStructuralAnalysis(selectedConn);
    if (res.success) {
      setStructuralInsights(res.data);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SQL Lab <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">AI Enhanced</span></h1>
            <p className="text-sm text-muted-foreground">Run queries with automated graph impact analysis.</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="h-10 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none"
              value={selectedConn}
              onChange={(e) => setSelectedConn(e.target.value)}
            >
              {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <Button onClick={execute} disabled={isRunning} className="min-w-[120px]">
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Analyze & Run
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 relative border-2 border-primary/10 overflow-hidden bg-[#0a0a0a]">
              <textarea
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                className="w-full h-full p-6 bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none"
                spellCheck={false}
              />
            </Card>

            <Card className="h-2/5 overflow-hidden flex flex-col border-muted">
              <div className="px-4 py-2 border-b bg-muted/30 flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase">
                  <FileJson className="w-3 h-3 text-primary" /> Result Set {results.length > 0 && `(${results.length})`}
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                {results.length > 0 ? (
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-md">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th key={key} className="p-3 text-[10px] font-bold uppercase border-b text-muted-foreground">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 border-b border-border/5">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="p-3 text-[11px] font-mono">{val?.toString() || "null"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20"><Database className="w-12 h-12" /></div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <Card className="flex-1 border-primary/20 bg-primary/5 flex flex-col overflow-hidden">
              <div className="flex border-b border-primary/10">
                <button
                  onClick={() => setActiveTab("graph")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === "graph" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-primary/5"}`}
                >
                  <Network className="w-3 h-3" /> Impact Analysis
                </button>
                <button
                  onClick={() => setActiveTab("quality")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === "quality" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-primary/5"}`}
                >
                  <BarChart3 className="w-3 h-3" /> Data Quality
                </button>
                <button
                  onClick={() => setActiveTab("execution")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === "execution" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-primary/5"}`}
                >
                  <ScrollText className="w-3 h-3" /> Execution
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {activeTab === "graph" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
                      <Network className="w-4 h-4" /> Graph Relationship Depth
                    </div>
                    {impactAnalysis ? (
                      <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                          <span className="text-xs text-muted-foreground">Graph Depth</span>
                          <span className="text-xl font-bold text-primary">{impactAnalysis.depth}</span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Schema Relations</p>
                          <div className="flex flex-wrap gap-2">
                            {impactAnalysis.relations.map((rel: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-background border rounded text-[10px] font-mono">{rel}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className={`w-3 h-3 ${riskLevel === "HIGH" ? "text-destructive" : "text-amber-500"}`} />
                            <p className={`text-[10px] font-bold uppercase ${riskLevel === "HIGH" ? "text-destructive" : "text-amber-500"}`}>
                              Impact Summary {riskLevel !== "LOW" && `(${riskLevel} RISK)`}
                            </p>
                          </div>
                          <p className="text-xs leading-relaxed">{impactAnalysis.impact}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                        <Network className="w-8 h-8 mb-2" />
                        <p className="text-[10px] uppercase">Execute query to see<br />graph relationship depth</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === "quality" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-2">
                      <BarChart3 className="w-4 h-4" /> Table Health Score
                    </div>

                    {isAnalyzingQuality ? (
                      <div className="h-48 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-[10px] uppercase animate-pulse">Running Deterministic Checks...</p>
                      </div>
                    ) : qualityResults ? (
                      <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="p-4 bg-background rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Health Status</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${qualityResults.health.status === "GOOD" ? "bg-emerald-500/10 text-emerald-500" :
                              qualityResults.health.status === "WARNING" ? "bg-amber-500/10 text-amber-500" :
                                "bg-destructive/10 text-destructive"
                              }`}>
                              {qualityResults.health.status}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xl font-bold">
                              <span>{qualityResults.health.score}</span>
                              <span className="text-muted-foreground/30">/ 100</span>
                            </div>
                            <Progress value={qualityResults.health.score} className={`h-1.5 ${qualityResults.health.score > 80 ? "[&>div]:bg-emerald-500" :
                              qualityResults.health.score > 50 ? "[&>div]:bg-amber-500" :
                                "[&>div]:bg-destructive"
                              }`} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 bg-background border rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Orphans</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${qualityResults.orphans.some((o: any) => o.orphan_count > 0) ? "text-destructive" : "text-primary"}`}>
                                {qualityResults.orphans.reduce((acc: number, o: any) => acc + o.orphan_count, 0)}
                              </span>
                              {qualityResults.orphans.some((o: any) => o.orphan_count > 0) && <AlertTriangle className="w-3 h-3 text-destructive" />}
                            </div>
                          </div>
                          <div className="p-3 bg-background border rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Duplicates</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${qualityResults.duplicates.some((d: any) => d.count > 0) ? "text-destructive" : "text-primary"}`}>
                                {qualityResults.duplicates.reduce((acc: number, d: any) => acc + d.count, 0)}
                              </span>
                              {qualityResults.duplicates.some((d: any) => d.count > 0) && <AlertTriangle className="w-3 h-3 text-destructive" />}
                            </div>
                          </div>
                          <div className="p-3 bg-background border rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Null Violations</p>
                            <span className={`text-lg font-bold ${qualityResults.nullViolations.length > 0 ? "text-amber-500" : "text-primary"}`}>
                              {qualityResults.nullViolations.length}
                            </span>
                          </div>
                          <div className="p-3 bg-background border rounded-lg">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Freshness</p>
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold">{qualityResults.freshness?.freshness_days ?? "?"}</span>
                              <span className="text-[9px] text-muted-foreground uppercase">Days</span>
                            </div>
                          </div>
                        </div>

                        {qualityResults.nullViolations.length > 0 && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <p className="text-[9px] font-bold text-amber-500 uppercase mb-2">Null Ratio Alerts</p>
                            <div className="space-y-1">
                              {qualityResults.nullViolations.map((v: any, i: number) => (
                                <div key={i} className="flex justify-between text-[10px]">
                                  <span className="font-mono">{v.column}</span>
                                  <span className="font-bold">{(v.ratio * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {structuralInsights && (
                          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                            <p className="text-[9px] font-bold text-primary uppercase">Structural Insights (Graph)</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Max Cascade Depth</span>
                                <span className="font-bold">{structuralInsights.maxDepth} hops</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-muted-foreground">Isolated Tables</span>
                                <span className="font-bold">{structuralInsights.isolated.length}</span>
                              </div>
                              {structuralInsights.hubs.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[8px] text-muted-foreground uppercase">Central Hubs Detected</p>
                                  <div className="flex flex-wrap gap-1">
                                    {structuralInsights.hubs.slice(0, 3).map((h: any, i: number) => (
                                      <span key={i} className="px-1.5 py-0.5 bg-primary/10 rounded text-[9px] font-mono">{h.name}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                        <BarChart3 className="w-8 h-8 mb-2" />
                        <p className="text-[10px] uppercase">Execute query to run<br />governance & quality checks</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-4">
                      <ScrollText className="w-4 h-4" /> Underlying Logic & Calculations
                    </div>

                    <div className="space-y-6">
                      {qualityResults?.executedQueries && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase border-b border-primary/10 pb-1">Data Quality (SQL & Neo4j)</p>
                          {qualityResults.executedQueries.map((q: any, i: number) => (
                            <div key={i} className="space-y-1.5 animate-in fade-in duration-500">
                              <p className="text-[9px] font-mono text-primary/70">{q.type}</p>
                              <pre className="p-2 bg-black/40 border border-primary/10 rounded text-[9px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                {q.query}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      {structuralInsights?.executedQueries && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase border-b border-primary/10 pb-1">Structural Analysis (Cypher)</p>
                          {structuralInsights.executedQueries.map((q: any, i: number) => (
                            <div key={i} className="space-y-1.5 animate-in fade-in duration-500">
                              <p className="text-[9px] font-mono text-primary/70">{q.type}</p>
                              <pre className="p-2 bg-black/40 border border-primary/10 rounded text-[9px] font-mono text-amber-400 overflow-x-auto whitespace-pre-wrap">
                                {q.query}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      {!qualityResults?.executedQueries && !structuralInsights?.executedQueries && (
                        <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
                          <Code2 className="w-8 h-8 mb-2" />
                          <p className="text-[10px] uppercase">No execution logs available.<br />Run analysis to see queries.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}