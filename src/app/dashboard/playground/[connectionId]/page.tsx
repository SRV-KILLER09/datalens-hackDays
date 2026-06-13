"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  EdgeLabelRenderer,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { motion, AnimatePresence } from "framer-motion";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { getUserConnections, getDatabaseRelations, getConnectionStringById } from "../../../../actions/db";
import { simulateSchemaChangeAction, type ImpactSimulationResult } from "../../../../actions/impactSimulator";
import { authClient } from "@/src/components/landing/auth";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import {
  Loader2,
  Table2,
  Trash2,
  Plus,
  RotateCcw,
  AlertTriangle,
  GitBranch,
  Code2,
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

const HARDCODED_URI = process.env.NEXT_PUBLIC_FALLBACK_URI || "";
const DEMO_NEON = "demo-neon-db";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const nodeHeight = 220;
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 200 });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 240, height: nodeHeight }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: nodeWithPosition.x - 120, y: nodeWithPosition.y - nodeHeight / 2 },
    };
  });
  return { nodes: layoutedNodes, edges };
};

// 1. Custom Edge Component with traveling pulse animations
function PlaygroundEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: any) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isPoly = data?.relation_type === "polymorphic";
  const isOneToOne = data?.relation_type === "one_to_one";
  const isWarning = data?.impactActive;
  const isNewLink = data?.isNew;

  let strokeColor = isWarning 
    ? "rgb(239, 68, 68)" 
    : isNewLink
      ? "rgb(16, 185, 129)"
      : isPoly 
        ? "rgb(168, 85, 247)" 
        : isOneToOne 
          ? "rgb(56, 189, 248)" 
          : "hsl(var(--primary))";

  let strokeDasharray = isPoly ? "5 5" : undefined;
  let strokeWidth = isWarning ? 3 : 2;

  return (
    <>
      <path
        id={id}
        className={`react-flow__edge-path transition-all duration-350 ${isWarning ? "warning-edge-glowing" : ""}`}
        d={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeDasharray,
          strokeWidth,
        }}
        markerEnd={markerEnd}
      />
      {isWarning && (
        <circle
          r="5.5"
          fill="rgb(239, 68, 68)"
          className="playground-pulse-ball"
          style={{ offsetPath: `path('${edgePath}')` }}
        />
      )}
      {isNewLink && (
        <circle
          r="5.5"
          fill="rgb(16, 185, 129)"
          className="playground-pulse-ball"
          style={{ offsetPath: `path('${edgePath}')` }}
        />
      )}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono bg-card border shadow-sm ${
              isWarning
                ? "border-red-500/30 text-red-500 font-bold"
                : isNewLink
                  ? "border-emerald-500/30 text-emerald-500 font-bold"
                  : isPoly
                    ? "border-purple-500/30 text-purple-500"
                    : isOneToOne
                      ? "border-sky-500/30 text-sky-500"
                      : "border-primary/30 text-primary"
            }`}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// 2. Custom Node Component with visual hover-shaking warning
const PlaygroundTableNode = ({ data }: any) => {
  const isDeleting = data.deleting;
  const columns = data.columns || [];

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-primary border-2 border-background" />
      <Card
        className={`min-w-[220px] border-primary/20 shadow-2xl bg-card overflow-hidden transition-all duration-300 ${
          isDeleting ? "shake-warning ring-2 ring-red-500 border-red-500/50" : "hover:ring-2 hover:ring-primary/45"
        }`}
      >
        <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 transition-colors ${
          isDeleting ? "bg-red-500/15 border-red-500/20 text-red-600 dark:text-red-400" : "bg-primary/10 border-primary/10"
        }`}>
          <div className="flex items-center gap-1.5">
            <Table2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-widest">{data.label}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full"
            onClick={() => data.onDeleteClick?.(data.label)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        <div className="p-2 space-y-0.5 bg-background/50 max-h-[180px] overflow-y-auto">
          {columns.map((col: any) => {
            const isFk = col.isFk || col.name.toLowerCase().includes("id") || col.isPoly;
            return (
              <div key={col.name} className="flex items-center justify-between px-1.5 py-1 text-[10px] font-mono rounded hover:bg-muted/30">
                <span className={isFk ? "text-primary font-bold" : "text-foreground/80"}>
                  {col.name}
                </span>
                <span className="flex gap-0.5">
                  {col.isPk && <span className="text-[7px] bg-primary/10 text-primary px-1 rounded font-bold">PK</span>}
                  {col.isFk && !col.isPoly && <span className="text-[7px] bg-blue-500/10 text-blue-500 px-1 rounded font-bold">FK</span>}
                  {col.isPoly && <span className="text-[7px] bg-purple-500/10 text-purple-500 px-1 rounded font-bold">POLY</span>}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-primary border-2 border-background" />
    </div>
  );
};

const nodeTypes = { table: PlaygroundTableNode };
const edgeTypes = { playgroundEdge: PlaygroundEdge };
const proOptions = { hideAttribution: true };

type Relation = {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  relation_type: "one_to_many" | "one_to_one" | "polymorphic";
};

const RISK_STYLES = {
  LOW: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function PlaygroundDynamicPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = use(params);
  const decodedConnectionId = decodeURIComponent(connectionId);
  const router = useRouter();

  const { data: session, isPending: authLoading } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbTables, setDbTables] = useState<any[]>([]);
  const [dbRels, setDbRels] = useState<Relation[]>([]);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [activeTables, setActiveTables] = useState<Set<string>>(new Set());

  // Interactive deletion dialog states
  const [deletingTable, setDeletingTable] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<ImpactSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  // New connection simulation states
  const [pendingConnection, setPendingConnection] = useState<Edge | null>(null);
  const [linkSimulationResult, setLinkSimulationResult] = useState<{
    riskLevel: "LOW" | "HIGH";
    summary: string;
    recommendation: string;
    lineageText: string;
  } | null>(null);

  // Load connections
  useEffect(() => {
    if (!authLoading && session?.user?.id) {
      getUserConnections(session.user.id).then((res) => {
        if (res.success) {
          const userConns = res.data || [];
          setConnections([{ id: DEMO_NEON, name: "✨ Demo eCommerce DB" }, ...userConns.filter(c => c.id !== DEMO_NEON)]);
        }
      });
    }
  }, [session, authLoading]);

  // Load DB relations & schema on connection change
  const loadPlaygroundGraph = useCallback(async (connId: string) => {
    setLoading(true);
    try {
      let uri = "";
      if (connId === DEMO_NEON) {
        uri = HARDCODED_URI;
      } else if (session?.user?.id) {
        uri = (await getConnectionStringById(connId, session.user.id)) || "";
      }

      if (!uri) throw new Error("No connection string found");

      const res = await getDatabaseRelations(uri);
      if (res.success && res.data) {
        const data = res.data as any;
        const fkColumns = new Set<string>();
        const polyColumns = new Set<string>();
        const rels: Relation[] = data.relations || [];

        rels.forEach((r: Relation) => {
          fkColumns.add(`${r.source_table}.${r.source_column}`);
          if (r.relation_type === "polymorphic") {
            polyColumns.add(`${r.source_table}.${r.source_column}`);
          }
        });

        // Group schema by tables
        const newTableGroups: Record<string, { name: string; isFk: boolean; isPk: boolean; isPoly?: boolean }[]> = {};
        data.schema.forEach((curr: any) => {
          const tableName = curr.table_name || curr.TABLE_NAME;
          const columnName = curr.column_name || curr.COLUMN_NAME;
          const isPk = curr.is_primary_key === true || curr.is_primary_key === "true";
          const isPoly = polyColumns.has(`${tableName}.${columnName}`);
          const isFk = fkColumns.has(`${tableName}.${columnName}`) || curr.is_foreign_key || isPoly;

          if (!newTableGroups[tableName]) newTableGroups[tableName] = [];
          newTableGroups[tableName].push({ name: columnName, isFk, isPk, isPoly });
        });

        const tableArray = Object.entries(newTableGroups).map(([name, columns]) => ({ name, columns }));
        setDbTables(tableArray);
        setDbRels(rels);

        // Prepopulate first 5 tables on canvas
        const initialActive = new Set(tableArray.slice(0, 5).map(t => t.name));
        setActiveTables(initialActive);
        buildPlaygroundElements(tableArray, rels, initialActive);
      }
    } catch (e) {
      console.error("Playground load error:", e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (decodedConnectionId && !authLoading) {
      loadPlaygroundGraph(decodedConnectionId);
    }
  }, [decodedConnectionId, authLoading, loadPlaygroundGraph]);

  // Visual layouting
  const buildPlaygroundElements = useCallback((
    tablesList: any[],
    relsList: Relation[],
    activeSet: Set<string>,
    tempDeleteNode: string | null = null
  ) => {
    // 1. Construct Nodes
    const initialNodes: Node[] = tablesList
      .filter((t) => activeSet.has(t.name))
      .map((t) => ({
        id: t.name,
        type: "table",
        position: { x: 0, y: 0 },
        data: {
          label: t.name,
          columns: t.columns,
          deleting: t.name === tempDeleteNode,
          onDeleteClick: triggerDeleteWave,
        },
      }));

    // 2. Construct Edges
    const initialEdges: Edge[] = relsList
      .filter((rel) => activeSet.has(rel.source_table) && activeSet.has(rel.target_table))
      .map((rel, i) => {
        const isWarning = tempDeleteNode !== null && (rel.source_table === tempDeleteNode || rel.target_table === tempDeleteNode);
        const isPoly = rel.relation_type === "polymorphic";
        const isOneToOne = rel.relation_type === "one_to_one";

        let typeLabel = "1:N";
        if (isPoly) typeLabel = "Poly";
        if (isOneToOne) typeLabel = "1:1";

        return {
          id: `e-${i}`,
          source: rel.source_table,
          target: rel.target_table,
          type: "playgroundEdge",
          animated: !isWarning,
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            width: 16, 
            height: 16, 
            color: isWarning ? "rgb(239, 68, 68)" : isPoly ? "rgb(168, 85, 247)" : isOneToOne ? "rgb(56, 189, 248)" : "hsl(var(--primary))" 
          },
          data: {
            label: `${rel.source_column} → ${rel.target_column} [${typeLabel}]`,
            relation_type: rel.relation_type,
            impactActive: isWarning,
          },
        };
      });

    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(lNodes);
    setEdges(lEdges);
  }, [setNodes, setEdges]);

  // Add Table Visually
  const handleAddTable = (tableName: string) => {
    const nextActive = new Set(activeTables);
    nextActive.add(tableName);
    setActiveTables(nextActive);
    buildPlaygroundElements(dbTables, dbRels, nextActive);
  };

  // Trigger Deletion Wave (Visual Pulse + Dialog)
  const triggerDeleteWave = async (tableName: string) => {
    setDeletingTable(tableName);
    setSimulating(true);

    // Apply visual delete/wave animation state immediately to nodes & edges
    buildPlaygroundElements(dbTables, dbRels, activeTables, tableName);

    // Run Backend Impact Simulation
    try {
      const res = await simulateSchemaChangeAction(
        decodedConnectionId,
        session?.user?.id,
        "drop_table",
        tableName
      );
      if (res.success && res.data) {
        setSimulationResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  // Cancel Deletion and restore original styles
  const cancelDelete = () => {
    setDeletingTable(null);
    setSimulationResult(null);
    buildPlaygroundElements(dbTables, dbRels, activeTables, null);
  };

  // Confirm Deletion and remove from canvas
  const confirmDelete = () => {
    if (!deletingTable) return;
    const nextActive = new Set(activeTables);
    nextActive.delete(deletingTable);
    setActiveTables(nextActive);
    
    // Build elements with updated list and no warning nodes
    buildPlaygroundElements(dbTables, dbRels, nextActive, null);
    
    setDeletingTable(null);
    setSimulationResult(null);
  };

  // DFS cycle checking helper
  const checkCycle = useCallback((startNode: string, targetNode: string, currentEdges: Edge[]): boolean => {
    const adjList: Record<string, string[]> = {};
    currentEdges.forEach((edge) => {
      if (!adjList[edge.source]) adjList[edge.source] = [];
      adjList[edge.source].push(edge.target);
    });

    const visited = new Set<string>();
    const dfs = (curr: string): boolean => {
      if (curr === startNode) return true;
      if (visited.has(curr)) return false;
      visited.add(curr);

      const neighbors = adjList[curr] || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }
      return false;
    };

    return dfs(targetNode);
  }, []);

  // Handle visual drawing connections
  const onConnect = useCallback((connection: any) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target) return;
    if (source === target) return;

    // Check duplicate
    const duplicate = edges.some(e => e.source === source && e.target === target);
    if (duplicate) return;

    const createsCycle = checkCycle(source, target, edges);

    const cleanSourceField = sourceHandle?.replace(`${source}.`, '')?.replace('-source', '') || 'id';
    const cleanTargetField = targetHandle?.replace(`${target}.`, '')?.replace('-target', '') || 'id';

    const newEdgeId = `e-user-${Date.now()}`;
    const newEdge: Edge = {
      id: newEdgeId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: "playgroundEdge",
      animated: true,
      data: {
        label: `${cleanSourceField} → ${cleanTargetField} [New]`,
        relation_type: "one_to_many",
        isNew: true,
      },
    };

    setPendingConnection(newEdge);

    if (createsCycle) {
      setLinkSimulationResult({
        riskLevel: "HIGH",
        summary: `⚠️ Circular dependency loop detected between '${source}' and '${target}'!`,
        recommendation: "Avoid circular constraints: circular paths make cascade updates and insertions complex, requiring nullable foreign keys or temporary constraint disablement.",
        lineageText: `Circular path found: '${target}' is already upstream of '${source}'. Connecting '${source}' back to '${target}' creates a bi-directional cycle.`,
      });
    } else {
      setLinkSimulationResult({
        riskLevel: "LOW",
        summary: `New join path established: '${source}' ➔ '${target}'`,
        recommendation: "Check field data types (e.g. integer vs text). Ensure target column has index optimized for join speeds.",
        lineageText: `Data path established: '${target}' is now downstream of '${source}'. Integrates successfully into custom query generator.`,
      });
    }
  }, [edges, checkCycle]);

  const confirmLink = () => {
    if (!pendingConnection) return;
    setEdges((eds) => eds.concat(pendingConnection));
    setPendingConnection(null);
    setLinkSimulationResult(null);
  };

  const cancelLink = () => {
    setPendingConnection(null);
    setLinkSimulationResult(null);
  };

  // Reset Model back to original connection state
  const resetPlayground = () => {
    const initialActive = new Set(dbTables.slice(0, 5).map(t => t.name));
    setActiveTables(initialActive);
    buildPlaygroundElements(dbTables, dbRels, initialActive, null);
  };

  const handleConnectionChange = (newConn: string) => {
    if (!newConn) return;
    router.push(`/dashboard/playground/${encodeURIComponent(newConn)}`);
  };

  const inactiveTables = useMemo(() => {
    return dbTables.filter((t) => !activeTables.has(t.name));
  }, [dbTables, activeTables]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Interactive Design Playground
              <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full uppercase font-mono font-semibold animate-pulse">
                Sandbox
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add and delete schema entities visually. Confirming drops simulates schema-integrity blast radius reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={resetPlayground} className="h-9 text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Canvas
            </Button>

            <select
              className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none shadow-sm"
              onChange={(e) => handleConnectionChange(e.target.value)}
              value={decodedConnectionId}
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="flex flex-wrap items-center justify-between p-3 border rounded-xl bg-card shadow-sm mb-4 text-xs gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-muted-foreground font-medium">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-primary rounded" />
              <span className="text-muted-foreground font-mono">1:N Relationship</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-sky-500 rounded" />
              <span className="text-muted-foreground font-mono">1:1 Relationship</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 border-b-2 border-dashed border-purple-500" />
              <span className="text-muted-foreground font-mono text-purple-600 dark:text-purple-400">Polymorphic</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 border-b-2 border-red-500 animate-pulse" />
              <span className="text-red-500 font-mono font-bold">Blast Radius Wave</span>
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
            <HelpCircle className="w-3.5 h-3.5" /> Click table header delete buttons to see warning ripples.
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Main Visual Board */}
          <div className="flex-1 border rounded-2xl bg-muted/5 relative overflow-hidden shadow-inner min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {!loading && dbTables.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <Table2 className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Sync database schemas first</p>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              connectionLineType={ConnectionLineType.SmoothStep}
              proOptions={proOptions}
              fitView
            >
              <Background gap={20} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          {/* Add Table visual slider sidebar */}
          <Card className="w-72 border flex flex-col bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground">Add to Model</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {inactiveTables.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">All schema tables on canvas</p>
              ) : (
                inactiveTables.map((table) => (
                  <div
                    key={table.name}
                    className="p-2 border rounded-lg bg-background flex items-center justify-between hover:border-primary/50 hover:bg-primary/5 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <Table2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium font-mono">{table.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-6 h-6 border-primary/40 text-primary hover:bg-primary hover:text-white rounded-full shrink-0"
                      onClick={() => handleAddTable(table.name)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Dynamic Impact Simulation dialog */}
        <Dialog open={deletingTable !== null} onOpenChange={(open) => { if (!open) cancelDelete(); }}>
          <DialogContent className="max-w-2xl bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500 font-bold">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Table Deletion Blast Radius Report
              </DialogTitle>
              <DialogDescription className="text-xs">
                Simulating visual drop of table <span className="font-mono text-primary font-bold">{deletingTable}</span>
              </DialogDescription>
            </DialogHeader>

            {simulating ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-xs text-muted-foreground font-mono">Tracing foreign key references and API routes…</p>
              </div>
            ) : (
              simulationResult && (
                <div className="space-y-4 py-2">
                  <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border bg-muted/40">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Integrity Summary</p>
                      <p className="text-xs font-medium">{simulationResult.summary}</p>
                    </div>
                    <Badge className={`${RISK_STYLES[simulationResult.riskLevel]} border text-[10px] font-bold shrink-0`}>
                      {simulationResult.riskLevel} RISK
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    {/* FK impacts */}
                    <Card className="p-3 bg-background/50 space-y-2">
                      <h4 className="font-bold flex items-center gap-1.5 text-primary">
                        <GitBranch className="w-3.5 h-3.5" /> FK Constraint Breakers ({simulationResult.foreignKeyImpacts.length})
                      </h4>
                      {simulationResult.foreignKeyImpacts.length > 0 ? (
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {simulationResult.foreignKeyImpacts.map((fk, i) => (
                            <li key={i} className="p-1.5 rounded bg-muted/65 border font-mono text-[9px] text-muted-foreground leading-relaxed">
                              <span className="font-bold text-red-500">{fk.from}</span> → {fk.to}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No schema FK constraints will fail.</p>
                      )}
                    </Card>

                    {/* API Endpoints */}
                    <Card className="p-3 bg-background/50 space-y-2">
                      <h4 className="font-bold flex items-center gap-1.5 text-primary">
                        <Code2 className="w-3.5 h-3.5" /> Affected API Routes ({simulationResult.apiEndpoints.length})
                      </h4>
                      {simulationResult.apiEndpoints.length > 0 ? (
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {simulationResult.apiEndpoints.map((ep) => (
                            <li key={ep.slug} className="p-1.5 rounded bg-muted/65 border text-[10px] text-muted-foreground">
                              <span className="font-mono font-bold text-primary">{ep.url}</span>
                              <p className="text-[9px] mt-0.5 opacity-80">Ref: {ep.matchedTerms.join(", ")}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No custom routes reference this table.</p>
                      )}
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card className="p-3 bg-background/50 space-y-2 text-xs">
                    <h4 className="font-bold flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" /> Safe Execution Recommendations
                    </h4>
                    <ul className="space-y-1 text-[10px] text-muted-foreground">
                      {simulationResult.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-primary font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
              )
            )}

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button variant="outline" size="sm" onClick={cancelDelete}>
                Keep Table & Stop Waves
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={simulating}>
                Confirm Deletion (Animate Out)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Connection Impact Simulation dialog */}
        <Dialog open={pendingConnection !== null} onOpenChange={(open) => { if (!open) cancelLink(); }}>
          <DialogContent className="max-w-2xl bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-bold">
                <PlusCircle className="w-5 h-5 text-primary" />
                Connection Impact Tracing
              </DialogTitle>
              <DialogDescription className="text-xs font-mono">
                Simulating visual join path from <span className="text-primary font-bold">{pendingConnection?.source}</span> to <span className="text-primary font-bold">{pendingConnection?.target}</span>
              </DialogDescription>
            </DialogHeader>

            {linkSimulationResult && (
              <div className="space-y-4 py-2">
                <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl border bg-muted/40">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Join Path Status</p>
                    <p className="text-xs font-medium font-mono">{linkSimulationResult.summary}</p>
                  </div>
                  <Badge className={`${RISK_STYLES[linkSimulationResult.riskLevel]} border text-[10px] font-bold shrink-0`}>
                    {linkSimulationResult.riskLevel} RISK
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  {/* Lineage details */}
                  <Card className="p-3 bg-background/50 space-y-2">
                    <h4 className="font-bold flex items-center gap-1.5 text-primary">
                      <GitBranch className="w-3.5 h-3.5" /> Lineage Path Impact
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed leading-relaxed">
                      {linkSimulationResult.lineageText}
                    </p>
                  </Card>

                  {/* Recommendations */}
                  <Card className="p-3 bg-background/50 space-y-2 text-xs">
                    <h4 className="font-bold flex items-center gap-1.5 text-amber-500">
                      <AlertTriangle className="w-3.5 h-3.5" /> Schema Engineering Advice
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed leading-relaxed">
                      {linkSimulationResult.recommendation}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button variant="outline" size="sm" onClick={cancelLink}>
                Discard Link
              </Button>
              <Button variant="default" size="sm" onClick={confirmLink}>
                Confirm & Draw Connection (Green Pulse)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
