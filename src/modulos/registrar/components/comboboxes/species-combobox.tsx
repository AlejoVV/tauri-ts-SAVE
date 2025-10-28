"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const species = [
  { value: "tomate", label: "Tomate" },
  { value: "papa", label: "Papa" },
  { value: "maiz", label: "Maíz" },
  { value: "frijol", label: "Frijol" },
]

interface SpeciesComboboxProps {
  value: string
  onValueChange: (value: string) => void
  onCreateNew: () => void
}

export function SpeciesCombobox({ value, onValueChange, onCreateNew }: SpeciesComboboxProps) {
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
          {value ? species.find((specie) => specie.value === value)?.label : "Seleccionar especie..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar especie..." />
          <CommandList>
            <CommandEmpty>No se encontró ninguna especie.</CommandEmpty>
            <CommandGroup>
              {species.map((specie) => (
                <CommandItem
                  key={specie.value}
                  value={specie.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === specie.value ? "opacity-100" : "opacity-0")} />
                  {specie.label}
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
                Crear nueva especie
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
