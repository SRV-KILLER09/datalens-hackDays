"use client";

import { useState, useEffect, useCallback, useMemo, use, useRef } from "react";
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
import { getUserConnections, getDatabaseRelations, getConnectionStringById, getSampleRowsAction } from "../../../../actions/db";
import { getColumnLineage } from "../../../../actions/graphQueries";
import { authClient } from "@/src/components/landing/auth";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Loader2, Table2, Network, Columns3, Search, AlertTriangle } from "lucide-react";

const HARDCODED_URI = process.env.NEXT_PUBLIC_FALLBACK_URI || "";
const DEMO_CONN = "demo-mode";
const DEMO_NEON = "demo-neon-db";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], columnMode: boolean) => {
  const nodeHeight = columnMode ? 320 : 250;
  dagreGraph.setGraph({ rankdir: "LR", nodesep: columnMode ? 150 : 100, ranksep: columnMode ? 300 : 250 });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 250, height: nodeHeight }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: nodeWithPosition.x - 125, y: nodeWithPosition.y - nodeHeight / 2 },
    };
  });
  return { nodes: layoutedNodes, edges };
};

function ColumnEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
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
  
  let labelClass = "border-primary/30 text-primary";
  if (isPoly) {
    labelClass = "border-purple-500/30 text-purple-500 dark:text-purple-400";
  } else if (isOneToOne) {
    labelClass = "border-sky-500/30 text-sky-500 dark:text-sky-400";
  }

  return (
    <>
      <path id={id} className="react-flow__edge-path" d={edgePath} style={style} markerEnd={markerEnd} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono bg-card border shadow-sm ${labelClass}`}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const TableNode = ({ data }: any) => {
  const columnMode = data.columnMode;
  const highlighted = data.highlightedColumns as Set<string> | undefined;
  const selectedColumn = data.selectedColumn as string | undefined;

  return (
    <div className="relative">
      {!columnMode && (
        <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-primary border-2 border-background" />
      )}
      <Card className={`min-w-[220px] border-primary/20 shadow-2xl bg-card overflow-hidden ${data.isHighlighted ? "ring-2 ring-primary" : ""}`}>
        <div className="bg-primary/10 px-3 py-2 border-b border-primary/10 flex items-center gap-2">
          <Table2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-widest">{data.label}</span>
        </div>
        <div className="p-2 space-y-0.5 bg-background/50 max-h-[280px] overflow-y-auto">
          {data.columns.map((col: { name: string; isFk?: boolean; isPk?: boolean; isPoly?: boolean }) => {
            const colId = `${data.label}.${col.name}`;
            const isHighlighted = highlighted?.has(colId);
            const isSelected = selectedColumn === colId;
            const isFk = col.isFk || col.name.toLowerCase().includes("id") || col.isPoly;

            return (
              <div key={col.name} className="relative">
                {columnMode && (
                  <>
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={`${data.label}.${col.name}-target`}
                      className="!w-2 !h-2 !bg-blue-500 !border-background"
                      style={{ top: "50%" }}
                    />
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={`${data.label}.${col.name}-source`}
                      className="!w-2 !h-2 !bg-primary !border-background"
                      style={{ top: "50%" }}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => data.onColumnClick?.(data.label, col.name)}
                  className={`w-full text-[10px] font-mono flex items-center justify-between px-1.5 py-1 rounded transition-colors ${
                    isSelected
                      ? "bg-primary/20 text-primary font-bold"
                      : isHighlighted
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className={isFk ? "text-primary font-bold" : ""}>{col.name}</span>
                  <span className="flex gap-0.5">
                    {col.isPk && <span className="text-[7px] bg-primary/10 text-primary px-1 rounded font-bold">PK</span>}
                    {col.isFk && !col.isPoly && <span className="text-[7px] bg-blue-500/10 text-blue-500 px-1 rounded font-bold">FK</span>}
                    {col.isPoly && <span className="text-[7px] bg-purple-500/10 text-purple-500 px-1 rounded font-bold">POLY</span>}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </Card>
      {!columnMode && (
        <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-primary border-2 border-background" />
      )}
    </div>
  );
};

