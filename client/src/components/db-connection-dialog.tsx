import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DbConnectionDialog({ isOpen, onOpenChange }: Props) {
  const neo4jStore = useNeo4jStore();
  const [url, setUrl] = useState(neo4jStore.url);
  const [username, setUsername] = useState(neo4jStore.username);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const connect = useNeo4jStore(state => state.connect);
  const error = useNeo4jStore(state => state.error);
  const { toast } = useToast();

  // Update form when store values change
  useEffect(() => {
    console.log('Updating form with stored values:', { 
      storeUrl: neo4jStore.url, 
      storeUsername: neo4jStore.username 
    });
    setUrl(neo4jStore.url);
    setUsername(neo4jStore.username);
  }, [neo4jStore.url, neo4jStore.username]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, initializing form with:', { 
        url: neo4jStore.url, 
        username: neo4jStore.username 
      });
      setUrl(neo4jStore.url);
      setUsername(neo4jStore.username);
      setPassword("");
    }
  }, [isOpen, neo4jStore.url, neo4jStore.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await connect(url, username, password);
      if (!error) {
        onOpenChange(false);
        toast({
          title: "Connected to database",
          description: "Successfully connected to Neo4j database"
        });
      }
    } catch (err) {
      toast({
        title: "Connection failed",
        description: error || "Failed to connect to database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Neo4j Database</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Database URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="neo4j://localhost:7687"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="neo4j"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Connect
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}