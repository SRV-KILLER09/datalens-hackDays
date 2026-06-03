"use client";

import { useEffect, useState, use, useRef } from "react";
import { Loader2, ArrowLeft, Database, Search, LayoutTemplate, Activity, CheckCircle2, Shield, Link, AlertTriangle, BookOpen, Lock, Sparkles, Printer, TrendingUp, Network } from "lucide-react";
// @ts-ignore
import ReactMarkdown from "react-markdown";
// @ts-ignore
import remarkGfm from "remark-gfm";
import { getSchemaDocumentation } from "@/src/actions/db";
import { getOrGenerateBusinessReport } from "@/src/actions/rag";
import { Button } from "@/src/components/ui/button";
import NextLink from "next/link";
import { authClient } from "@/src/components/landing/auth";

interface QualityIssue {
    severity: "critical" | "warning";
    table: string;
    column: string;
    issue: string;
    suggestion: string;
}

interface ReportData {
    domain: string;
    overview: string;
    keyFindings: string[];
    recommendations: string[];
    dataGovernance: string;
    overallAssessment: string;
    tableCount: number;
    columnCount: number;
    totalRows: number;
    healthScore: number;
    piiCount: number;
    relationsCount: number;
    qualityIssues: QualityIssue[];
}

function ExecutiveOverviewCard({ report }: { report: ReportData }) {
    return (
        <div className="border border-border bg-card/40 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden transition-all duration-300 hover:border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Executive Overview</h2>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono self-start sm:self-auto">
                    {report.domain}
                </span>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground mt-4 mb-6">
                {report.overview}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Key Findings</h3>
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                        {report.keyFindings?.map((finding, i) => (
                            <li key={i} className="flex gap-2 leading-relaxed">
                                <span className="text-primary font-bold">→</span>
                                <span>{finding}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Recommendations</h3>
                    </div>
                    <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                        {report.recommendations?.map((rec, i) => (
                            <li key={i} className="flex gap-2 leading-relaxed">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {report.dataGovernance && (
                <div className="mt-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-xs sm:text-sm leading-relaxed flex gap-3">
                    <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold uppercase text-[10px] tracking-wider block mb-1">Data Governance</span>
                        {report.dataGovernance}
                    </div>
                </div>
            )}

            <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium leading-relaxed">
                <span className="font-bold text-foreground">Overall Assessment:</span> {report.overallAssessment}
            </div>
        </div>
    );
}

function MetricsGrid({ report }: { report: ReportData }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-card border border-border border-l-4 border-l-blue-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-blue-500/5 transition-all">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <LayoutTemplate className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">{report.tableCount}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tables</p>
                </div>
            </div>

            <div className="bg-card border border-border border-l-4 border-l-purple-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-purple-500/5 transition-all">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">{report.columnCount}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Columns</p>
                </div>
            </div>

            <div className="bg-card border border-border border-l-4 border-l-cyan-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-cyan-500/5 transition-all">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                    <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">
                        {report.totalRows?.toLocaleString() || 0}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rows</p>
                </div>
            </div>

            <div className="bg-card border border-border border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-emerald-500/5 transition-all">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">{report.healthScore}%</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Health</p>
                </div>
            </div>

            <div className="bg-card border border-border border-l-4 border-l-yellow-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-yellow-500/5 transition-all">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    <Shield className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">{report.piiCount}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">PII Cols</p>
                </div>
            </div>

            <div className="bg-card border border-border border-l-4 border-l-indigo-500 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-border/80 hover:shadow-md hover:shadow-indigo-500/5 transition-all">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                    <Link className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-lg font-black tracking-tight leading-none mb-1">{report.relationsCount}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">FK Links</p>
                </div>
            </div>
        </div>
    );
}

function QualityIssuesCard({ report }: { report: ReportData }) {
    const criticalCount = report.qualityIssues.filter(q => q.severity === "critical").length;
    const warningCount = report.qualityIssues.filter(q => q.severity === "warning").length;

    return (
        <div className="border border-border bg-card/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h2 className="text-sm font-bold tracking-tight text-foreground">Data Quality Audit Issues</h2>
                </div>
                <div className="flex gap-2">
                    {criticalCount > 0 && (
                        <span className="text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full">
                            {criticalCount} Critical
                        </span>
                    )}
                    {warningCount > 0 && (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                            {warningCount} Warnings
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {report.qualityIssues.map((issue, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl bg-card border border-border/45 hover:border-border hover:shadow-xs transition-all">
                        <span className={`text-[8px] font-bold tracking-wider px-2 py-0.5 rounded uppercase self-start sm:mt-0.5 ${
                            issue.severity === "critical" 
                                ? "bg-destructive/10 text-destructive border border-destructive/20" 
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                            {issue.severity}
                        </span>
                        <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-foreground leading-none">
                                <span className="font-mono text-primary text-[11px] bg-primary/5 px-1.5 py-0.5 rounded mr-1.5">{issue.table}</span>
                                — Column <span className="font-mono font-medium text-foreground/90">{issue.column}</span> {issue.issue.replace(/^(column|Column)\s+'?\w+'?\s+has\s+/, "has ")}
                            </p>
                            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                                {issue.suggestion}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function DocumentPortalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, isPending: authLoading } = authClient.useSession();

    const [docs, setDocs] = useState<{ tableName: string, content: string }[]>([]);
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTable, setActiveTable] = useState("");
    const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const toggleTableExpand = (tableName: string) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    const getTableFields = (content: string): { name: string; type: string }[] => {
        const fields: { name: string; type: string }[] = [];
        const lines = content.split("\n");
        let inFieldsTable = false;
        for (const line of lines) {
            if (line.includes("|") && line.toLowerCase().includes("column") && line.toLowerCase().includes("type")) {
                inFieldsTable = true;
                continue;
            }
            if (inFieldsTable) {
                if (!line.includes("|")) {
                    if (fields.length > 0) {
                        inFieldsTable = false;
                    }
                    continue;
                }
                if (line.includes("---")) {
                    continue;
                }
                const parts = line.split("|").map(p => p.trim());
                if (parts.length >= 3) {
                    const name = parts[1].replace(/`/g, "").trim();
                    const type = parts[2].replace(/`/g, "").trim();
                    if (name && name.toLowerCase() !== "column" && !name.includes("---")) {
                        fields.push({ name, type });
                    }
                }
            }
        }
        return fields;
    };

    useEffect(() => {
        if (authLoading) return;
        async function loadData() {
            setLoading(true);
            try {
                const userId = session?.user?.id || "";
                const [docsRes, reportRes] = await Promise.all([
                    getSchemaDocumentation(id, userId),
                    getOrGenerateBusinessReport(id, userId)
                ]);
                if (docsRes.success && docsRes.data) {
                    setDocs(docsRes.data as { tableName: string, content: string }[]);
                } else {
                    setError(docsRes.error || "Failed to load documentation.");
                }
                if (reportRes.success && reportRes.data) {
                    setReport(reportRes.data);
                }
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, session, authLoading]);

    const scrollToSection = (sectionId: string, tableName: string) => {
        setActiveTable(tableName);
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const filteredDocs = docs.filter(doc => {
        if (doc.tableName === "__business_report__") return false;
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        
        // Match table name
        if (doc.tableName.toLowerCase().includes(query)) return true;
        
        // Match fields or types
        const fields = getTableFields(doc.content);
        const hasMatchedField = fields.some(f => 
            f.name.toLowerCase().includes(query) || 
            f.type.toLowerCase().includes(query)
        );
        if (hasMatchedField) return true;

        // Fallback to general content match
        return doc.content.toLowerCase().includes(query);
    });

    const getTypeCounts = () => {
        const counts: Record<string, number> = {};
        docs.forEach(doc => {
            if (doc.tableName === "__business_report__") return;
            const typeRegex = /\|\s*[^|]+\s*\|\s*([^|]+)\s*\|/g;
            let match;
            while ((match = typeRegex.exec(doc.content)) !== null) {
                const typeStr = match[1].toLowerCase().trim();
                let normalizedType = "Other";
                if (typeStr.includes("int") || typeStr.includes("serial")) normalizedType = "Numeric";
                else if (typeStr.includes("char") || typeStr.includes("text")) normalizedType = "String";
                else if (typeStr.includes("date") || typeStr.includes("time")) normalizedType = "Temporal";
                else if (typeStr.includes("bool")) normalizedType = "Boolean";
                else if (typeStr.includes("numeric") || typeStr.includes("double") || typeStr.includes("float") || typeStr.includes("real")) normalizedType = "Numeric";
                counts[normalizedType] = (counts[normalizedType] || 0) + 1;
            }
        });
        return counts;
    };

    const getRelations = () => {
        const relations: { from: string; to: string }[] = [];
        docs.forEach(doc => {
            if (doc.tableName === "__business_report__") return;
            const lines = doc.content.split("\n");
            lines.forEach(line => {
                if (line.includes("→")) {
                    const match = line.match(/`([^`]+)`\s*→\s*`([^`.]+)\.[^`]+`/);
                    if (match) {
                        relations.push({ from: doc.tableName, to: match[2] });
                    }
                }
            });
        });
        return relations;
    };

    const renderNetworkGraph = () => {
        const validDocs = docs.filter(doc => doc.tableName !== "__business_report__");
        const N = validDocs.length;
        if (N === 0) return null;

        const width = 600;
        const height = 320;
        const cx = width / 2;
        const cy = height / 2;
        const rx = 200;
        const ry = 100;

        const nodes = validDocs.map((doc, i) => {
            const theta = (i / N) * 2 * Math.PI;
            return {
                name: doc.tableName,
                x: cx + rx * Math.cos(theta),
                y: cy + ry * Math.sin(theta)
            };
        });

        const parsedRelations = getRelations();

        return (
            <div className="bg-card/35 border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Network className="w-4.5 h-4.5 text-primary" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Interactive Entity Network</h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">Nodes: {N} | Edges: {parsedRelations.length}</span>
                </div>
                <div className="w-full overflow-x-auto flex justify-center py-2">
                    <svg width={width} height={height} className="overflow-visible select-none max-w-full">
                        {parsedRelations.map((rel, idx) => {
                            const fromNode = nodes.find(n => n.name === rel.from);
                            const toNode = nodes.find(n => n.name === rel.to);
                            if (!fromNode || !toNode) return null;

                            const isHighlighted = activeTable === rel.from || activeTable === rel.to;

                            return (
                                <path
                                    key={`edge-${idx}`}
                                    d={`M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`}
                                    fill="none"
                                    stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    strokeDasharray={isHighlighted ? "none" : "3 3"}
                                    className="transition-all duration-300"
                                    opacity={isHighlighted ? 0.95 : 0.25}
                                />
                            );
                        })}

                        {nodes.map((node) => {
                            const isActive = activeTable === node.name;
                            return (
                                <g 
                                    key={node.name}
                                    transform={`translate(${node.x}, ${node.y})`}
                                    onClick={() => scrollToSection(`table-section-${node.name}`, node.name)}
                                    className="cursor-pointer group/node"
                                >
                                    <circle 
                                        r={isActive ? 22 : 18} 
                                        className={`transition-all duration-300 ${
                                            isActive 
                                                ? "fill-primary stroke-primary-foreground stroke-2" 
                                                : "fill-muted stroke-border stroke-1 hover:stroke-primary hover:fill-muted/90"
                                        }`}
                                    />
                                    <Database 
                                        className={`w-4 h-4 -translate-x-2 -translate-y-2 pointer-events-none transition-colors ${
                                            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover/node:text-primary"
                                        }`} 
                                    />
                                    <text 
                                        y="30"
                                        textAnchor="middle" 
                                        className={`text-[9px] font-mono select-none font-semibold transition-colors ${
                                            isActive ? "fill-primary font-bold" : "fill-muted-foreground group-hover/node:fill-foreground"
                                        }`}
                                    >
                                        {node.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="w-12 h-12 animate-spin text-primary/50 mb-4" />
                <p className="text-sm font-semibold animate-pulse uppercase tracking-widest text-muted-foreground">Initializing Document Portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
                <div className="max-w-md w-full text-center p-8 bg-destructive/5 border border-destructive/20 rounded-2xl">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-foreground mb-2">Failed to load portal</h2>
                    <p className="text-sm text-muted-foreground mb-6">{error}</p>
                    <NextLink href={`/dashboard/tables/${id}`}>
                        <Button className="w-full gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Connection
                        </Button>
                    </NextLink>
                </div>
            </div>
        );
    }

    const typeCounts = getTypeCounts();
    const totalTypes = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = report ? circumference - ((report.healthScore || 100) / 100) * circumference : 0;

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            <style>{`
                @media print {
                    :root {
                        --background: 0 0% 5% !important;
                        --foreground: 0 0% 96% !important;
                        --card: 0 0% 8% !important;
                        --card-foreground: 0 0% 96% !important;
                        --popover: 0 0% 8% !important;
                        --popover-foreground: 0 0% 96% !important;
                        --primary: 145 72% 50% !important;
                        --primary-foreground: 0 0% 2% !important;
                        --secondary: 0 0% 12% !important;
                        --secondary-foreground: 0 0% 80% !important;
                        --muted: 0 0% 12% !important;
                        --muted-foreground: 0 0% 50% !important;
                        --accent: 145 72% 50% !important;
                        --accent-foreground: 0 0% 2% !important;
                        --destructive: 0 72% 55% !important;
                        --destructive-foreground: 0 0% 100% !important;
                        --border: 0 0% 16% !important;
                        --input: 0 0% 16% !important;
                        --ring: 145 72% 50% !important;
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background-color: #0d0d0d !important;
                        color: #f5f5f5 !important;
                    }
                    .flex.h-screen.overflow-hidden {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    main {
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background-color: #0d0d0d !important;
                    }
                    .print-container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 40px 30px !important;
                        margin: 0 !important;
                        background-color: #0d0d0d !important;
                    }
                    aside, .no-print, button {
                        display: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .bg-card, 
                    .bg-card\/20, 
                    .bg-card\/35, 
                    .bg-card\/40 {
                        background-color: #141414 !important;
                        border: 1px solid #242424 !important;
                        box-shadow: none !important;
                        padding: 24px !important;
                        margin-bottom: 24px !important;
                        border-radius: 12px !important;
                    }
                    .bg-card\/30 {
                        background-color: #141414 !important;
                        border: 1px solid #242424 !important;
                        border-radius: 12px !important;
                    }
                    .bg-background\/50 {
                        background-color: #0d0d0d !important;
                    }
                    .bg-muted\/20, 
                    .bg-muted\/60 {
                        background-color: #1a1a1a !important;
                    }
                    .bg-primary\/5,
                    .bg-primary\/10 {
                        background-color: #0a2618 !important;
                        color: #4ade80 !important;
                        border-color: #14532d !important;
                    }
                    .bg-destructive\/10 {
                        background-color: #450a0a !important;
                        color: #f87171 !important;
                        border-color: #7f1d1d !important;
                    }
                    .bg-amber-500\/10 {
                        background-color: #451a03 !important;
                        color: #fbbf24 !important;
                        border-color: #78350f !important;
                    }
                    .bg-blue-500\/10 {
                        background-color: #172554 !important;
                        color: #60a5fa !important;
                    }
                    .bg-purple-500\/10 {
                        background-color: #3b0764 !important;
                        color: #c084fc !important;
                    }
                    .bg-cyan-500\/10 {
                        background-color: #083344 !important;
                        color: #22d3ee !important;
                    }
                    .bg-emerald-500\/10 {
                        background-color: #064e3b !important;
                        color: #34d399 !important;
                    }
                    .bg-yellow-500\/10 {
                        background-color: #422006 !important;
                        color: #facc15 !important;
                    }
                    .bg-indigo-500\/10 {
                        background-color: #1e1b4b !important;
                        color: #818cf8 !important;
                    }
                    .border,
                    .border-border,
                    .border-border\/40,
                    .border-border\/45,
                    .border-r,
                    .border-t,
                    .border-b {
                        border-color: #242424 !important;
                    }
                    .divide-border\/30 > * + * {
                        border-color: #242424 !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    section {
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        margin-bottom: 32px !important;
                        border: 1px solid #242424 !important;
                        background-color: #141414 !important;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                        color: #ffffff !important;
                    }
                    #executive-overview > div,
                    .grid > div {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    thead {
                        display: table-header-group !important;
                        background-color: #1a1a1a !important;
                    }
                    thead th {
                        color: #ffffff !important;
                        font-weight: 700 !important;
                        border-bottom: 2px solid #333333 !important;
                    }
                    th, td {
                        border-bottom: 1px solid #242424 !important;
                        padding: 10px 14px !important;
                    }
                    table {
                        width: 100% !important;
                        table-layout: auto !important;
                        word-break: break-word !important;
                        font-size: 11px !important;
                    }
                    text {
                        fill: #f5f5f5 !important;
                    }
                    path[stroke="stroke"] {
                        stroke: #242424 !important;
                    }
                    .text-muted-foreground {
                        color: #a3a3a3 !important;
                    }
                    .text-foreground {
                        color: #f5f5f5 !important;
                    }
                }
            `}</style>

            <aside className="w-80 border-r border-border bg-card/20 flex flex-col shrink-0 no-print">
                <div className="p-5 border-b border-border space-y-4">
                    <NextLink href={`/dashboard/tables/${id}`} className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors gap-1.5 uppercase tracking-wider">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Connection
                    </NextLink>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Database className="w-4 h-4 text-primary" /> Reference Docs
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mt-0.5">Database: {id.slice(0, 8)}</p>
                    </div>
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search keywords, columns..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-14 py-2 text-xs rounded-lg border border-border bg-background/50 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
                        />
                        <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono bg-muted border border-border rounded text-muted-foreground/75 select-none pointer-events-none">
                            Ctrl+K
                        </kbd>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">General</p>
                        <button
                            onClick={() => scrollToSection("executive-overview", "")}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                activeTable === "" 
                                    ? "bg-primary text-primary-foreground shadow-xs font-semibold" 
                                    : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" /> Executive Overview
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tables</p>
                            {searchQuery && (
                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">
                                    {filteredDocs.length} matches
                                </span>
                            )}
                        </div>
                        <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                            {filteredDocs.map((doc) => {
                                const fields = getTableFields(doc.content);
                                const query = searchQuery.toLowerCase().trim();
                                const matchedFields = query
                                    ? fields.filter(f => f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query))
                                    : fields;
                                
                                const isExpanded = !!(query || expandedTables[doc.tableName]);
                                const hasFields = fields.length > 0;

                                return (
                                    <div key={doc.tableName} className="space-y-1">
                                        <button
                                            onClick={() => {
                                                scrollToSection(`table-section-${doc.tableName}`, doc.tableName);
                                                if (!query) {
                                                    toggleTableExpand(doc.tableName);
                                                }
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                                                activeTable === doc.tableName 
                                                    ? "bg-primary/10 text-primary border border-primary/20 font-bold" 
                                                    : "text-muted-foreground hover:bg-muted/50"
                                            }`}
                                        >
                                            <span className="truncate flex items-center gap-1.5">
                                                <span className="text-[9px] opacity-50 group-hover:opacity-80 transition-opacity">
                                                    {isExpanded ? "▼" : "▶"}
                                                </span>
                                                {doc.tableName}
                                            </span>
                                            <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity font-sans">
                                                {fields.length} cols
                                            </span>
                                        </button>

                                        {isExpanded && hasFields && (
                                            <div className="pl-5 pr-1 py-1 space-y-1 border-l border-border/50 ml-4 transition-all duration-200">
                                                {matchedFields.map((field) => {
                                                    const isFieldMatch = query && (
                                                        field.name.toLowerCase().includes(query) || 
                                                        field.type.toLowerCase().includes(query)
                                                    );
                                                    return (
                                                        <div 
                                                            key={field.name}
                                                            className={`text-[10px] font-mono flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-muted/30 transition-colors ${
                                                                isFieldMatch 
                                                                    ? "text-primary bg-primary/5 font-semibold" 
                                                                    : "text-muted-foreground/80"
                                                            }`}
                                                        >
                                                            <span className="truncate" title={field.name}>{field.name}</span>
                                                            <span className="text-[8px] opacity-60 ml-2 truncate max-w-[80px]" title={field.type}>{field.type}</span>
                                                        </div>
                                                    );
                                                })}
                                                {matchedFields.length === 0 && (
                                                    <div className="text-[9px] text-muted-foreground/60 italic pl-1.5 py-0.5">
                                                        No matching columns
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {filteredDocs.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground italic text-xs">
                                    No matches found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-card/30 flex flex-col relative">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px] pointer-events-none select-none no-print" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/2 rounded-full blur-[140px] pointer-events-none select-none no-print" />
                <div className="max-w-[1440px] w-full mx-auto px-6 py-10 sm:px-12 sm:py-16 space-y-12 print-container z-10">
                    <div id="executive-overview" className="space-y-8 scroll-mt-10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Database Reference Manual</h1>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Complete data governance, quality diagnostics, and schema structure dictionary.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2.5 items-center shrink-0 self-start sm:self-center">
                                <Button 
                                    onClick={() => window.print()} 
                                    className="no-print gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold h-9 shadow-md shadow-indigo-500/10"
                                >
                                    <Printer className="w-4 h-4" /> Download PDF
                                </Button>
                            </div>
                        </div>

                        {report && <ExecutiveOverviewCard report={report} />}

                        {report && (
                            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-stretch">
                                <div className="lg:col-span-4 flex flex-col">
                                    {renderNetworkGraph()}
                                </div>
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    <div className="bg-card/35 border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center flex-1 min-h-[170px]">
                                        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="48" cy="48" r={radius} className="stroke-muted fill-none" strokeWidth="6" />
                                                <circle 
                                                    cx="48" 
                                                    cy="48" 
                                                    r={radius} 
                                                    className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                                                    strokeWidth="6" 
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeOffset}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute text-center">
                                                <span className="text-lg font-black tracking-tight">{report.healthScore}%</span>
                                                <span className="text-[7px] text-muted-foreground uppercase block font-bold">Health</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Estimated Database Grade</p>
                                    </div>
                                    <div className="bg-card/35 border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-center flex-1">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Type Profile</span>
                                                <span className="text-[9px] font-bold text-foreground/80">{totalTypes} Fields</span>
                                            </div>
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                                                {Object.entries(typeCounts).map(([type, count], idx) => {
                                                    const pct = totalTypes > 0 ? (count / totalTypes) * 100 : 0;
                                                    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"];
                                                    const color = colors[idx % colors.length];
                                                    return (
                                                        <div 
                                                            key={type} 
                                                            className={`${color} h-full`} 
                                                            style={{ width: `${pct}%` }} 
                                                            title={`${type}: ${count} (${pct.toFixed(1)}%)`} 
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                {Object.entries(typeCounts).map(([type, count], idx) => {
                                                    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"];
                                                    const color = colors[idx % colors.length];
                                                    return (
                                                        <div key={type} className="flex items-center gap-1.5 text-[9px]">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                                                            <span className="text-muted-foreground font-medium truncate">{type}</span>
                                                            <span className="text-foreground/90 font-bold">({count})</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {report && <MetricsGrid report={report} />}

                        {report?.qualityIssues && report.qualityIssues.length > 0 && (
                            <QualityIssuesCard report={report} />
                        )}
                    </div>

                    <div className="space-y-12 pt-8 border-t border-border/40">
                        <div className="flex items-center gap-2.5 mb-2">
                            <Database className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Data Dictionary Table Schematics</h2>
                        </div>

                        {filteredDocs.map((doc) => (
                            <section
                                key={doc.tableName}
                                id={`table-section-${doc.tableName}`}
                                className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden scroll-mt-6"
                            >
                                <div className="flex items-center gap-3 px-6 py-4 bg-muted/20 border-b border-border">
                                    <Database className="w-4.5 h-4.5 text-primary" />
                                    <h2 className="font-bold text-base text-card-foreground tracking-tight">{doc.tableName}</h2>
                                </div>
                                <div className="p-6 sm:p-8">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-2xl font-black tracking-tight mb-6 mt-2 text-foreground border-l-4 border-primary pl-4" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold tracking-tight first:mt-0 mt-10 mb-4 pb-2 border-b border-border/60 text-foreground/90 uppercase" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-sm font-bold tracking-tight mt-8 mb-3 text-primary uppercase font-mono tracking-wider" {...props} />,
                                            p: ({ node, ...props }) => <p className="leading-relaxed text-sm text-muted-foreground/95 mb-5 max-w-none font-sans" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc [&>li]:mt-2 text-sm text-muted-foreground/90" {...props} />,
                                            li: ({ node, ...props }) => <li className="leading-relaxed hover:text-foreground transition-colors duration-150" {...props} />,
                                            code: ({ node, ...props }) => <code className="relative rounded bg-muted/65 px-2 py-0.5 font-mono text-xs text-primary font-semibold border border-primary/10" {...props} />,
                                            table: ({ node, ...props }) => (
                                                <div className="my-6 w-full overflow-x-auto rounded-xl border border-border bg-card/15 shadow-sm">
                                                    <table className="w-full text-xs sm:text-sm text-left border-collapse" {...props} />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead className="bg-muted/30 text-muted-foreground text-[10px] font-bold tracking-wider uppercase border-b border-border" {...props} />,
                                            th: ({ node, ...props }) => <th className="px-6 py-3.5 font-bold text-foreground/90" {...props} />,
                                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-border/25" {...props} />,
                                            tr: ({ node, ...props }) => <tr className="hover:bg-muted/10 transition-colors duration-150" {...props} />,
                                            td: ({ node, ...props }) => <td className="px-6 py-3.5 text-muted-foreground/90 align-middle border-t border-border/25" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                                        }}
                                    >
                                        {doc.content}
                                    </ReactMarkdown>
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
