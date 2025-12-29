"use client"

import { useState, useEffect, useMemo } from "react"
import { RRule, Weekday } from "rrule"
import { format, addMonths } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, RefreshCw } from "lucide-react"

interface RecurrenceBuilderProps {
  value?: string
  dtstart?: string
  onChange: (rrule: string, dtstart: string) => void
}

const WEEKDAYS = [
  { value: RRule.MO.weekday, label: "Mon", short: "M" },
  { value: RRule.TU.weekday, label: "Tue", short: "T" },
  { value: RRule.WE.weekday, label: "Wed", short: "W" },
  { value: RRule.TH.weekday, label: "Thu", short: "T" },
  { value: RRule.FR.weekday, label: "Fri", short: "F" },
  { value: RRule.SA.weekday, label: "Sat", short: "S" },
  { value: RRule.SU.weekday, label: "Sun", short: "S" },
]

const FREQUENCIES = [
  { value: RRule.DAILY, label: "Daily" },
  { value: RRule.WEEKLY, label: "Weekly" },
  { value: RRule.MONTHLY, label: "Monthly" },
  { value: RRule.YEARLY, label: "Yearly" },
]

type EndType = "never" | "count" | "until"

export function RecurrenceBuilder({ value, dtstart, onChange }: RecurrenceBuilderProps) {
  const [frequency, setFrequency] = useState<number>(RRule.WEEKLY)
  const [interval, setInterval] = useState<number>(1)
  const [byweekday, setByweekday] = useState<number[]>([])
  const [bymonthday, setBymonthday] = useState<number>(1)
  const [endType, setEndType] = useState<EndType>("never")
  const [count, setCount] = useState<number>(10)
  const [until, setUntil] = useState<Date | undefined>(addMonths(new Date(), 3))
  const [startDate, setStartDate] = useState<Date>(new Date())

  // Parse existing RRULE if provided
  useEffect(() => {
    if (value) {
      try {
        const rule = RRule.fromString(value)
        setFrequency(rule.options.freq)
        setInterval(rule.options.interval || 1)
        
        if (rule.options.byweekday) {
          setByweekday(
            rule.options.byweekday.map((w) => 
              typeof w === "number" ? w : (w as Weekday).weekday
            )
          )
        }
        
        if (rule.options.bymonthday && rule.options.bymonthday.length > 0) {
          setBymonthday(rule.options.bymonthday[0])
        }
        
        if (rule.options.count) {
          setEndType("count")
          setCount(rule.options.count)
        } else if (rule.options.until) {
          setEndType("until")
          setUntil(rule.options.until)
        }
      } catch (e) {
        console.error("Failed to parse RRULE:", e)
      }
    }
    
    if (dtstart) {
      setStartDate(new Date(dtstart))
    }
  }, [value, dtstart])

  // Generate RRULE string when options change
  const rruleString = useMemo(() => {
    const options: Partial<ConstructorParameters<typeof RRule>[0]> = {
      freq: frequency,
      interval: interval,
      dtstart: startDate,
    }

    if (frequency === RRule.WEEKLY && byweekday.length > 0) {
      options.byweekday = byweekday
    }

    if (frequency === RRule.MONTHLY) {
      options.bymonthday = [bymonthday]
    }

    if (endType === "count") {
      options.count = count
    } else if (endType === "until" && until) {
      options.until = until
    }

    try {
      const rule = new RRule(options as any)
      return rule.toString()
    } catch (e) {
      return ""
    }
  }, [frequency, interval, byweekday, bymonthday, endType, count, until, startDate])

  // Notify parent of changes
  useEffect(() => {
    if (rruleString) {
      onChange(rruleString, startDate.toISOString())
    }
  }, [rruleString, startDate, onChange])

  // Get next occurrences for preview
  const nextOccurrences = useMemo(() => {
    try {
      const rule = RRule.fromString(rruleString)
      return rule.all((_, i) => i < 5)
    } catch (e) {
      return []
    }
  }, [rruleString])

  const toggleWeekday = (day: number) => {
    setByweekday((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recurrence Pattern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Frequency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select
                value={frequency.toString()}
                onValueChange={(v) => setFrequency(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value.toString()}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Every</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {frequency === RRule.DAILY && (interval === 1 ? "day" : "days")}
                  {frequency === RRule.WEEKLY && (interval === 1 ? "week" : "weeks")}
                  {frequency === RRule.MONTHLY && (interval === 1 ? "month" : "months")}
                  {frequency === RRule.YEARLY && (interval === 1 ? "year" : "years")}
                </span>
              </div>
            </div>
          </div>

          {/* Weekday Selection (for weekly) */}
          {frequency === RRule.WEEKLY && (
            <div className="space-y-2">
              <Label>On these days</Label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={byweekday.includes(day.value) ? "default" : "outline"}
                    className="w-10 h-10 p-0"
                    onClick={() => toggleWeekday(day.value)}
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === RRule.MONTHLY && (
            <div className="space-y-2">
              <Label>On day</Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={bymonthday}
                onChange={(e) => setBymonthday(Number(e.target.value) || 1)}
                className="w-24"
              />
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-3">
            <Label>Ends</Label>
            <RadioGroup
              value={endType}
              onValueChange={(v) => setEndType(v as EndType)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never" className="font-normal">Never</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="count" />
                <Label htmlFor="count" className="font-normal flex items-center gap-2">
                  After
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value) || 1)}
                    className="w-20 h-8"
                    disabled={endType !== "count"}
                  />
                  occurrences
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="until" id="until" />
                <Label htmlFor="until" className="font-normal flex items-center gap-2">
                  On
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={endType !== "until"}
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !until && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {until ? format(until, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={until}
                        onSelect={setUntil}
                        initialFocus
                        disabled={(date) => date < startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Next {nextOccurrences.length} occurrences:
            </p>
            <ul className="space-y-1">
              {nextOccurrences.map((date, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {format(date, "EEEE, MMMM d, yyyy")}
                </li>
              ))}
              {nextOccurrences.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No occurrences generated
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

