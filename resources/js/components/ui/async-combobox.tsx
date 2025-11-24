import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { router } from "@inertiajs/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface AsyncComboboxOption {
  value: string
  label: string
  displayLabel?: string // Short label for button display
  [key: string]: any
}

interface AsyncComboboxProps {
  initialOptions?: AsyncComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  searchUrl: string
  searchParam?: string
  debounceMs?: number
}

export function AsyncCombobox({
  initialOptions = [],
  value = "",
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No option found.",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  searchUrl,
  searchParam = "search",
  debounceMs = 300,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [options, setOptions] = React.useState<AsyncComboboxOption[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!searchValue.trim()) {
      setOptions([])
      return
    }

    setLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const url = `${searchUrl}?${searchParam}=${encodeURIComponent(searchValue)}`

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const fetchedOptions = data.data || []
          setOptions(fetchedOptions)
        } else {
          setOptions([])
        }
      } catch (error) {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchValue, searchUrl, searchParam, debounceMs])

  // Combine initial and search options, removing duplicates by value
  const allOptions = React.useMemo(() => {
    // If there's a search value, show search results only
    // Otherwise, show initial options
    if (searchValue.trim()) {
      // When searching, show only search results from API
      return options
    } else {
      // When not searching, show initial options
      return initialOptions
    }
  }, [initialOptions, options, searchValue])

  // Find selected option from all possible sources (initialOptions, options, or both)
  const selectedOption = React.useMemo(() => {
    if (!value) return undefined
    // Check in initialOptions first
    let found = initialOptions.find((opt) => opt.value === value)
    if (found) return found
    // Then check in search results
    found = options.find((opt) => opt.value === value)
    return found
  }, [value, initialOptions, options])

  const handleSelect = React.useCallback((selectedValue: string) => {
    // Find the option by value from all possible sources
    let option = initialOptions.find((opt) => opt.value === selectedValue)
    if (!option) {
      option = options.find((opt) => opt.value === selectedValue)
    }

    if (option) {
      const newValue = option.value === value ? "" : option.value
      onValueChange?.(newValue)
      setOpen(false)
      setSearchValue("") // Reset search after selection
    }
  }, [value, initialOptions, options, onValueChange])

  const handleSearchChange = (newSearchValue: string) => {
    setSearchValue(newSearchValue)
  }

  // Reset search when popover opens
  React.useEffect(() => {
    if (open) {
      setSearchValue("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (selectedOption.displayLabel || selectedOption.label) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleSearchChange}
            className="h-9"
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!loading && allOptions.length === 0 && searchValue && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {!loading && allOptions.length === 0 && !searchValue && initialOptions.length === 0 && (
              <CommandEmpty>No options available</CommandEmpty>
            )}
          </CommandList>
          {!loading && allOptions.length > 0 && (
            <div className="max-h-[300px] overflow-y-auto p-1">
              {allOptions.map((option) => {
                const isSelected = value === option.value
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(option.value)
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelect(option.value)
                    }}
                  >
                    <span className="flex-1">{option.label}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
