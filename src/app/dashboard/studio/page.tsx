"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";
import { Card } from "../../../components/ui/card";
import { authClient } from "@/src/components/landing/auth";
import { getUserConnections } from "../../../actions/db";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";

const DEMO_ID = "demo-neon-db";

export default function StudioIndexPage() {
  const { data: session } = authClient.useSession();
  const [connections, setConnections] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetch = async () => {
      let userConns: any[] = [];
      if (session?.user?.id) {
        const res = await getUserConnections(session.user.id);
        if (res.success) userConns = res.data || [];
      }
      setConnections([{ id: DEMO_ID, name: "✨ Demo eCommerce DB" }, ...userConns.filter(c => c.id !== DEMO_ID)]);
    };
    fetch();
  }, [session]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-[760px] p-6">
          <h2 className="text-lg font-bold mb-2">Choose a database to use in Studio</h2>
          <p className="text-sm text-muted-foreground mb-4">Select a connection — we'll open the Studio scoped to that database.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connections.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Loading connections...</div>
            ) : (
              connections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/dashboard/studio/${encodeURIComponent(c.id)}`)}
                  className="text-left p-3 border rounded hover:bg-muted/30 transition"
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{c.id}</div>
                </button>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/studio/${encodeURIComponent(DEMO_ID)}`)} className="px-3 py-2 rounded bg-primary text-white text-sm">Use Demo DB</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
