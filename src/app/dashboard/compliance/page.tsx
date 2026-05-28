"use client";

import DashboardLayout from "../../../components/dashboard/DashboardLayout";

const Placeholder = ({ title, desc }: { title: string; desc: string }) => (
  <DashboardLayout>
    <h1 className="text-xl font-semibold mb-1">{title}</h1>
    <p className="text-sm text-muted-foreground mb-8">{desc}</p>
    <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
      Coming soon.
    </div>
  </DashboardLayout>
);

export default function CompliancePage() {
  return <Placeholder title="Compliance" desc="Track sensitive data and governance policies." />;
}