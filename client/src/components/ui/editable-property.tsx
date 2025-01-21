import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";

interface EditablePropertyProps {
  propertyKey: string;
  value: string;
  onSave: (value: string) => void;
}

export function EditableProperty({ propertyKey, value, onSave }: EditablePropertyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="mt-1"
      />
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <p className="text-sm">{value}</p>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}
