"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const farms = [
  { value: "farm1", label: "Finca El Paraíso" },
  { value: "farm2", label: "Hacienda San José" },
  { value: "farm3", label: "Finca Los Naranjos" },
]

interface FarmComboboxProps {
  value: string
  onValueChange: (value: string) => void
  onCreateNew: () => void
}

export function FarmCombobox({ value, onValueChange, onCreateNew }: FarmComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {value ? farms.find((farm) => farm.value === value)?.label : "Seleccionar finca..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar finca..." />
          <CommandList>
            <CommandEmpty>No se encontró ninguna finca.</CommandEmpty>
            <CommandGroup>
              {farms.map((farm) => (
                <CommandItem
                  key={farm.value}
                  value={farm.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === farm.value ? "opacity-100" : "opacity-0")} />
                  {farm.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  onCreateNew()
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear nueva finca
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
