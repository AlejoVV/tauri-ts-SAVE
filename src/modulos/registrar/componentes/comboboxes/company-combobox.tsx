"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const companies = [
  { value: "empresa1", label: "Empresa Agrícola S.A." },
  { value: "empresa2", label: "Cultivos del Valle Ltda." },
  { value: "empresa3", label: "Agropecuaria Los Andes" },
]

interface CompanyComboboxProps {
  value: string
  onValueChange: (value: string) => void
  onCreateNew: () => void
}

export function CompanyCombobox({ value, onValueChange, onCreateNew }: CompanyComboboxProps) {
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
          {value ? companies.find((company) => company.value === value)?.label : "Seleccionar compañía..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>No se encontró ninguna compañía.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.value}
                  value={company.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === company.value ? "opacity-100" : "opacity-0")} />
                  {company.label}
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
                Crear nueva compañía
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
