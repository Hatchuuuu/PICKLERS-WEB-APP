import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export function CustomDatePicker({
  value,
  onChange,
}: {
  value: string; // "YYYY-MM-DD"
  onChange: (val: string) => void;
}) {
  // Convert "YYYY-MM-DD" string to Date
  // Fix timezone shift by appending T12:00:00 instead of T00:00:00 or nothing
  const date = value ? new Date(value + "T12:00:00") : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange("");
    }
  };

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium outline-none transition-all border shadow-sm",
            "bg-surface-interactive border-border dark:bg-white/[0.02] dark:border-white/10 hover:dark:bg-white/[0.04]",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="w-5 h-5 opacity-70" />
          {value ? format(date!, "PPP") : <span>Pick a date</span>}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="center"
          sideOffset={8}
          className="z-[9999] w-auto p-3 bg-surface-base border border-border dark:bg-[#0A1124] dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl outline-none"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            showOutsideDays
            className="p-1"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-bold tracking-tight text-foreground",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity border border-white/10 rounded-md flex items-center justify-center text-foreground cursor-pointer",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] uppercase",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal rounded-lg transition-all hover:bg-white/10 active:scale-95 aria-selected:opacity-100 text-foreground flex items-center justify-center cursor-pointer",
              day_range_end: "day-range-end",
              day_selected: "bg-emerald-500 text-[#080D1C] hover:bg-emerald-400 hover:text-[#080D1C] font-bold shadow-[0_4px_16px_rgba(16,185,129,0.3)]",
              day_today: "bg-white/5 text-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: () => <ChevronLeft className="h-4 w-4" />,
              IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
