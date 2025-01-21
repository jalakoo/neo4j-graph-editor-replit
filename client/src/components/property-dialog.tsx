import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { getCookie, setCookie } from "@/lib/cookie-utils";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (key: string, value: any) => void;
}

type ValueType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime';

const TIME_FORMAT_COOKIE = 'time_format_24h';
const TIMEZONE_FORMAT_COOKIE = 'timezone_utc';

export function PropertyDialog({ isOpen, onOpenChange, onSubmit }: Props) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [valueType, setValueType] = useState<ValueType>("string");
  const [boolValue, setBoolValue] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("00:00");
  const [isUtc, setIsUtc] = useState(() => {
    const saved = getCookie(TIMEZONE_FORMAT_COOKIE);
    return saved === null ? true : saved === 'true';
  });
  const [is24Hour, setIs24Hour] = useState(() => {
    const saved = getCookie(TIME_FORMAT_COOKIE);
    return saved === null ? true : saved === 'true';
  });

  // Get timezone abbreviation
  const getTimezoneAbbr = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date().toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2];
  };

  useEffect(() => {
    // Save preferences when they change
    setCookie(TIME_FORMAT_COOKIE, String(is24Hour));
    setCookie(TIMEZONE_FORMAT_COOKIE, String(isUtc));
  }, [is24Hour, isUtc]);

  const formatTime = (time: string) => {
    if (!is24Hour) {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    return time;
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
          finalValue = new Date(utcMillis);
        } else {
          finalValue = datetime;
        }
        break;
      default:
        if (!value.trim()) return;
        finalValue = value;
    }

    onSubmit(key.trim(), finalValue);
    setKey("");
    setValue("");
    setBoolValue(false);
    setDate(undefined);
    setTime("00:00");
    setValueType("string");
    onOpenChange(false);
  };

  const handleTypeChange = (type: ValueType) => {
    setValueType(type);
    setValue(""); // Clear value when type changes
    setBoolValue(false);
    setDate(undefined);
    setTime("00:00");
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
                <SelectItem value="integer">Integer</SelectItem>
                <SelectItem value="float">Float</SelectItem>
                <SelectItem value="boolean">True/False</SelectItem>
                <SelectItem value="datetime">Date & Time</SelectItem>
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
                <div className="flex items-center justify-between">
                  <Label>Time Display</Label>
                  <div className="flex items-center space-x-2">
                    <Label>12-hour</Label>
                    <Switch
                      checked={is24Hour}
                      onCheckedChange={setIs24Hour}
                    />
                    <Label>24-hour</Label>
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
                  <div className="text-sm text-muted-foreground">
                    {formatTime(time)}
                  </div>
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
              Add Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}