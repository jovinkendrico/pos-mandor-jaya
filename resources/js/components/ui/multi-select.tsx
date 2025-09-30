
import * as React from "react"
import { X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type Option = {
  value: string | number
  label: string
}

interface MultiSelectProps {
  name: string
  options: Option[]
  value?: (string | number)[]
  onChange?: (value: (string | number)[]) => void
  placeholder?: string
}

export function MultiSelect({
  name,
  options,
  value = [],
  onChange,
  placeholder = "Select options...",
}: MultiSelectProps) {
  const [selected, setSelected] = React.useState<(string | number)[]>(value)
  const [open, setOpen] = React.useState(false)

  const toggleValue = (val: string | number) => {
    setSelected((prev) => {
      const newValues = prev.includes(val)
        ? prev.filter((v) => v !== val)
        : [...prev, val]

      onChange?.(newValues)
      return newValues
    })
  }

  return (
    <div className="w-full">
      {/* Hidden inputs for form submission */}
      {selected.map((val) => (
        <input key={val} type="hidden" name={name} value={val} />
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className="w-full">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full px-3 py-2 max-w-none"
          >
            <div className="flex flex-wrap gap-2 text-left w-full">
              {selected.length === 0 ? (
                <span className="text-sm text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((val) => {
                  const item = options.find((o) => o.value === val)
                  return (
                    <span
                      key={val}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm"
                    >
                      {item?.label ?? val}
                      <button
                        type="button"
                        className="ml-1 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleValue(val)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                })
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((item) => (
                  <CommandItem
                    key={item.value}
                    onSelect={() => toggleValue(item.value)}
                    className={cn(
                      "cursor-pointer",
                      selected.includes(item.value) && "bg-accent"
                    )}
                  >
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
