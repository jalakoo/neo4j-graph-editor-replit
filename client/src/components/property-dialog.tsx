import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string, value: string) => void;
}

type ValueType = 'string' | 'int' | 'float' | 'boolean' | 'datetime';

export function PropertyDialog({ isOpen, onOpenChange, onSubmit }: Props) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<ValueType>("string");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    let processedValue: any;
    try {
      switch (type) {
        case 'int':
          processedValue = parseInt(value);
          if (isNaN(processedValue)) throw new Error('Invalid integer');
          break;
        case 'float':
          processedValue = parseFloat(value);
          if (isNaN(processedValue)) throw new Error('Invalid float');
          break;
        case 'boolean':
          processedValue = value.toLowerCase() === 'true';
          break;
        case 'datetime':
          processedValue = new Date(value).toISOString();
          if (processedValue === 'Invalid Date') throw new Error('Invalid date');
          break;
        default:
          processedValue = value.trim();
      }

      onSubmit(key.trim(), String(processedValue));
      setKey("");
      setValue("");
      setType("string");
      onOpenChange(false);
    } catch (error) {
      // The error will be handled by the parent component
      throw error;
    }
  };

  const getInputType = () => {
    switch (type) {
      case 'datetime':
        return 'datetime-local';
      case 'int':
      case 'float':
        return 'number';
      default:
        return 'text';
    }
  };

  const getInputStep = () => {
    return type === 'float' ? 'any' : undefined;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Property Name</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter property name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Value Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ValueType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select value type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="int">Integer</SelectItem>
                <SelectItem value="float">Float</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="datetime">DateTime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            {type === 'boolean' ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select boolean value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                type={getInputType()}
                step={getInputStep()}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${type} value`}
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}