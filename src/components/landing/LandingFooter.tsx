"use client";

import { Database } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Showcase", href: "#showcase" },
    { label: "Integrations", href: "#integrations" },
  ],
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Connect DB", href: "/connect" },
    { label: "How It Works", href: "#how-it-works" },
  ],
  Resources: [
    { label: "MCP Setup", href: "#integrations" },
    { label: "Quality Audit", href: "/dashboard/quality" },
    { label: "Data Lineage", href: "/dashboard/lineage" },
  ],
};

const LandingFooter = () => (
  <footer className="border-t border-border py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-sm mb-3"
          >
            <Database className="w-4 h-4 text-primary" />
            DataLens AI
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI-powered data documentation, quality audits, and schema intelligence for modern teams.
          </p>
        </div>

        {Object.entries(footerLinks).map(([cat, items]) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {cat}
            </h4>
            <ul className="space-y-2">
              {items.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DataLens AI
      </div>
    </div>
  </footer>
);

export default LandingFooter;
