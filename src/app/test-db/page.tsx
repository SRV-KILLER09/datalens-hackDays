"use client";

import { getDbInventory } from "../../lib/actions";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { 
  Database, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Terminal,
  Search
} from "lucide-react";

export default function MetadataTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const testConnection = async () => {
    try {
      setStatus("loading");
      console.log("Fetching database inventory...");
      
      const data = await getDbInventory();
      
      console.log("Tables found:", data.tables);
      console.log("Columns found:", data.columns);
      
      setStatus("success");
    } catch (error) {
      console.error("Test failed:", error);
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-slate-50 p-4">
      <div className="p-8 bg-white border rounded-2xl shadow-sm text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Database className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h1 className="text-xl font-bold mb-2 text-slate-900">Database Connection Test</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Query your Neon database to fetch schema metadata and verify connectivity.
        </p>
        
        <Button 
          onClick={testConnection} 
          disabled={status === "loading"}
          className="w-full h-11 text-base transition-all"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Fetching Schema...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Run Test Query
            </>
          )}
        </Button>

        <div className="mt-8 space-y-3">
          {status === "success" && (
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">
                Success! Data logged to console.
              </p>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700 font-medium">
                Connection failed. Check server logs.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Terminal className="w-3 h-3" />
            <span>Open Browser Console (F12) to see results</span>
          </div>
        </div>
      </div>
    </div>
  );
}