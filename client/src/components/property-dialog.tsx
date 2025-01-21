import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  initialProperty?: { key: string; value: any } | null;
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

function detectValueType(value: any): ValueType {
  if (value === null || value === undefined) return 'string';

  // Check for Neo4j DateTime object
  if (typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    return 'datetime';
  }

  // Check for Neo4j point format
  if (typeof value === 'object' && 'srid' in value && 'x' in value && 'y' in value) {
    return 'point';
  }

  // Check for our internal point format
  if (typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
    return 'point';
  }

  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'float';
  }
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return 'datetime';
    if (!isNaN(parseInt(value)) && value.trim() === parseInt(value).toString()) return 'integer';
    if (!isNaN(parseFloat(value)) && value.trim() === parseFloat(value).toString()) return 'float';
  }
  return 'string';
}

export function PropertyDialog({ isOpen, onOpenChange, onSubmit, initialProperty }: Props) {
  const [key, setKey] = useState("");
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

  // Update time display when UTC mode changes
  useEffect(() => {
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const updatedDate = new Date(date);

      if (isUtc) {
        // Show the UTC time directly
        setTime(format(updatedDate, 'HH:mm', { timeZone: 'UTC' }));
      } else {
        // Show the time in local timezone
        setTime(format(updatedDate, 'HH:mm'));
      }
    }
  }, [isUtc, date]);

  // Reset form when dialog opens/closes or initialProperty changes
  useEffect(() => {
    if (isOpen && initialProperty) {
      setKey(initialProperty.key);
      const type = detectValueType(initialProperty.value);
      setValueType(type);

      switch (type) {
        case 'boolean':
          setBoolValue(Boolean(initialProperty.value));
          break;
        case 'datetime':
          let datetime;
          if (typeof initialProperty.value === 'object' && 'year' in initialProperty.value) {
            // Handle Neo4j DateTime object
            const dt = initialProperty.value;
            // Convert BigInt to Number for JavaScript Date and ensure UTC time
            const nanosToMillis = Number(dt.nanosecond) / 1_000_000;
            datetime = new Date(Date.UTC(
              Number(dt.year),
              Number(dt.month) - 1, // JavaScript months are 0-based
              Number(dt.day),
              Number(dt.hour),
              Number(dt.minute),
              Number(dt.second),
              nanosToMillis
            ));
          } else {
            datetime = new Date(initialProperty.value);
          }
          setDate(datetime);

          // Set initial time based on UTC mode
          if (isUtc) {
            setTime(format(datetime, 'HH:mm', { timeZone: 'UTC' }));
          } else {
            setTime(format(datetime, 'HH:mm'));
          }
          break;
        case 'point':
          const pointValue = initialProperty.value;
          // Handle both Neo4j point format and our internal format
          const lat = 'latitude' in pointValue ? pointValue.latitude : pointValue.y;
          const lng = 'longitude' in pointValue ? pointValue.longitude : pointValue.x;
          const h = 'height' in pointValue ? pointValue.height : pointValue.z;

          setLatitude(lat.toString());
          setLongitude(lng.toString());
          setHeight(h?.toString() ?? '');
          setMarkerPosition([lat, lng]);
          break;
        default:
          setValue(String(initialProperty.value));
      }
    } else if (!isOpen) {
      // Reset form
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
  }, [isOpen, initialProperty, isUtc]);

  // Get timezone abbreviation
  const getTimezoneAbbr = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
  };

  // Handle form submission
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

        if (isUtc) {
          // If UTC is selected, use UTC methods to set time
          datetime.setUTCHours(hours, minutes, 0, 0);
        } else {
          // If local time is selected, convert local time to UTC
          const offset = datetime.getTimezoneOffset();
          datetime.setHours(hours, minutes, 0, 0);
          // Adjust for timezone offset to get correct UTC time
          datetime.setMinutes(datetime.getMinutes() - offset);
        }

        finalValue = datetime.toISOString();
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

  const handleTypeChange = (type: ValueType) => {
    setValueType(type);
    setValue("");
    setBoolValue(false);
    setDate(undefined);
    setTime("00:00");
    setLatitude("");
    setLongitude("");
    setHeight("");
    setMarkerPosition(null);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setMarkerPosition([lat, lng]);
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialProperty ? 'Edit' : 'Add'} Property</DialogTitle>
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
              disabled={!!initialProperty}
            />
          </div>

          <div className="space-y-2">
            <Label>Value Type</Label>
            <Select value={valueType} onValueChange={handleTypeChange} disabled={!!initialProperty}>
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
            ) : valueType === 'datetime' ? (
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
            ) : valueType === 'point' ? (
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
            ) : (
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
              {initialProperty ? 'Update' : 'Add'} Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}