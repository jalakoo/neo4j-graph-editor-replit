import { GraphCanvas } from "@/components/graph-canvas";
import { GraphToolbar } from "@/components/graph-toolbar";
import { NodeDialog } from "@/components/node-dialog";
import { EdgeDialog } from "@/components/edge-dialog";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Network Graph Visualizer</h1>
        </div>
      </header>
      
      <main className="flex-1 relative">
        <GraphToolbar />
        <GraphCanvas />
      </main>

      <NodeDialog />
      <EdgeDialog />
    </div>
  );
}
