"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, LayoutTemplate, Database } from "lucide-react";
// @ts-ignore
import ReactMarkdown from "react-markdown";
import { getSchemaDocumentation } from "@/src/actions/db";

export function DocumentationTab({ connectionId, userId }: { connectionId: string, userId: string }) {
    const [docs, setDocs] = useState<{ tableName: string, content: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDocs() {
            setLoading(true);
            try {
                const res = await getSchemaDocumentation(connectionId, userId);
                if (res.success && res.data) {
                    setDocs(res.data as { tableName: string, content: string }[]);
                } else {
                    setError(res.error || "Failed to load documentation.");
                }
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        }
        fetchDocs();
    }, [connectionId, userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card border border-dashed rounded-xl mt-6">
                <Loader2 className="w-10 h-10 animate-spin text-primary/50 mb-4" />
                <p className="text-sm font-medium animate-pulse uppercase tracking-widest text-muted-foreground">Retrieving AI Schematics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 border border-destructive/20 rounded-xl mt-6 text-destructive">
                <FileText className="w-10 h-10 mb-4 opacity-50" />
                <p className="font-semibold">{error}</p>
                <p className="text-sm opacity-80 mt-2">Ensure the AI Sync has been run for this database.</p>
            </div>
        );
    }

    if (docs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-card border border-dashed rounded-xl mt-6">
                <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-1">No Documentation Found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                    It looks like the AI has not generated knowledge schemas for this database yet. Click <strong className="text-primary font-mono">SYNC AI</strong> above to generate docs.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 mt-6 pb-20">
            {docs.map((doc, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 bg-muted/20 border-b border-border">
                        <Database className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg text-card-foreground tracking-tight">{doc.tableName}</h2>
                    </div>
                    <div className="p-6 sm:p-8">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold tracking-tight mb-6 mt-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-semibold tracking-tight first:mt-0 mt-10 mb-4 pb-2 border-b border-border/50" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-semibold tracking-tight mt-8 mb-3" {...props} />,
                                p: ({ node, ...props }) => <p className="leading-7 text-muted-foreground mb-4" {...props} />,
                                ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc [&>li]:mt-2 text-muted-foreground" {...props} />,
                                li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                code: ({ node, ...props }) => <code className="relative rounded bg-muted/50 px-[0.3rem] py-[0.2rem] font-mono text-sm text-foreground/80 border border-border/50" {...props} />,
                                table: ({ node, ...props }) => (
                                    <div className="my-6 w-full overflow-y-auto rounded-lg border border-border">
                                        <table className="w-full text-sm text-left border-collapse" {...props} />
                                    </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-muted/40 text-muted-foreground uppercase text-xs" {...props} />,
                                th: ({ node, ...props }) => <th className="px-6 py-4 font-semibold border-b border-border" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="divide-y divide-border/50" {...props} />,
                                td: ({ node, ...props }) => <td className="px-6 py-4 text-muted-foreground" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                            }}
                        >
                            {doc.content}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
        </div>
    );
}
