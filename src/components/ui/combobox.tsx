"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search as SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ComboboxProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  notFoundMessage?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecione uma opção...",
  searchPlaceholder = "Buscar opção...",
  notFoundMessage = "Nenhuma opção encontrada.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  )

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? "" : selectedValue)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between active:scale-95 transition-transform", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-2xl border-primary/10">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3 py-2 bg-muted/20">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 w-full border-0 bg-transparent focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-[300px] overflow-y-auto">
            <div className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground italic">
                  {notFoundMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isActive = value === option.value
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary",
                        isActive && "bg-primary/5 text-primary font-semibold"
                      )}
                      onMouseDown={(e) => {
                        // Using onMouseDown to ensure selection happens BEFORE any other blur events
                        e.preventDefault() 
                        handleSelect(option.value)
                      }}
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {isActive && <Check className="h-4 w-4" />}
                      </span>
                      {option.label}
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}