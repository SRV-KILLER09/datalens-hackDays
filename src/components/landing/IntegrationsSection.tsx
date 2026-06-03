"use client";

import { motion } from "framer-motion";
import { Code2, Plug, Terminal, Wrench } from "lucide-react";

const mcpTools = [
  "datalens_connect",
  "datalens_scan_schema",
  "datalens_get_documentation",
  "datalens_chat",
  "datalens_quality_audit",
  "datalens_run_query",
];

const ides = ["Cursor", "VS Code", "Antigravity"];

const IntegrationsSection = () => (
  <section id="integrations" className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            IDE Integration
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            DataLens in your editor.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8 max-w-md">
            Connect via MCP and query your schema, run quality audits, generate documentation,
            and chat with AI — without leaving Cursor, VS Code, or Antigravity.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            {ides.map((ide) => (
              <span
                key={ide}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium"
              >
                <Code2 className="w-4 h-4 text-primary" />
                {ide}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Plug className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">One-command setup</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build the MCP server, copy the config template, and set your database URL.
                Schema intelligence flows directly into your AI assistant.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2">.cursor/mcp.json</span>
          </div>

          <div className="p-5 font-mono text-xs leading-relaxed space-y-1">
            <p><span className="text-purple-400">{"{"}</span></p>
            <p className="pl-4"><span className="text-blue-400">&quot;mcpServers&quot;</span>: <span className="text-purple-400">{"{"}</span></p>
            <p className="pl-8"><span className="text-emerald-400">&quot;datalens&quot;</span>: <span className="text-purple-400">{"{"}</span></p>
            <p className="pl-12"><span className="text-blue-400">&quot;command&quot;</span>: <span className="text-amber-300">&quot;node&quot;</span>,</p>
            <p className="pl-12"><span className="text-blue-400">&quot;args&quot;</span>: [<span className="text-amber-300">&quot;.../mcp-server/dist/index.js&quot;</span>],</p>
            <p className="pl-12"><span className="text-blue-400">&quot;env&quot;</span>: <span className="text-purple-400">{"{ ... }"}</span></p>
            <p className="pl-8"><span className="text-purple-400">{"}"}</span></p>
            <p className="pl-4"><span className="text-purple-400">{"}"}</span></p>
            <p><span className="text-purple-400">{"}"}</span></p>
          </div>

          <div className="px-5 pb-5">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Available MCP Tools
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mcpTools.map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground font-mono"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Wrench className="w-3.5 h-3.5 text-primary" />
            <span>Schema scan · Documentation · Queries · Quality · AI chat</span>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default IntegrationsSection;
