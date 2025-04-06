import * as React from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateArabic } from "@/lib/utils/arabic-date";

export interface DatePickerArProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  showArabicDate?: boolean;
}

export function DatePickerAr({
  date,
  setDate,
  placeholder = "اختر تاريخ",
  className,
  showArabicDate = false,
}: DatePickerArProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-right font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          {date ? (
            showArabicDate ? (
              formatDateArabic(date)
            ) : (
              format(date, "dd/MM/yyyy", { locale: ar })
            )
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="mr-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={ar}
        />
      </PopoverContent>
    </Popover>
  );
}
