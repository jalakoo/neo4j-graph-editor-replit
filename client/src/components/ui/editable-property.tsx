import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";

interface EditablePropertyProps {
  propertyKey: string;
  value: string;
  onSave: (value: string) => void;
  onEdit: () => void;
}

export function EditableProperty({ propertyKey, value, onSave, onEdit }: EditablePropertyProps) {

  return (
    <div className="flex items-center justify-between group">
      <p className="text-sm">{value}</p>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}