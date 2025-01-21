import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGraphStore } from "@/lib/graph-store";
import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Create a custom icon using MapPin from lucide-react
const customIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`,
  className: 'custom-marker-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string, value: any) => void;
  editMode?: boolean;
  initialKey?: string;
  initialValue?: any;
}

type ValueType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'point';

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper function to determine value type
function detectValueType(value: any): ValueType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'float';
  }
  if (typeof value === 'object') {
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return 'datetime';
    }
    if (value && 'latitude' in value && 'longitude' in value) {
      return 'point';
    }
  }
  return 'string';
}

export function PropertyDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit,
  editMode = false,
  initialKey = "",
  initialValue = "" 
}: Props) {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<ValueType>("string");
  const [boolValue, setBoolValue] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("00:00");
  const [isUtc, setIsUtc] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [height, setHeight] = useState("");
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialValue !== undefined) {
        const type = detectValueType(initialValue);
        setValueType(type);
        setKey(initialKey);

        switch (type) {
          case 'boolean':
            setBoolValue(Boolean(initialValue));
            break;
          case 'datetime':
            const date = new Date(initialValue);
            setDate(date);
            setTime(format(date, 'HH:mm'));
            break;
          case 'point':
            if (typeof initialValue === 'object' && 'latitude' in initialValue && 'longitude' in initialValue) {
              setLatitude(String(initialValue.latitude));
              setLongitude(String(initialValue.longitude));
              if ('height' in initialValue && initialValue.height !== undefined) {
                setHeight(String(initialValue.height));
              }
              setMarkerPosition([initialValue.latitude, initialValue.longitude]);
            }
            break;
          default:
            setValue(String(initialValue));
        }
      } else {
        // Reset form for new property
        setKey("");
        setValue("");
        setBoolValue(false);
        setDate(undefined);
        setTime("00:00");
        setLatitude("");
        setLongitude("");
        setHeight("");
        setMarkerPosition(null);
        setValueType("string");
      }
    }
  }, [isOpen, editMode, initialValue, initialKey]);

  // Get timezone abbreviation
  const getTimezoneAbbr = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    let finalValue: any;
    switch (valueType) {
      case 'integer':
        if (!value.trim() || isNaN(Number(value))) return;
        finalValue = parseInt(value, 10);
        break;
      case 'float':
        if (!value.trim() || isNaN(Number(value))) return;
        finalValue = parseFloat(value);
        break;
      case 'boolean':
        finalValue = boolValue;
        break;
      case 'datetime':
        if (!date) return;
        const [hours, minutes] = time.split(':').map(Number);
        const datetime = new Date(date);
        datetime.setHours(hours, minutes);

        // If in local mode, convert to UTC before storing
        if (!isUtc) {
          const utcMillis = Date.UTC(
            datetime.getFullYear(),
            datetime.getMonth(),
            datetime.getDate(),
            datetime.getHours(),
            datetime.getMinutes()
          );
          finalValue = new Date(utcMillis).toISOString();
        } else {
          finalValue = datetime.toISOString();
        }
        break;
      case 'point':
        if (!latitude || !longitude) return;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const h = height ? parseFloat(height) : null;

        if (isNaN(lat) || isNaN(lng) || (height && isNaN(h as number))) return;

        finalValue = h !== null ? 
          { latitude: lat, longitude: lng, height: h } :
          { latitude: lat, longitude: lng };
        break;
      default:
        if (!value.trim()) return;
        finalValue = value;
    }

    onSubmit(key.trim(), finalValue);
    onOpenChange(false);
  };

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setMarkerPosition([lat, lng]);
  }, []);

  const handleCoordinateInput = (
    value: string,
    setter: (value: string) => void,
    isLat = false
  ) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const valid = isLat ? num >= -90 && num <= 90 : num >= -180 && num <= 180;
      if (valid) {
        setter(value);
        if (value && (isLat ? longitude : latitude)) {
          setMarkerPosition([
            isLat ? num : parseFloat(latitude),
            isLat ? parseFloat(longitude) : num
          ]);
        }
      }
    } else if (value === '' || value === '-') {
      setter(value);
    }
  };

  // Render the appropriate input interface based on value type
  const renderValueInput = () => {
    switch (valueType) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor="value">Value</Label>
            <Switch
              id="value"
              checked={boolValue}
              onCheckedChange={setBoolValue}
            />
          </div>
        );

      case 'datetime':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Time Format</Label>
              <div className="flex items-center space-x-2">
                <Label>Local {!isUtc && `(${getTimezoneAbbr()})`}</Label>
                <Switch
                  checked={isUtc}
                  onCheckedChange={setIsUtc}
                />
                <Label>UTC</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time{isUtc ? " (UTC)" : ""}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        );

      case 'point':
        return (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={latitude}
                  onChange={(e) => handleCoordinateInput(e.target.value, setLatitude, true)}
                  placeholder="-90 to 90"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={longitude}
                  onChange={(e) => handleCoordinateInput(e.target.value, setLongitude)}
                  placeholder="-180 to 180"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="height">Height (m)</Label>
                <Input
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Optional"
                  type="number"
                  step="0.1"
                />
              </div>
            </div>
            <div className="h-[300px] w-full rounded-md border">
              <MapContainer
                center={markerPosition || [0, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {markerPosition && (
                  <Marker position={markerPosition} icon={customIcon} />
                )}
              </MapContainer>
            </div>
          </div>
        );

      default:
        return (
          <>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter ${valueType} value`}
              type={valueType === 'integer' || valueType === 'float' ? 'number' : 'text'}
              step={valueType === 'float' ? '0.01' : '1'}
              required
            />
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Property' : 'Add New Property'}</DialogTitle>
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
              disabled={editMode}
            />
          </div>

          {!editMode && (
            <div className="space-y-2">
              <Label>Value Type</Label>
              <Select value={valueType} onValueChange={setValueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select value type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">Text</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                  <SelectItem value="boolean">True/False</SelectItem>
                  <SelectItem value="datetime">Date & Time</SelectItem>
                  <SelectItem value="point">Geographic Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            {renderValueInput()}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editMode ? 'Save Changes' : 'Add Property'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}