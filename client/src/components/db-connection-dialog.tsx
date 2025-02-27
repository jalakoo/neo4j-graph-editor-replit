import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNeo4jStore } from "@/lib/neo4j-store";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { useGraphStore } from "@/lib/graph-store";

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
  const [isDragging, setIsDragging] = useState(false);

  const connect = useNeo4jStore(state => state.connect);
  const error = useNeo4jStore(state => state.error);
  const loadFromDb = useGraphStore(state => state.loadFromDb);
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

        // Automatically load graph data after successful connection
        try {
          await loadFromDb();
          toast({
            title: "Data loaded",
            description: "Successfully loaded graph data from database"
          });
        } catch (loadError) {
          toast({
            title: "Warning",
            description: "Connected to database but failed to load graph data",
            variant: "destructive"
          });
        }
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

  const parseCredentials = (content: string) => {
    const lines = content.split('\n');
    let parsedUrl = '';
    let parsedUsername = '';
    let parsedPassword = '';

    for (const line of lines) {
      const [key, value] = line.split('=').map(part => part.trim());
      switch (key) {
        case 'NEO4J_URI':
          parsedUrl = value;
          break;
        case 'NEO4J_USERNAME':
          parsedUsername = value;
          break;
        case 'NEO4J_PASSWORD':
          parsedPassword = value;
          break;
      }
    }

    if (parsedUrl && parsedUsername && parsedPassword) {
      setUrl(parsedUrl);
      setUsername(parsedUsername);
      setPassword(parsedPassword);
      toast({
        title: "Credentials loaded",
        description: "Successfully loaded credentials from file"
      });
    } else {
      toast({
        title: "Invalid file format",
        description: "Could not find all required credentials in the file",
        variant: "destructive"
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          parseCredentials(content);
        }
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop a text file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Neo4j Database</DialogTitle>
        </DialogHeader>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`p-4 mb-4 border-2 border-dashed rounded-lg text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop your credentials file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Only .txt files are accepted
          </p>
        </div>

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