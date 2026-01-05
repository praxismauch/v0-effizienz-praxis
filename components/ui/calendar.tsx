"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
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
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-background group/calendar p-3", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit"),
        months: cn("flex gap-4 flex-col md:flex-row relative"),
        month: cn("flex flex-col w-full gap-4"),
        nav: cn("flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between"),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 aria-disabled:opacity-50 p-0 select-none",
        ),
        button_next: cn(buttonVariants({ variant: buttonVariant }), "h-8 w-8 aria-disabled:opacity-50 p-0 select-none"),
        month_caption: cn("flex items-center justify-center h-8 w-full px-8"),
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
        table: "w-full border-collapse",
        weekdays: cn("flex"),
        weekday: cn(
          "text-muted-foreground w-9 h-9 flex items-center justify-center rounded-md font-normal text-xs select-none",
        ),
        week: cn("flex w-full mt-1"),
        week_number_header: cn("select-none w-9"),
        week_number: cn("text-xs select-none text-muted-foreground"),
        day: cn("relative w-9 h-9 p-0 text-center group/day select-none"),
        range_start: cn("rounded-l-md bg-accent"),
        range_middle: cn("rounded-none"),
        range_end: cn("rounded-r-md bg-accent"),
        today: cn("bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none"),
        outside: cn("text-muted-foreground opacity-50 aria-selected:text-muted-foreground"),
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
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
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
