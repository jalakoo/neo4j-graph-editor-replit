import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";
import { format } from "date-fns";

interface EditablePropertyProps {
  propertyKey: string;
  value: any; // Changed to 'any' to handle various data types
  onSave: (value: string) => void;
  onEdit: () => void;
}

// Helper function to format different types of values
function formatValue(value: any): string {
  if (value === null || value === undefined) return '';

  // Handle dates
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    const date = new Date(value);
    return format(date, "PPP HH:mm");
  }

  // Handle geographic points
  if (typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
    let pointStr = `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
    if ('height' in value && value.height !== undefined) {
      pointStr += `, ${value.height}m`;
    }
    return pointStr;
  }

  // Handle other objects
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function EditableProperty({ propertyKey, value, onSave, onEdit }: EditablePropertyProps) {
  return (
    <div className="group flex items-start justify-between gap-2">
      <div className="flex-1 break-all text-sm whitespace-pre-wrap">
        {formatValue(value)}
      </div>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0"
      >
        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}