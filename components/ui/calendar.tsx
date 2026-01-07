"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react"
import { type DayButton, DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  showTodayButton = true,
  month,
  onMonthChange,
  selected,
  onSelect,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  showTodayButton?: boolean
}) {
  const [animationDirection, setAnimationDirection] = React.useState<"left" | "right" | null>(null)
  const prevMonthRef = React.useRef<Date | undefined>(month)

  React.useEffect(() => {
    if (month && prevMonthRef.current) {
      const prev = prevMonthRef.current.getTime()
      const curr = month.getTime()
      if (curr > prev) {
        setAnimationDirection("left")
      } else if (curr < prev) {
        setAnimationDirection("right")
      }
      // Reset animation after it plays
      const timer = setTimeout(() => setAnimationDirection(null), 200)
      return () => clearTimeout(timer)
    }
    prevMonthRef.current = month
  }, [month])

  const handleTodayClick = () => {
    const today = new Date()
    if (onMonthChange) {
      onMonthChange(today)
    }
    if (onSelect && typeof onSelect === "function") {
      // @ts-ignore - onSelect type varies based on mode
      onSelect(today)
    }
  }

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+T or Cmd+T for Today
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault()
        handleTodayClick()
      }
    },
    [onMonthChange, onSelect],
  )

  return (
    <div onKeyDown={handleKeyDown} className="flex flex-col">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("bg-background group/calendar p-3", className)}
        captionLayout={captionLayout}
        month={month}
        onMonthChange={onMonthChange}
        selected={selected}
        onSelect={onSelect}
        formatters={{
          formatMonthDropdown: (date) => date.toLocaleString("de-DE", { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit"),
          months: cn(
            "flex gap-4 flex-col md:flex-row relative transition-transform duration-200 ease-out",
            animationDirection === "left" && "animate-slide-left",
            animationDirection === "right" && "animate-slide-right",
          ),
          month: cn("flex flex-col w-full gap-4"),
          nav: cn(
            "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between z-10 pointer-events-none [&>button]:pointer-events-auto",
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-8 w-8 aria-disabled:opacity-50 p-0 select-none shrink-0 transition-transform hover:scale-110 active:scale-95",
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            "h-8 w-8 aria-disabled:opacity-50 p-0 select-none shrink-0 transition-transform hover:scale-110 active:scale-95",
          ),
          month_caption: cn("flex items-center justify-center h-8 w-full px-10"),
          dropdowns: cn("w-full flex items-center text-sm font-medium justify-center h-8 gap-1.5"),
          dropdown_root: cn(
            "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          ),
          dropdown: cn("absolute bg-popover inset-0 opacity-0"),
          caption_label: cn(
            "select-none font-medium",
            captionLayout === "label"
              ? "text-sm"
              : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          ),
          table: "w-full border-collapse border-spacing-0",
          weekdays: cn("flex border-b border-border/50 pb-1 mb-1"),
          weekday: cn(
            "text-muted-foreground w-9 h-8 flex items-center justify-center rounded-md font-medium text-xs select-none uppercase tracking-wide",
          ),
          week: cn("flex w-full mt-0.5 rounded-md transition-colors hover:bg-muted/30"),
          week_number_header: cn("select-none w-9"),
          week_number: cn("text-xs select-none text-muted-foreground"),
          day: cn("relative w-9 h-9 p-0 text-center group/day select-none", "first:rounded-l-md last:rounded-r-md"),
          range_start: cn("rounded-l-md bg-accent"),
          range_middle: cn("rounded-none"),
          range_end: cn("rounded-r-md bg-accent"),
          today: cn(
            "bg-primary/10 text-primary font-semibold rounded-md",
            "ring-2 ring-primary ring-offset-1 ring-offset-background",
            "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:ring-primary",
          ),
          outside: cn("text-muted-foreground opacity-40 aria-selected:text-muted-foreground"),
          disabled: cn("text-muted-foreground opacity-50"),
          hidden: cn("invisible"),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => {
            return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
          },
          Chevron: ({ className, orientation, ...props }) => {
            if (orientation === "left") {
              return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            }

            if (orientation === "right") {
              return <ChevronRightIcon className={cn("size-4", className)} {...props} />
            }

            return <ChevronDownIcon className={cn("size-4", className)} {...props} />
          },
          DayButton: CalendarDayButton,
          WeekNumber: ({ children, ...props }) => {
            return (
              <td {...props}>
                <div className="flex h-9 w-9 items-center justify-center text-center">{children}</div>
              </td>
            )
          },
          ...components,
        }}
        {...props}
      />

      {showTodayButton && (
        <div className="px-3 pb-2 pt-1 border-t border-border/50 mt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleTodayClick}
          >
            <CalendarIcon className="size-3.5 mr-1.5" />
            Heute
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              <span className="text-xs">⌘</span>T
            </kbd>
          </Button>
        </div>
      )}
    </div>
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "h-9 w-9 p-0 font-normal",
        "transition-all duration-150 ease-out",
        "hover:scale-105 active:scale-95",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:scale-105 data-[selected-single=true]:shadow-md",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:shadow-md",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:shadow-md",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-l-md",
        "[&>span]:text-xs [&>span]:opacity-70",
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

export default Calendar
