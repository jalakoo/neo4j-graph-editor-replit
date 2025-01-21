import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string, value: any) => void;
}

type ValueType = 'string' | 'number' | 'boolean';

export function PropertyDialog({ isOpen, onOpenChange, onSubmit }: Props) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<ValueType>("string");
  const [boolValue, setBoolValue] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    let finalValue: any;
    switch (valueType) {
      case 'number':
        if (!value.trim() || isNaN(Number(value))) return;
        finalValue = Number(value);
        break;
      case 'boolean':
        finalValue = boolValue;
        break;
      default:
        if (!value.trim()) return;
        finalValue = value;
    }

    onSubmit(key.trim(), finalValue);
    setKey("");
    setValue("");
    setBoolValue(false);
    setValueType("string");
    onOpenChange(false);
  };

  const handleTypeChange = (type: ValueType) => {
    setValueType(type);
    setValue(""); // Clear value when type changes
    setBoolValue(false);
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
            <Label>Value Type</Label>
            <Select value={valueType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select value type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">True/False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {valueType === 'boolean' ? (
              <div className="flex items-center justify-between">
                <Label htmlFor="value">Value</Label>
                <Switch
                  id="value"
                  checked={boolValue}
                  onCheckedChange={setBoolValue}
                />
              </div>
            ) : (
              <>
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter ${valueType} value`}
                  type={valueType === 'number' ? 'number' : 'text'}
                  required
                />
              </>
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