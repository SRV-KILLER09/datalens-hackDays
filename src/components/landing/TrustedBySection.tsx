"use client";

import { motion } from "framer-motion";
import { Database, Snowflake, Server, Network } from "lucide-react";

const dbs = [
  { name: "PostgreSQL", icon: Database },
  { name: "MySQL", icon: Server },
  { name: "Snowflake", icon: Snowflake },
  { name: "Neo4j", icon: Network },
];

const TrustedBySection = () => (
  <section className="py-20 border-t border-border/50">
    <div className="container mx-auto px-6">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em] mb-10">
        Connects to your databases
      </p>
      <div className="flex flex-wrap justify-center gap-8 md:gap-14">
        {dbs.map((db, i) => (
          <motion.div
            key={db.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <db.icon className="w-4 h-4 text-primary/70" />
            <span className="text-sm font-medium">{db.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustedBySection;
