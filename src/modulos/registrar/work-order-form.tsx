"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// Combobox genérico
import { GenericCombobox } from "./components/comboboxes/generic-combobox";

// Hook para datos del formulario
import { useFormularioRegistro } from "./hooks/useFormularioRegistro";

// Modales
import { CompanyModal } from "./components/modals/company-modal";
import { ContactModal } from "./components/modals/contact-modal";
import { FarmModal } from "./components/modals/farm-modal";
import { SpeciesModal } from "./components/modals/species-modal";
import { ProductModal } from "./components/modals/product-modal";

interface WorkOrderFormProps {
  mode?: "create-new" | "add-to-existing";
  disabled?: boolean;
}

export function WorkOrderForm({
  mode = "create-new",
  disabled = false,
}: WorkOrderFormProps) {
  const [date, setDate] = useState<Date>();

  // Hook para manejar todos los datos del formulario conectados a la BD
  const {
    companias,
    contactos,
    fincas,
    objetivos,
    productos,
    especies,
    loading,
    selectedCompania,
    selectedContacto,
    selectedFinca,
    selectedObjetivo,
    selectedProducto,
    selectedEspecie,
    setSelectedCompania,
    setSelectedContacto,
    setSelectedFinca,
    setSelectedObjetivo,
    setSelectedProducto,
    setSelectedEspecie,
    recargarCompanias,
    recargarContactos,
    recargarFincas,
    recargarProductos,
    recargarEspecies,
    contactoDisabled,
    unidadesProducto,
  } = useFormularioRegistro();

  // Estados de los modales
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [speciesModalOpen, setSpeciesModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Determinar qué campos deben estar deshabilitados según el modo
  const isFieldDisabled = (fieldType: "main" | "test-specific") => {
    if (mode === "add-to-existing") {
      return fieldType === "main";
    }
    return disabled;
  };

  // Handlers para cuando se crea un nuevo item en los modales
  const handleCompanyCreated = () => {
    setCompanyModalOpen(false);
    recargarCompanias();
  };

  const handleContactCreated = () => {
    setContactModalOpen(false);
    recargarContactos();
  };

  const handleFarmCreated = () => {
    setFarmModalOpen(false);
    recargarFincas();
  };

  const handleSpeciesCreated = () => {
    setSpeciesModalOpen(false);
    recargarEspecies();
  };

  const handleProductCreated = () => {
    setProductModalOpen(false);
    recargarProductos();
  };

  return (
    <div className="space-y-2 pt-0.5">
      {/* Alerta informativa según el modo */}
      {mode === "add-to-existing" && (
        <Alert>
          <AlertDescription>
            <strong>Modo: Adicionar a OT existente</strong>
            <br />
            Los campos de información general están deshabilitados. Solo puede
            modificar los campos específicos de la nueva prueba.
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-0">
        {/* Fila 1: OT, Prueba, Facturar a, Contacto */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-1 space-y-0.5">
            <Label htmlFor="ot" className="text-xs">
              OT
            </Label>
            <Input
              id="ot"
              value={mode === "add-to-existing" ? "OT-2024-001" : "501"}
              readOnly
              className="w-20 bg-muted h-8"
            />
          </div>
          <div className="col-span-1 space-y-0.5">
            <Label htmlFor="prueba" className="text-xs">
              Prueba
            </Label>
            <Input
              id="prueba"
              value={mode === "add-to-existing" ? "1207" : "1204"}
              readOnly
              className="w-20 bg-muted h-8"
            />
          </div>
          <div className="col-span-6 space-y-0.5">
            <Label className="text-xs">Facturar a</Label>
            <GenericCombobox
              items={companias}
              value={selectedCompania}
              onValueChange={setSelectedCompania}
              placeholder="Seleccionar compañía..."
              searchPlaceholder="Buscar compañía..."
              emptyMessage="No se encontraron compañías."
              onCreateNew={() => setCompanyModalOpen(true)}
              createNewLabel="Crear nueva compañía"
              disabled={isFieldDisabled("main")}
              loading={loading.companias}
            />
          </div>
          <div className="col-span-4 space-y-0.5">
            <Label className="text-xs">
              Contacto
              {contactoDisabled && !isFieldDisabled("main") && (
                <span className="text-muted-foreground ml-1">
                  (seleccione empresa primero)
                </span>
              )}
            </Label>
            <GenericCombobox
              items={contactos}
              value={selectedContacto}
              onValueChange={setSelectedContacto}
              placeholder={
                contactoDisabled
                  ? "Seleccione empresa primero..."
                  : "Seleccionar contacto..."
              }
              searchPlaceholder="Buscar contacto..."
              emptyMessage={
                contactoDisabled
                  ? "Seleccione una empresa primero"
                  : "No hay contactos para esta empresa."
              }
              onCreateNew={
                !contactoDisabled ? () => setContactModalOpen(true) : undefined
              }
              createNewLabel="Crear nuevo contacto"
              disabled={isFieldDisabled("main") || contactoDisabled}
              loading={loading.contactos}
            />
          </div>
        </div>

        {/* Fila 2: Objetivo, Cant. pruebas, Finca de la cepa */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-7 space-y-0">
            <Label className="text-xs">Objetivo</Label>
            <GenericCombobox
              items={objetivos}
              value={selectedObjetivo}
              onValueChange={setSelectedObjetivo}
              placeholder="Seleccionar objetivo..."
              searchPlaceholder="Buscar objetivo..."
              emptyMessage="No se encontraron objetivos."
              disabled={isFieldDisabled("test-specific")}
              loading={loading.objetivos}
              className="min-h-[60px] h-auto py-2 text-xs leading-[1.3] whitespace-normal [&>span]:line-clamp-3"
            />
          </div>
          <div className="col-span-1 space-y-0">
            <Label htmlFor="cantidad-pruebas" className="text-xs">
              Cant. pruebas
            </Label>
            <Input
              id="cantidad-pruebas"
              type="number"
              min="1"
              defaultValue="1"
              className="h-8 w-full"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>
          <div className="col-span-4 space-y-0">
            <Label className="text-xs">Finca de la cepa</Label>
            <GenericCombobox
              items={fincas}
              value={selectedFinca}
              onValueChange={setSelectedFinca}
              placeholder="Seleccionar finca..."
              searchPlaceholder="Buscar finca..."
              emptyMessage="No se encontraron fincas."
              onCreateNew={() => setFarmModalOpen(true)}
              createNewLabel="Crear nueva finca"
              disabled={isFieldDisabled("main")}
              loading={loading.fincas}
            />
          </div>
        </div>

        {/* Filas 3-4: Layout de dos columnas */}
        <div className="grid grid-cols-12 gap-3">
          {/* Columna izquierda */}
          <div className="col-span-8 space-y-1">
            {/* Fila 3a: Especie vegetal, Producto, Dosis */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-4 space-y-0">
                <Label className="text-xs">Especie vegetal</Label>
                <GenericCombobox
                  items={especies}
                  value={selectedEspecie}
                  onValueChange={setSelectedEspecie}
                  placeholder="Seleccionar especie..."
                  searchPlaceholder="Buscar especie..."
                  emptyMessage="No se encontraron especies."
                  onCreateNew={() => setSpeciesModalOpen(true)}
                  createNewLabel="Crear nueva especie"
                  disabled={isFieldDisabled("test-specific")}
                  loading={loading.especies}
                />
              </div>
              <div className="col-span-5 space-y-0.5">
                <Label className="text-xs font-semibold">Producto</Label>
                <GenericCombobox
                  items={productos}
                  value={selectedProducto}
                  onValueChange={setSelectedProducto}
                  placeholder="Seleccionar producto..."
                  searchPlaceholder="Buscar producto..."
                  emptyMessage="No se encontraron productos."
                  onCreateNew={() => setProductModalOpen(true)}
                  createNewLabel="Crear nuevo producto"
                  disabled={isFieldDisabled("test-specific")}
                  loading={loading.productos}
                />
              </div>
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="dosis" className="text-xs">
                  Dosis
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="dosis"
                    type="number"
                    step="0.01"
                    className="flex-1 h-8"
                    disabled={isFieldDisabled("test-specific")}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {unidadesProducto}
                  </span>
                </div>
              </div>
            </div>

            {/* Fila 4a: N° muestra, Fecha recepción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col space-y-0.5 w-full sm:w-auto">
                <Label htmlFor="numero-muestra" className="text-xs">
                  N° muestra
                </Label>
                <Input
                  id="numero-muestra"
                  type="number"
                  className="h-8 w-full sm:w-20 lg:w-24"
                  disabled={isFieldDisabled("test-specific")}
                />
              </div>
              <div className="flex flex-col space-y-0.5 w-full sm:w-auto">
                <Label className="text-xs">Fecha recepción</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full sm:w-34 lg:w-38 justify-start text-left font-normal text-xs",
                        !date && "text-muted-foreground",
                      )}
                      disabled={isFieldDisabled("test-specific")}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {date
                          ? format(date, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar fecha"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      autoFocus
                      captionLayout="dropdown"
                      startMonth={new Date(2020, 0)}
                      endMonth={new Date(2030, 11)}
                      locale={es}
                      className="rounded-lg border shadow-sm w-[240px] p-2 [--cell-size:1.75rem]"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Columna derecha: Observaciones */}
          <div className="col-span-4 space-y-0.5">
            <Label htmlFor="observaciones" className="text-xs">
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              rows={3}
              className="resize-none text-xs"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>
        </div>

        {/* Fila 5: Análisis solicitado, Notas varias, Dto (%) y Botón */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Análisis solicitado */}
          <div className="flex flex-col space-y-0.5 w-full lg:flex-1">
            <Label htmlFor="analisis-solicitado" className="text-xs">
              Análisis solicitado
            </Label>
            <Textarea
              id="analisis-solicitado"
              rows={2}
              className="resize-none text-xs"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>

          {/* Notas varias */}
          <div className="flex flex-col space-y-0.5 w-full lg:flex-1">
            <Label htmlFor="notas-varias" className="text-xs">
              Notas varias
            </Label>
            <Textarea
              id="notas-varias"
              rows={2}
              className="resize-none text-xs"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>

          {/* Dto y Botón */}
          <div className="flex flex-col space-y-1.5 w-full lg:w-auto">
            <div className="flex flex-col space-y-0.5">
              <Label htmlFor="descuento" className="text-xs">
                Dto (%)
              </Label>
              <Input
                id="descuento"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="h-8 w-full lg:w-20"
                disabled={isFieldDisabled("main")}
              />
            </div>
            <Button
              type="button"
              onClick={() => console.log("Guardar y Continuar clicked")}
              className="w-full lg:w-auto lg:min-w-[160px] bg-black hover:bg-black/90 text-white font-medium text-xs px-4 h-8 relative z-10 pointer-events-auto cursor-pointer"
            >
              Guardar y Continuar
            </Button>
          </div>
        </div>
      </form>

      {/* Modales */}
      <CompanyModal
        open={companyModalOpen}
        onOpenChange={setCompanyModalOpen}
        onSuccess={handleCompanyCreated}
      />
      <ContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        compania={selectedCompania}
        onSuccess={handleContactCreated}
      />
      <FarmModal
        open={farmModalOpen}
        onOpenChange={setFarmModalOpen}
        onSuccess={handleFarmCreated}
      />
      <SpeciesModal
        open={speciesModalOpen}
        onOpenChange={setSpeciesModalOpen}
        onSuccess={handleSpeciesCreated}
      />
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSuccess={handleProductCreated}
      />
    </div>
  );
}
