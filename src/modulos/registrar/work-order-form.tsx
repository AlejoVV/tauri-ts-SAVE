"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

// Comboboxes
import { CompanyCombobox } from "./components/comboboxes/company-combobox"
import { ContactCombobox } from "./components/comboboxes/contact-combobox"
import { FarmCombobox } from "./components/comboboxes/farm-combobox"
import { SpeciesCombobox } from "./components/comboboxes/species-combobox"
import { ProductCombobox } from "./components/comboboxes/product-combobox"
import { ObjectiveCombobox } from "./components/comboboxes/objective-combobox"

// Modales
import { CompanyModal } from "./components/modals/company-modal"
import { ContactModal } from "./components/modals/contact-modal"
import { FarmModal } from "./components/modals/farm-modal"
import { SpeciesModal } from "./components/modals/species-modal"
import { ProductModal } from "./components/modals/product-modal"

interface WorkOrderFormProps {
  mode?: "create-new" | "add-to-existing"
  disabled?: boolean
}

export function WorkOrderForm({ mode = "create-new", disabled = false }: WorkOrderFormProps) {
  const [date, setDate] = useState<Date>()
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedContact, setSelectedContact] = useState("")
  const [selectedFarm, setSelectedFarm] = useState("")
  const [selectedSpecies, setSelectedSpecies] = useState("")
  const [selectedObjective, setSelectedObjective] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")

  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [farmModalOpen, setFarmModalOpen] = useState(false)
  const [speciesModalOpen, setSpeciesModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)

  // Determinar qué campos deben estar deshabilitados según el modo
  const isFieldDisabled = (fieldType: "main" | "test-specific") => {
    if (mode === "add-to-existing") {
      // En modo "adicionar", los campos principales están deshabilitados
      // Solo los campos específicos de la prueba están habilitados
      return fieldType === "main"
    }
    return disabled
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Alerta informativa según el modo */}
      {mode === "add-to-existing" && (
        <Alert>
          <AlertDescription>
            <strong>Modo: Adicionar a OT existente</strong>
            <br />
            Los campos de información general (Facturar a, Contacto, Finca, etc.) están deshabilitados. Solo puede
            modificar los campos específicos de la nueva prueba (Producto, Dosis, Observaciones, etc.).
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-8">
        {/* Sección 1: Identificadores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identificadores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ot">OT</Label>
              <Input id="ot" value={mode === "add-to-existing" ? "OT-2024-001" : "501"} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prueba">Prueba</Label>
              <Input id="prueba" value={mode === "add-to-existing" ? "1207" : "1204"} readOnly className="bg-muted" />
            </div>
          </div>
        </div>

        {/* Sección 2: Datos Principales */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Datos Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facturar a - Deshabilitado en modo "adicionar" */}
            <div className="space-y-2">
              <Label>Facturar a</Label>
              <CompanyCombobox
                value={selectedCompany}
                onValueChange={setSelectedCompany}
                onCreateNew={() => setCompanyModalOpen(true)}
                disabled={isFieldDisabled("main")}
              />
            </div>

            {/* Contacto - Deshabilitado en modo "adicionar" */}
            <div className="space-y-2">
              <Label>Contacto</Label>
              <ContactCombobox
                value={selectedContact}
                onValueChange={setSelectedContact}
                onCreateNew={() => setContactModalOpen(true)}
                disabled={isFieldDisabled("main")}
              />
            </div>

            {/* Finca de la cepa - Deshabilitado en modo "adicionar" */}
            <div className="space-y-2">
              <Label>Finca de la cepa</Label>
              <FarmCombobox
                value={selectedFarm}
                onValueChange={setSelectedFarm}
                onCreateNew={() => setFarmModalOpen(true)}
                disabled={isFieldDisabled("main")}
              />
            </div>

            {/* Especie vegetal - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label>Especie vegetal</Label>
              <SpeciesCombobox
                value={selectedSpecies}
                onValueChange={setSelectedSpecies}
                onCreateNew={() => setSpeciesModalOpen(true)}
                disabled={isFieldDisabled("test-specific")}
              />
            </div>

            {/* Objetivo - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <ObjectiveCombobox
                value={selectedObjective}
                onValueChange={setSelectedObjective}
                disabled={isFieldDisabled("test-specific")}
              />
            </div>

            {/* Producto - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label>Producto</Label>
              <ProductCombobox
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                onCreateNew={() => setProductModalOpen(true)}
                disabled={isFieldDisabled("test-specific")}
              />
            </div>

            {/* Dosis - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label htmlFor="dosis">Dosis</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="dosis"
                  type="number"
                  step="0.01"
                  className="flex-1"
                  disabled={isFieldDisabled("test-specific")}
                />
                <span className="text-sm text-muted-foreground">cc/lt</span>
              </div>
            </div>

            {/* Descuento - Deshabilitado en modo "adicionar" */}
            <div className="space-y-2">
              <Label htmlFor="descuento">Descuento de la orden (%)</Label>
              <Input id="descuento" type="number" min="0" max="100" step="0.01" disabled={isFieldDisabled("main")} />
            </div>

            {/* Cantidad de pruebas - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label htmlFor="cantidad-pruebas">Cantidad de pruebas</Label>
              <Input
                id="cantidad-pruebas"
                type="number"
                min="1"
                defaultValue="1"
                disabled={isFieldDisabled("test-specific")}
              />
            </div>

            {/* Número de muestra - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label htmlFor="numero-muestra">Número de muestra</Label>
              <Input id="numero-muestra" type="number" disabled={isFieldDisabled("test-specific")} />
            </div>

            {/* Fecha de recepción - Habilitado en ambos modos */}
            <div className="space-y-2">
              <Label>Fecha de recepción</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    disabled={isFieldDisabled("test-specific")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Sección 3: Campos de Texto Largos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información Adicional</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" rows={4} disabled={isFieldDisabled("test-specific")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas-varias">Notas varias</Label>
              <Textarea id="notas-varias" rows={4} disabled={isFieldDisabled("test-specific")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analisis-solicitado">Análisis solicitado</Label>
              <Textarea id="analisis-solicitado" rows={4} disabled={isFieldDisabled("test-specific")} />
            </div>
          </div>
        </div>
      </form>

      {/* Modales */}
      <CompanyModal open={companyModalOpen} onOpenChange={setCompanyModalOpen} />
      <ContactModal open={contactModalOpen} onOpenChange={setContactModalOpen} />
      <FarmModal open={farmModalOpen} onOpenChange={setFarmModalOpen} />
      <SpeciesModal open={speciesModalOpen} onOpenChange={setSpeciesModalOpen} />
      <ProductModal open={productModalOpen} onOpenChange={setProductModalOpen} />
    </div>
  )
}