const nodeTypes = { table: TableNode };
const edgeTypes = { column: ColumnEdge };
const proOptions = { hideAttribution: true };

type Relation = {
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  relation_type?: string;
};

export default function LineageDynamicPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = use(params);
  const decodedConnectionId = decodeURIComponent(connectionId);
  
  const router = useRouter();
  const { data: session, isPending: authLoading } = authClient.useSession();
  
  const [connections, setConnections] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "column">("table");
  const [relations, setRelations] = useState<Relation[]>([]);
  const [tableGroups, setTableGroups] = useState<Record<string, { name: string; isFk: boolean; isPk: boolean }[]>>({});
  const [columnSearch, setColumnSearch] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<{ table: string; column: string } | null>(null);
  const [lineageInfo, setLineageInfo] = useState<any>(null);
  const [loadingLineage, setLoadingLineage] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);

  // Hover table preview state
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    loading: boolean;
    rows?: any[];
    error?: string;
    tableName?: string;
  } | null>(null);

  const cachedSamples = useRef<Record<string, any[]>>({});
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeMouseEnter = useCallback(async (event: React.MouseEvent, node: Node) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    const tableName = node.id;
    setHoveredTable(tableName);
    
    if (cachedSamples.current[tableName]) {
      setPreviewData({
        loading: false,
        rows: cachedSamples.current[tableName],
        tableName,
      });
      return;
    }

    setPreviewData({
      loading: true,
      tableName,
    });

    try {
      const res = await getSampleRowsAction(decodedConnectionId, tableName, session?.user?.id);
      if (res.success && res.data) {
        cachedSamples.current[tableName] = res.data;
        setPreviewData((prev) => {
          if (prev?.tableName === tableName) {
            return {
              loading: false,
              rows: res.data,
              tableName,
            };
          }
          return prev;
        });
      } else {
        setPreviewData((prev) => {
          if (prev?.tableName === tableName) {
            return {
              loading: false,
              error: res.error || "Failed to load rows",
              tableName,
            };
          }
          return prev;
        });
      }
    } catch (err: any) {
      setPreviewData((prev) => {
        if (prev?.tableName === tableName) {
          return {
            loading: false,
            error: err.message || "An error occurred",
            tableName,
          };
        }
        return prev;
      });
    }
  }, [decodedConnectionId, session]);

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTable(null);
      setPreviewData(null);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);


  // Load user connections
  useEffect(() => {
    if (!authLoading) {
      if (session?.user?.id) {
        getUserConnections(session.user.id).then((res) => {
          if (res.success) {
            const userConns = res.data || [];
            const demoConn = { id: DEMO_NEON, name: "Demo eCommerce Database (Neon)", isDemo: true };
            setConnections([demoConn, ...userConns.filter(c => c.id !== DEMO_NEON)]);
          }
        });
      }
    }
  }, [session, authLoading]);

  const highlightedColumns = useMemo(() => {
    const set = new Set<string>();
    if (!selectedColumn || !lineageInfo) return set;
    set.add(`${selectedColumn.table}.${selectedColumn.column}`);
    lineageInfo.upstream?.forEach((n: any) => set.add(`${n.table}.${n.column}`));
    lineageInfo.downstream?.forEach((n: any) => set.add(`${n.table}.${n.column}`));
    return set;
  }, [selectedColumn, lineageInfo]);

  const handleColumnClick = useCallback(async (table: string, column: string) => {
    setSelectedColumn({ table, column });
    if (!decodedConnectionId || decodedConnectionId === DEMO_CONN || decodedConnectionId === DEMO_NEON) return;

    setLoadingLineage(true);
    const info = await getColumnLineage(table, column, decodedConnectionId);
    setLineageInfo(info);
    setLoadingLineage(false);
  }, [decodedConnectionId]);

  const buildGraph = useCallback((
    tableGroups: Record<string, { name: string; isFk: boolean; isPk: boolean }[]>,
    rels: Relation[],
    mode: "table" | "column",
    onColClick: (t: string, c: string) => void,
    highlighted: Set<string>,
    focused: { table: string; column: string } | null,
  ) => {
    const highlightedTables = new Set<string>();
    if (focused) {
      highlightedTables.add(focused.table);
      rels.forEach((r) => {
        if (r.source_table === focused.table && r.source_column === focused.column) highlightedTables.add(r.target_table);
        if (r.target_table === focused.table && r.target_column === focused.column) highlightedTables.add(r.source_table);
      });
    }

    const initialNodes: Node[] = Object.entries(tableGroups).map(([name, columns]) => ({
      id: name,
      type: "table",
      position: { x: 0, y: 0 },
      data: {
        label: name,
        columns,
        columnMode: mode === "column",
        onColumnClick: onColClick,
        highlightedColumns: highlighted,
        selectedColumn: focused ? `${focused.table}.${focused.column}` : undefined,
        isHighlighted: highlightedTables.has(name),
      },
    }));

    let initialEdges: Edge[];

    if (mode === "column") {
      initialEdges = rels.map((rel, i) => {
        const isPoly = rel.relation_type === "polymorphic";
        const isOneToOne = rel.relation_type === "one_to_one";
        const isHighlighted = highlighted.size > 0 &&
          (highlighted.has(`${rel.source_table}.${rel.source_column}`) ||
            highlighted.has(`${rel.target_table}.${rel.target_column}`));

        let strokeColor = "hsl(var(--muted-foreground) / 0.4)";
        let strokeDasharray = undefined;
        let strokeWidth = isHighlighted ? 2.5 : 1.5;

        if (isPoly) {
          strokeColor = isHighlighted ? "rgb(168, 85, 247)" : "rgba(168, 85, 247, 0.4)";
          strokeDasharray = "5 5";
        } else if (isOneToOne) {
          strokeColor = isHighlighted ? "rgb(56, 189, 248)" : "rgba(56, 189, 248, 0.4)";
        } else {
          strokeColor = isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)";
        }

        let typeLabel = "1:N";
        if (isPoly) typeLabel = "Poly";
        if (isOneToOne) typeLabel = "1:1";

        return {
          id: `e-${i}`,
          source: rel.source_table,
          target: rel.target_table,
          sourceHandle: `${rel.source_table}.${rel.source_column}-source`,
          targetHandle: `${rel.target_table}.${rel.target_column}-target`,
          type: "column",
          animated: true,
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            width: 16, 
            height: 16, 
            color: isPoly ? "rgb(168, 85, 247)" : isOneToOne ? "rgb(56, 189, 248)" : "hsl(var(--primary))" 
          },
          style: {
            stroke: strokeColor,
            strokeDasharray,
            strokeWidth,
          },
          data: { 
            label: `${rel.source_column} → ${rel.target_column} [${typeLabel}]`,
            relation_type: rel.relation_type
          },
        };
      });
    } else {
      const seen = new Set<string>();
      initialEdges = rels.reduce<Edge[]>((acc, rel, i) => {
        const key = `${rel.source_table}->${rel.target_table}`;
        if (seen.has(key)) return acc;
        seen.add(key);

        const isPoly = rel.relation_type === "polymorphic";
        const isOneToOne = rel.relation_type === "one_to_one";

        acc.push({
          id: `e-${i}`,
          source: rel.source_table,
          target: rel.target_table,
          animated: true,
          type: ConnectionLineType.SmoothStep,
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            width: 20, 
            height: 20, 
            color: isPoly ? "rgb(168, 85, 247)" : isOneToOne ? "rgb(56, 189, 248)" : "hsl(var(--primary))" 
          },
          style: { 
            stroke: isPoly ? "rgb(168, 85, 247)" : isOneToOne ? "rgb(56, 189, 248)" : "hsl(var(--primary))", 
            strokeWidth: 2,
            strokeDasharray: isPoly ? "5 5" : undefined
          },
        });
        return acc;
      }, []);
    }

    const { nodes: lNodes, edges: lEdges } = getLayoutedElements(initialNodes, initialEdges, mode === "column");
    setNodes(lNodes as Node[]);
    setEdges(lEdges as Edge[]);
  }, [setNodes, setEdges]);

  const visualizeLineage = useCallback(async (connId: string) => {
    if (!connId) return;
    setLoading(true);
    setSelectedColumn(null);
    setLineageInfo(null);

    try {
      let uri = "";
      if (connId === DEMO_CONN || connId === DEMO_NEON) {
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

        setRelations(rels);
        setTableGroups(newTableGroups);
        buildGraph(newTableGroups, rels, viewMode, handleColumnClick, highlightedColumns, selectedColumn);
      }
    } catch (err) {
      console.error("Lineage Error:", err);
    } finally {
      setLoading(false);
    }
  }, [session, viewMode, handleColumnClick, highlightedColumns, selectedColumn, buildGraph]);

  // Load initial graph on connectionId load
  useEffect(() => {
    if (decodedConnectionId && !authLoading) {
      visualizeLineage(decodedConnectionId);
    }
  }, [decodedConnectionId, authLoading, visualizeLineage]);

  useEffect(() => {
    if (!decodedConnectionId || relations.length === 0 || Object.keys(tableGroups).length === 0) return;
    buildGraph(tableGroups, relations, viewMode, handleColumnClick, highlightedColumns, selectedColumn);
  }, [viewMode, highlightedColumns, selectedColumn, relations, tableGroups, buildGraph, handleColumnClick, decodedConnectionId]);

  const handleConnectionChange = (newConnId: string) => {
    if (!newConnId) return;
    router.push(`/dashboard/lineage/${encodeURIComponent(newConnId)}`);
  };

  const filteredColumns = useMemo(() => {
    if (!columnSearch.trim()) return [];
    const q = columnSearch.toLowerCase();
    const results: { table: string; column: string }[] = [];
    relations.forEach((r) => {
      if (r.source_column.toLowerCase().includes(q)) results.push({ table: r.source_table, column: r.source_column });
      if (r.target_column.toLowerCase().includes(q)) results.push({ table: r.target_table, column: r.target_column });
    });
    return results.slice(0, 8);
  }, [columnSearch, relations]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Lineage</h1>
            <p className="text-sm text-muted-foreground">
              {viewMode === "column"
                ? "Column-level FK mapping — click a column to trace upstream/downstream impact."
                : "Table-level ER diagram showing how tables connect."}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
              <span className="text-muted-foreground font-medium">Relationship Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-primary rounded" />
                <span className="text-muted-foreground font-mono">One-to-Many (1:N)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-sky-500 rounded" />
                <span className="text-muted-foreground font-mono">One-to-One (1:1)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 border-b-2 border-dashed border-purple-500" />
                <span className="text-muted-foreground font-mono text-purple-600 dark:text-purple-400">Polymorphic</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-input overflow-hidden">
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                className="rounded-none h-9 text-xs"
                onClick={() => setViewMode("table")}
              >
                <Network className="w-3.5 h-3.5 mr-1.5" /> Table View
              </Button>
              <Button
                size="sm"
                variant={viewMode === "column" ? "default" : "ghost"}
                className="rounded-none h-9 text-xs"
                onClick={() => setViewMode("column")}
              >
                <Columns3 className="w-3.5 h-3.5 mr-1.5" /> Column View
              </Button>
            </div>

            <select
              className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none"
              onChange={(e) => handleConnectionChange(e.target.value)}
              value={decodedConnectionId}
            >
              <option value="">Select Connection...</option>
              {session && (
                <>
                  <option value={DEMO_NEON}>✨ Demo eCommerce Database (Neon)</option>
                  {connections.filter(c => c.id !== DEMO_NEON).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </>
              )}
              {!session && <option value={DEMO_CONN}>✨ Guest Mode (Demo)</option>}
            </select>
          </div>
        </div>

        {viewMode === "column" && (
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search columns (e.g. user_id)..."
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none"
              />
              {filteredColumns.length > 0 && columnSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
                  {filteredColumns.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted transition-colors"
                      onClick={() => {
                        handleColumnClick(c.table, c.column);
                        setColumnSearch(`${c.table}.${c.column}`);
                      }}
                    >
                      <span className="text-muted-foreground">{c.table}.</span>
                      <span className="text-primary font-bold">{c.column}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedColumn && (
              <Card className="flex-1 px-4 py-2 flex items-center gap-4 border-primary/20 bg-primary/5">
                {loadingLineage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Focus: </span>
                      <span className="font-mono font-bold text-primary">{selectedColumn.table}.{selectedColumn.column}</span>
                    </div>
                    {lineageInfo && (
                      <>
                        <div className="text-xs text-muted-foreground">
                          ↑ {lineageInfo.upstream?.length ?? 0} upstream · ↓ {lineageInfo.downstream?.length ?? 0} downstream
                        </div>
                        {lineageInfo.affectedCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {lineageInfo.affectedCount} related column{lineageInfo.affectedCount !== 1 ? "s" : ""} affected
                          </div>
                        )}
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => { setSelectedColumn(null); setLineageInfo(null); }}>
                      Clear
                    </Button>
                  </>
                )}
              </Card>
            )}
          </div>
        )}

        <div className="flex-1 border rounded-2xl bg-muted/5 relative overflow-hidden shadow-inner">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!decodedConnectionId && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Network className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a connection to view lineage map</p>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            proOptions={proOptions}
            fitView
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>

          {/* Floating Hover Preview Card */}
          <AnimatePresence>
            {hoveredTable && previewData && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-4 right-4 z-40 w-[380px] md:w-[480px] max-h-[250px] bg-card/95 backdrop-blur-md border border-primary/20 shadow-2xl rounded-xl overflow-hidden flex flex-col pointer-events-none"
              >
                <div className="bg-primary/10 px-3 py-2 border-b border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Table2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {hoveredTable}
                    </span>
                  </div>
                  <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-mono">
                    Sample Data (First 2 Rows)
                  </span>
                </div>
                
                <div className="p-3 overflow-auto flex-1 text-xs">
                  {previewData.loading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-[10px] text-muted-foreground font-mono">Loading records...</span>
                    </div>
                  ) : previewData.error ? (
                    <div className="flex items-center justify-center py-6 gap-1.5 text-red-500 font-mono text-[10px]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{previewData.error}</span>
                    </div>
                  ) : !previewData.rows || previewData.rows.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-muted-foreground font-mono">
                      No rows found in this table.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-lg bg-background/50">
                      <table className="w-full text-left border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            {Object.keys(previewData.rows[0]).map((colName) => (
                              <th key={colName} className="p-1.5 border-r last:border-r-0 font-bold text-muted-foreground truncate max-w-[120px]" title={colName}>
                                {colName}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b last:border-b-0 hover:bg-muted/10">
                              {Object.entries(row).map(([colName, val]: any, cellIndex) => {
                                const displayVal = val === null ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                                return (
                                  <td key={cellIndex} className="p-1.5 border-r last:border-r-0 truncate max-w-[120px]" title={displayVal}>
                                    <span className={val === null ? 'text-muted-foreground/50 italic' : ''}>
                                      {displayVal}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
