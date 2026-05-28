"use client";

import { Check } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["1 connection", "50 tables", "Basic AI docs", "Community support"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    features: [
      "5 connections",
      "Unlimited tables",
      "PII detection",
      "Quality monitoring",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited everything",
      "SSO & RBAC",
      "On-premise option",
      "Dedicated support",
      "Custom SLA",
    ],
    highlight: false,
  },
];

const PricingSection = () => (
  <section id="pricing" className="py-24 border-t border-border/50">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Pricing
        </h2>
        <p className="text-muted-foreground">Start free. Scale as you grow.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl p-8 border ${
              plan.highlight
                ? "border-primary/40 glow-green"
                : "border-border"
            } bg-card`}
          >
            <h3 className="font-semibold mb-1">{plan.name}</h3>

            <div className="mb-6">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground text-sm">
                {plan.period}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/dashboard">
              <Button
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
              >
                {plan.name === "Enterprise"
                  ? "Contact Sales"
                  : "Get Started"}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;