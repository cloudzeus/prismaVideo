"use client"

import * as React from "react"
import { X, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  value: string
  disabled?: boolean
  avatar?: string | null
}

interface EnhancedMultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  onSearch?: (query: string) => Promise<Option[]> | Option[]
  isLoading?: boolean
  minSearchLength?: number
}

export function EnhancedMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  disabled = false,
  className,
  onSearch,
  isLoading = false,
  minSearchLength = 3,
}: EnhancedMultiSelectProps) {
  console.log('🎯 EnhancedMultiSelect rendered with:', {
    onSearch: !!onSearch,
    minSearchLength,
    optionsCount: options.length,
    selectedCount: selected.length
  })
  
  // Add a visible indicator that the component is working
  React.useEffect(() => {
    console.log('🎯 EnhancedMultiSelect mounted with onSearch:', !!onSearch)
  }, [onSearch])
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<Option[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter out already selected options from the base options
  const availableOptions = options.filter((option) => !selected.includes(option.value))

  // Use search results if available, otherwise use available options
  // If no search function is provided, always show available options
  const displayOptions = onSearch && hasSearched ? searchResults : availableOptions

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleSearch = React.useCallback(async (query: string) => {
    console.log('EnhancedMultiSelect handleSearch called with query:', query, 'minSearchLength:', minSearchLength)
    
    if (!onSearch || query.length < minSearchLength) {
      console.log('Search conditions not met, clearing results')
      setSearchResults([])
      setHasSearched(false)
      return
    }

    console.log('Starting search...')
    setIsSearching(true)
    setHasSearched(true)

    try {
      const results = await onSearch(query)
      console.log('Search results received:', results)
      const filteredResults = results.filter((option) => !selected.includes(option.value))
      console.log('Filtered results (excluding selected):', filteredResults)
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [onSearch, minSearchLength, selected])

  const handleInputChange = React.useCallback((value: string) => {
    console.log('🚀 EnhancedMultiSelect handleInputChange called with value:', value, 'length:', value.length, 'minSearchLength:', minSearchLength)
    setInputValue(value)
    
    // Always open dropdown when typing
    if (value.length > 0) {
      console.log('📝 Opening dropdown for input length:', value.length)
      setOpen(true)
    }
    
    if (value.length >= minSearchLength && onSearch) {
      console.log('🔍 Triggering search for:', value)
      handleSearch(value)
    } else if (value.length === 0) {
      console.log('🧹 Clearing search results')
      setSearchResults([])
      setHasSearched(false)
      // Don't close dropdown when clearing - show all available options
      setOpen(true)
    }
    
    // If no search function is provided, always show available options
    if (!onSearch) {
      setHasSearched(false)
      setOpen(true)
    }
  }, [handleSearch, minSearchLength, onSearch])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && selected.length > 0) {
            onChange(selected.slice(0, -1))
          }
        }
        if (e.key === "Escape") {
          input.blur()
          setOpen(false)
        }
      }
    },
    [selected, onChange]
  )

  const handleSelect = (option: Option) => {
    console.log('🎯 EnhancedMultiSelect handleSelect called with:', option)
    console.log('🎯 Current selected before:', selected)
    const newSelected = [...selected, option.value]
    console.log('🎯 New selected will be:', newSelected)
    
    setInputValue("")
    onChange(newSelected)
    setOpen(false)
    
    // Clear search results after selection
    if (hasSearched) {
      setSearchResults([])
      setHasSearched(false)
    }
    
    console.log('🎯 handleSelect completed, new selected state:', newSelected)
  }

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {/* Debug indicator */}
        <div className="text-xs text-blue-500 mb-1">
          🔍 Search Component Active (onSearch: {onSearch ? 'YES' : 'NO'}) | 
          Options: {options.length} | 
          Available: {availableOptions.length} | 
          Display: {displayOptions.length}
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {selected.map((selectedValue) => {
            // First try to find in search results, then in options
            let option = searchResults.find((opt) => opt.value === selectedValue)
            if (!option) {
              option = options.find((opt) => opt.value === selectedValue)
            }
            if (!option) {
              // If we still can't find it, create a placeholder option
              option = { label: `Company ${selectedValue}`, value: selectedValue }
            }
            return (
              <Badge key={selectedValue} variant="secondary" className="hover:bg-secondary">
                {option.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(selectedValue)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(selectedValue)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value
                console.log('Input onChange event:', value)
                handleInputChange(value)
              }}
              onClick={() => {
                console.log('Input clicked, opening dropdown')
                setOpen(true)
                // If no search function is provided, always show available options
                if (!onSearch) {
                  setHasSearched(false)
                }
              }}
              onBlur={() => {
                // Delay closing to allow for click events
                setTimeout(() => setOpen(false), 200)
              }}
              onFocus={() => {
                console.log('Input focused, opening dropdown')
                setOpen(true)
                // Show all available options when focused (if no search is active)
                if (!hasSearched) {
                  setSearchResults([])
                  setHasSearched(false)
                }
                // If no search function is provided, always show available options
                if (!onSearch) {
                  setHasSearched(false)
                }
              }}
              placeholder={selected.length === 0 ? placeholder : searchPlaceholder}
              disabled={disabled}
              className="ml-6 bg-transparent outline-none placeholder:text-muted-foreground flex-1 w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="relative mt-2">
        {open && (
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto max-h-60">
              {isSearching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              ) : displayOptions.length === 0 ? (
                <CommandEmpty className="py-6 text-center">
                  {hasSearched ? (
                    <div className="text-sm text-muted-foreground">
                      No results found for "{inputValue}"
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {inputValue.length < minSearchLength 
                        ? `Type at least ${minSearchLength} characters to search`
                        : "No options available"
                      }
                    </div>
                  )}
                </CommandEmpty>
              ) : (
                displayOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option)}
                    disabled={option.disabled}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {option.avatar && (
                        <img 
                          src={option.avatar} 
                          alt={option.label}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  )
} 