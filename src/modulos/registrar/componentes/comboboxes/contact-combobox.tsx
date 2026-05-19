"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const contacts = [
  { value: "contact1", label: "Juan Pérez" },
  { value: "contact2", label: "María García" },
  { value: "contact3", label: "Carlos López" },
]

interface ContactComboboxProps {
  value: string
  onValueChange: (value: string) => void
  onCreateNew: () => void
}

export function ContactCombobox({ value, onValueChange, onCreateNew }: ContactComboboxProps) {
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
          {value ? contacts.find((contact) => contact.value === value)?.label : "Seleccionar contacto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar contacto..." />
          <CommandList>
            <CommandEmpty>No se encontró ningún contacto.</CommandEmpty>
            <CommandGroup>
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.value}
                  value={contact.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === contact.value ? "opacity-100" : "opacity-0")} />
                  {contact.label}
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
                Crear nuevo contacto
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
