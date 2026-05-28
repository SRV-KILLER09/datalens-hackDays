"use client"
import { motion } from "framer-motion";

const dbs = ["PostgreSQL", "Snowflake", "SQL Server", "MongoDB"];

const TrustedBySection = () => (
  <section className="py-20 border-t border-border/50">
    <div className="container mx-auto px-6">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em] mb-10">
        Connects to your databases
      </p>
      <div className="flex flex-wrap justify-center gap-10">
        {dbs.map((name, i) => (
          <motion.span
            key={name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-sm text-muted-foreground font-medium"
          >
            {name}
          </motion.span>
        ))}
      </div>
    </div>
  </section>
);

export default TrustedBySection;
