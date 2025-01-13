import { GraphCanvas } from "@/components/graph-canvas";
import { GraphToolbar } from "@/components/graph-toolbar";
import { NodeDialog } from "@/components/node-dialog";
import { EdgeDialog } from "@/components/edge-dialog";
import { DbConnectionDialog } from "@/components/db-connection-dialog";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { Button } from "@/components/ui/button";
import { DatabaseIcon } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const { isConnected, url, disconnect } = useNeo4jStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Network Graph Visualizer</h1>

          <div className="flex items-center gap-2">
            <Button
              variant={isConnected ? "outline" : "default"}
              onClick={() => isConnected ? disconnect() : setIsConnectionDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <DatabaseIcon className="h-4 w-4" />
              {isConnected ? `Connected to ${url}` : "Connect to Database"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <GraphToolbar />
        <GraphCanvas />
      </main>

      <NodeDialog />
      <EdgeDialog />
      <DbConnectionDialog 
        isOpen={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
      />
    </div>
  );
}