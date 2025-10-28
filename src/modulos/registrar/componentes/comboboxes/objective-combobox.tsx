"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const objectives = [
  { value: "control-plagas", label: "Control de plagas" },
  { value: "fertilizacion", label: "Fertilización" },
  { value: "analisis-suelo", label: "Análisis de suelo" },
  { value: "mejoramiento-cultivo", label: "Mejoramiento de cultivo" },
]

interface ObjectiveComboboxProps {
  value: string
  onValueChange: (value: string) => void
}

export function ObjectiveCombobox({ value, onValueChange }: ObjectiveComboboxProps) {
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
          {value ? objectives.find((objective) => objective.value === value)?.label : "Seleccionar objetivo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar objetivo..." />
          <CommandList>
            <CommandEmpty>No se encontró ningún objetivo.</CommandEmpty>
            <CommandGroup>
              {objectives.map((objective) => (
                <CommandItem
                  key={objective.value}
                  value={objective.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === objective.value ? "opacity-100" : "opacity-0")} />
                  {objective.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
