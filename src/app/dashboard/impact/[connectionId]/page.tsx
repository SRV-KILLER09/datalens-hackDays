"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { getUserConnections } from "../../../../actions/db";
import {
  getConnectionTablesAction,
  simulateSchemaChangeAction,
  type ChangeType,
  type ImpactSimulationResult,
} from "../../../../actions/impactSimulator";
import { authClient } from "@/src/components/landing/auth";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  GitBranch,
  Code2,
  Table2,
  Zap,
} from "lucide-react";

const DEMO_ID = "demo-neon-db";

const RISK_STYLES = {
  LOW: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function ImpactSimulatorDynamicPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = use(params);
  const decodedConnectionId = decodeURIComponent(connectionId);
  const router = useRouter();

  const { data: session, isPending: authLoading } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [changeType, setChangeType] = useState<ChangeType>("drop_column");
  const [tables, setTables] = useState<{ name: string; columns: string[] }[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [result, setResult] = useState<ImpactSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch connections
  useEffect(() => {
    const fetchConns = async () => {
      let userConns: any[] = [];
      if (session?.user?.id) {
        const res = await getUserConnections(session.user.id);
        if (res.success) userConns = res.data || [];
      }
      setConnections([{ id: DEMO_ID, name: "✨ Demo eCommerce DB" }, ...userConns.filter(c => c.id !== DEMO_ID)]);
    };
    fetchConns();
  }, [session]);

  // Load tables for active connection
  useEffect(() => {
    const loadTables = async () => {
      if (!decodedConnectionId || authLoading) return;
      setLoadingTables(true);
      setTables([]);
      setSelectedTable("");
      setSelectedColumn("");
      const res = await getConnectionTablesAction(decodedConnectionId, session?.user?.id);
      if (res.success && res.data) setTables(res.data);
      setLoadingTables(false);
    };
    loadTables();
  }, [decodedConnectionId, session, authLoading]);

  const columns = tables.find((t) => t.name === selectedTable)?.columns ?? [];

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await simulateSchemaChangeAction(
      decodedConnectionId,
      session?.user?.id,
      changeType,
      selectedTable,
      changeType !== "drop_table" ? selectedColumn : undefined,
      changeType === "rename_column" ? newColumnName : undefined
    );

    if (res.success && res.data) {
      setResult(res.data);
      setStep(4);
    } else {
      setError(res.error || "Simulation failed.");
    }
    setLoading(false);
  };

  const handleConnectionChange = (newConnId: string) => {
    if (!newConnId) return;
    router.push(`/dashboard/impact/${encodeURIComponent(newConnId)}`);
  };

  const canProceedStep2 = !!decodedConnectionId;
  const canProceedStep3 =
    !!selectedTable &&
    (changeType === "drop_table" ||
      (changeType === "drop_column" && !!selectedColumn) ||
      (changeType === "rename_column" && !!selectedColumn && !!newColumnName.trim()));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Impact Simulator
              <span className="text-xs bg-amber-500/10 text-amber-600 border border-amber-500/30 px-2 py-1 rounded-full">
                What If?
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simulate dropping or renaming tables/columns before you make the change. See FK blast radius, lineage, and affected API endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none"
              onChange={(e) => handleConnectionChange(e.target.value)}
              value={decodedConnectionId}
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  step >= s ? "bg-primary text-primary-foreground border-primary" : "border-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Step 1 — Choose change type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  { type: "drop_column" as ChangeType, label: "Drop Column", desc: "Remove a column" },
                  { type: "rename_column" as ChangeType, label: "Rename Column", desc: "Change column name" },
                  { type: "drop_table" as ChangeType, label: "Drop Table", desc: "Remove entire table" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setChangeType(opt.type)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    changeType === opt.type
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} disabled={!canProceedStep2} className="w-full sm:w-auto">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Step 2 — Select target</h2>
            {loadingTables ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading schema…
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Table</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedTable}
                    onChange={(e) => { setSelectedTable(e.target.value); setSelectedColumn(""); }}
                  >
                    <option value="">Select table…</option>
                    {tables.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                {changeType !== "drop_table" && selectedTable && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Column</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-mono"
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                    >
                      <option value="">Select column…</option>
                      {columns.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {changeType === "rename_column" && selectedColumn && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">New column name</label>
                    <input
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-mono"
                      placeholder="new_column_name"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep3}>
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Step 3 — Confirm & simulate</h2>
            <div className="p-4 rounded-lg bg-muted/50 border font-mono text-sm space-y-1">
              <p><span className="text-muted-foreground">Change:</span> {changeType.replace(/_/g, " ")}</p>
              <p><span className="text-muted-foreground">Table:</span> {selectedTable}</p>
              {selectedColumn && <p><span className="text-muted-foreground">Column:</span> {selectedColumn}</p>}
              {newColumnName && <p><span className="text-muted-foreground">New name:</span> {newColumnName}</p>}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={runSimulation} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Run Impact Simulation
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && result && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-semibold text-lg">Simulation Results</h2>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
                <Badge className={`${RISK_STYLES[result.riskLevel]} border text-xs font-bold`}>
                  {result.riskLevel} RISK
                </Badge>
              </div>

              {result.riskLevel === "CRITICAL" || result.riskLevel === "HIGH" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  This change has significant blast radius. Review all impacts before proceeding.
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm mb-4">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Manageable impact detected. Follow recommendations below.
                </div>
              )}
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" /> Foreign Key Impacts ({result.foreignKeyImpacts.length})
                </h3>
                {result.foreignKeyImpacts.length > 0 ? (
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {result.foreignKeyImpacts.map((fk, i) => (
                      <li key={i} className="text-xs p-2 rounded bg-muted/50 border">
                        <span className="font-mono text-primary">{fk.from}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-mono">{fk.to}</span>
                        <p className="text-muted-foreground mt-0.5">{fk.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No FK relationships affected.</p>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-primary" /> Column Lineage
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">↑ Upstream ({result.lineage.upstream.length})</p>
                    {result.lineage.upstream.map((n, i) => (
                      <p key={i} className="font-mono">{n.table}.{n.column}</p>
                    ))}
                    {result.lineage.upstream.length === 0 && <p className="text-muted-foreground">None</p>}
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">↓ Downstream ({result.lineage.downstream.length})</p>
                    {result.lineage.downstream.map((n, i) => (
                      <p key={i} className="font-mono">{n.table}.{n.column}</p>
                    ))}
                    {result.lineage.downstream.length === 0 && <p className="text-muted-foreground">None</p>}
                  </div>
                </div>
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" /> API Endpoints ({result.apiEndpoints.length})
                </h3>
                {result.apiEndpoints.length > 0 ? (
                  <ul className="space-y-2">
                    {result.apiEndpoints.map((ep) => (
                      <li key={ep.slug} className="text-xs p-2 rounded bg-muted/50 border">
                        <span className="font-mono text-primary">{ep.url}</span>
                        <p className="text-muted-foreground mt-0.5">References: {ep.matchedTerms.join(", ")}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No agent-generated endpoints reference this object.</p>
                )}
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Recommendations
                </h3>
                <ul className="space-y-1.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {result.aiAnalysis && (
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-semibold">AI Graph Analysis</h3>
                <p className="text-xs text-muted-foreground">{result.aiAnalysis.impact}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.aiAnalysis.relations.map((rel, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded border bg-muted font-mono">{rel}</span>
                  ))}
                </div>
              </Card>
            )}

            <Button variant="outline" onClick={() => { setStep(1); setResult(null); }}>
              Run Another Simulation
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
