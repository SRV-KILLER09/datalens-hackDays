"use client";

import { Database } from "lucide-react";
import Link from "next/link";

const links = {
  Product: ["Features", "Pricing", "Integrations"],
  Resources: ["Docs", "API", "Blog"],
  Company: ["Security", "Privacy", "Contact"],
};

const LandingFooter = () => (
  <footer className="border-t border-border py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8">
        
        {/* Logo + Description */}
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-sm mb-3"
          >
            <Database className="w-4 h-4 text-primary" />
            DataLens AI
          </Link>

          <p className="text-xs text-muted-foreground leading-relaxed">
            AI-powered data documentation for modern teams.
          </p>
        </div>

        {/* Footer Links */}
        {Object.entries(links).map(([cat, items]) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {cat}
            </h4>

            <ul className="space-y-2">
              {items.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 pt-8 border-t border-border text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DataLens AI
      </div>
    </div>
  </footer>
);

export default LandingFooter;