"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock
} from "lucide-react";
import { SiPostgresql, SiMysql, SiSnowflake } from "react-icons/si";
import { getDatabaseMetadata } from "../../actions/db";
import { useRouter } from "next/navigation";
import { authClient } from "@/src/components/landing/auth";
import { saveConnection } from "@/src/actions/db";

type DBType = "postgresql" | "mysql" | "snowflake" | null;

export default function ConnectPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  
  const [selectedDB, setSelectedDB] = useState<DBType>(null);
  const [connString, setConnString] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const databases = [
    { id: "postgresql", name: "PostgreSQL", icon: SiPostgresql, color: "text-[#336791]" },
    { id: "mysql", name: "MySQL", icon: SiMysql, color: "text-[#00758F]" },
    { id: "snowflake", name: "Snowflake", icon: SiSnowflake, color: "text-[#29B5E8]" },
  ];

  const getPlaceholder = () => {
    switch (selectedDB) {
      case "mysql":
        return "mysql://user:password@host:3306/dbname";
      case "snowflake":
        return "snowflake://user:pass@account.region.azure/db/schema?warehouse=wh";
      default:
        return "postgresql://user:password@localhost:5432/dbname";
    }
  };

  const handleConnect = async () => {
    if (!session?.user?.id) {
      setError("No active session found. Please log in.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // 1. Validate the metadata first to ensure the string is working
      const result = await getDatabaseMetadata(connString);

      if (!result.success || !result.data) {
        setError(result.error || "Failed to connect to the database.");
        setIsConnecting(false);
        return;
      }

      // 2. Save to the vault
      const saveResult = await saveConnection({
        userId: session.user.id, 
        name: `${selectedDB?.toUpperCase()} Source`,
        provider: selectedDB!,
        uri: connString,
      });

      if (saveResult.success && "id" in saveResult && saveResult.id) {
        
        // 3. Immediately sync metadata with detailed column information
        try {
           const { syncTableMetadata } = await import('../../actions/metadata');
           
           // We re-format the data to match the array structure parsedTables expects
           const organized = result.data.schema.reduce((acc: any, curr: any) => {
            if (!acc[curr.table_name]) {
              acc[curr.table_name] = { name: curr.table_name, columns: [] };
            }
            acc[curr.table_name].columns.push(curr);
            return acc;
          }, {});

          const parsedTables = Object.values(organized);
          await syncTableMetadata(saveResult.id, parsedTables);
        } catch (syncErr) {
          console.error("Failed to sync metadata silently in background", syncErr);
        }

        // Redirection handles the state
        router.push(`/dashboard/tables/${saveResult.id}`);
      } else {
        const errorMessage = (saveResult as any).error || "Failed to save connection to vault.";
        setError(errorMessage);
        setIsConnecting(false);
      }
    } catch (err) {
      setError("A critical error occurred while saving the connection.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Connect your Data Source</h1>
        <p className="text-muted-foreground">Select a database to securely sync your schema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {databases.map((db) => {
          const Icon = db.icon;
          const isSelected = selectedDB === db.id;

          return (
            <Card
              key={db.id}
              className={`relative p-6 cursor-pointer border-2 transition-all hover:shadow-md ${
                isSelected ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => {
                setSelectedDB(db.id as DBType);
                setConnString(""); 
              }}
            >
              {isSelected && (
                <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />
              )}
              <div className="flex flex-col items-center gap-4">
                <Icon className={`w-12 h-12 ${db.color}`} />
                <span className="font-semibold text-lg">{db.name}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedDB && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">
                {selectedDB.toUpperCase()} Connection String
              </label>
            </div>
            <Input
              placeholder={getPlaceholder()}
              value={connString}
              onChange={(e) => setConnString(e.target.value)}
              className="h-12 border-2 focus-visible:ring-primary"
            />
          </div>

          {error && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <Button
            className="w-full h-12 text-lg font-medium"
            disabled={!connString || isConnecting || !session}
            onClick={handleConnect}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validating Connection...
              </>
            ) : (
              <>
                Connect and Analyze <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
          {!session && (
            <p className="text-xs text-center text-destructive">You must be logged in to save connections.</p>
          )}
        </div>
      )}
    </div>
  );
}