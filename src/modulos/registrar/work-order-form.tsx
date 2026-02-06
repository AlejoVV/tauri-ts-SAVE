"use client";

import { useState, useRef } from "react";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

// Comboboxes
import { GenericCombobox } from "./components/comboboxes/generic-combobox";
import { AsyncCombobox } from "./components/comboboxes/async-combobox";

// Hooks
import { useFormularioRegistro } from "./hooks/useFormularioRegistro";
import { useWorkOrderRegistration } from "./hooks/useWorkOrderRegistration";

// Modales
import { CompanyModal } from "./components/modals/company-modal";
import { ContactModal } from "./components/modals/contact-modal";
import { FarmModal } from "./components/modals/farm-modal";
import { SpeciesModal } from "./components/modals/species-modal";
import { ProductModal } from "./components/modals/product-modal";

// Tabla de pruebas
import { WorkOrderTestsTable } from "./components/work-order-tests-table";

interface WorkOrderFormProps {
  mode?: "create-new" | "add-to-existing";
  disabled?: boolean;
}

export function WorkOrderForm({
  mode = "create-new",
  disabled = false,
}: WorkOrderFormProps) {
  // rerender-use-ref-transient-values - Use refs for form field values
  const dosisRef = useRef<HTMLInputElement>(null);
  const cantidadPruebasRef = useRef<HTMLInputElement>(null);
  const numeroMuestraRef = useRef<HTMLInputElement>(null);
  const descuentoRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);
  const analisisSolicitadoRef = useRef<HTMLTextAreaElement>(null);
  const notasVariasRef = useRef<HTMLTextAreaElement>(null);

  const [date, setDate] = useState<Date>();

  // Hook para manejar todos los datos del formulario conectados a la BD
  const {
    companias,
    contactos,
    fincas,
    objetivos,
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
    buscarProductosAsync,
    contactoDisabled,
    unidadesProducto,
    productoCasaComercial,
    productoTipo,
    objetivoTipoPrueba,
  } = useFormularioRegistro();

  // Hook para manejar el flujo de registro de órdenes y pruebas
  const {
    ordenActual,
    pruebaActual,
    isSubmitting,
    error: registrationError,
    successMessage,
    hasPruebasRegistradas,
    handleSubmit,
    shouldRefreshTable,
  } = useWorkOrderRegistration();

  // Estados de los modales
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [speciesModalOpen, setSpeciesModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Determinar qué campos deben estar deshabilitados
  // Los campos de orden (Facturar, Contacto, Finca, Descuento) se deshabilitan después de registrar la primera prueba
  const isFieldDisabled = (fieldType: "main" | "test-specific") => {
    if (mode === "add-to-existing") {
      return fieldType === "main";
    }
    if (fieldType === "main") {
      return disabled || hasPruebasRegistradas; // Bloquear solo después de registrar la primera prueba
    }
    return disabled;
  };

  /**
   * Limpia los campos específicos de prueba después de guardar
   * rerender-functional-setstate - Stable callback
   */
  const limpiarCamposPrueba = () => {
    // Limpiar campos de texto
    if (dosisRef.current) dosisRef.current.value = "";
    if (cantidadPruebasRef.current) cantidadPruebasRef.current.value = "1";
    if (numeroMuestraRef.current) numeroMuestraRef.current.value = "";
    if (observacionesRef.current) observacionesRef.current.value = "";
    if (analisisSolicitadoRef.current) analisisSolicitadoRef.current.value = "";
    if (notasVariasRef.current) notasVariasRef.current.value = "";

    // Limpiar comboboxes
    setSelectedObjetivo("", "");
    setSelectedProducto("", "cc/lt", "", "");
    setSelectedEspecie("");
    setDate(undefined);
  };

  /**
   * Maneja el evento de guardar y continuar
   * async-defer-await - Defer await to where result is used
   */
  const onContinuar = async () => {
    // Recopilar datos del formulario
    const formData = {
      facturar: selectedCompania,
      contacto: selectedContacto,
      finca: selectedFinca,
      descuento: descuentoRef.current?.value || "",
      objetivo: selectedObjetivo,
      cantidadPruebas: cantidadPruebasRef.current?.value || "1",
      especieVegetal: selectedEspecie,
      producto: selectedProducto,
      dosis: dosisRef.current?.value || "",
      unidadesProducto: unidadesProducto,
      numeroMuestra: numeroMuestraRef.current?.value || "",
      fechaRecepcion: date,
      observaciones: observacionesRef.current?.value || "",
      analisisSolicitado: analisisSolicitadoRef.current?.value || "",
      notasVarias: notasVariasRef.current?.value || "",
    };

    await handleSubmit(formData);

    // Limpiar campos de prueba después de guardar exitosamente
    if (!registrationError) {
      limpiarCamposPrueba();
    }
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
      {/* Alertas de estado */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {registrationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{registrationError}</AlertDescription>
        </Alert>
      )}

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

      <form className="space-y-0" onSubmit={(e) => e.preventDefault()}>
        {/* Fila 1: OT, Prueba, Facturar a, Contacto */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-1 space-y-0.5">
            <Label htmlFor="ot" className="text-xs">
              OT
            </Label>
            <Input
              id="ot"
              value={ordenActual || "---"}
              readOnly
              className="w-20 bg-muted h-8 text-center font-semibold"
            />
          </div>
          <div className="col-span-1 space-y-0.5">
            <Label htmlFor="prueba" className="text-xs">
              Prueba
            </Label>
            <Input
              id="prueba"
              value={pruebaActual || "---"}
              readOnly
              className="w-20 bg-muted h-8 text-center font-semibold"
            />
          </div>
          <div className="col-span-6 space-y-0.5">
            <Label className="text-xs">Facturar a</Label>
            <GenericCombobox
              items={companias}
              value={selectedCompania}
              onValueChange={(value) => setSelectedCompania(value)}
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
              onValueChange={(value) => setSelectedContacto(value)}
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
              onValueChange={(value, item) => {
                // Pass tipo de prueba from the selected item
                setSelectedObjetivo(value, item?.tipoPrueba);
              }}
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
            <div className="space-y-1">
              <Input
                ref={cantidadPruebasRef}
                id="cantidad-pruebas"
                type="number"
                min="1"
                defaultValue="1"
                className="h-8 w-full"
                disabled={isFieldDisabled("test-specific")}
              />
              {selectedObjetivo && objetivoTipoPrueba && (
                <div className="text-[11px] text-muted-foreground/70 leading-tight px-1">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Tipo:</span>
                    <span>{objetivoTipoPrueba}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-4 space-y-0">
            <Label className="text-xs">Finca de la cepa</Label>
            <GenericCombobox
              items={fincas}
              value={selectedFinca}
              onValueChange={(value) => setSelectedFinca(value)}
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
                  onValueChange={(value) => setSelectedEspecie(value)}
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
                <div className="space-y-1">
                  <AsyncCombobox
                    value={selectedProducto}
                    onValueChange={(value, item) => {
                      // Pass unidades, casa comercial y tipo from the selected item
                      setSelectedProducto(
                        value,
                        item?.unidades,
                        item?.casaComercial,
                        item?.tipo
                      );
                    }}
                    onSearch={buscarProductosAsync}
                    placeholder="Seleccionar producto..."
                    searchPlaceholder="Buscar producto..."
                    emptyMessage="No se encontraron productos."
                    onCreateNew={() => setProductModalOpen(true)}
                    createNewLabel="Crear nuevo producto"
                    disabled={isFieldDisabled("test-specific")}
                    debounceMs={300}
                    minCharsToSearch={0}
                  />
                  {selectedProducto &&
                    (productoCasaComercial || productoTipo) && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70 leading-tight px-1">
                        {productoCasaComercial && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Casa:</span>
                            <span>{productoCasaComercial}</span>
                          </span>
                        )}
                        {productoCasaComercial && productoTipo && (
                          <span className="text-muted-foreground/50">•</span>
                        )}
                        {productoTipo && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Tipo:</span>
                            <span>{productoTipo}</span>
                          </span>
                        )}
                      </div>
                    )}
                </div>
              </div>
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="dosis" className="text-xs">
                  Dosis
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    ref={dosisRef}
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

            {/* Fila 4a: Análisis solicitado, Notas varias */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="analisis-solicitado" className="text-xs">
                  Análisis solicitado
                </Label>
                <Textarea
                  ref={analisisSolicitadoRef}
                  id="analisis-solicitado"
                  rows={2}
                  className="resize-none text-xs"
                  disabled={isFieldDisabled("test-specific")}
                />
              </div>
              <div className="flex flex-col space-y-0.5">
                <Label htmlFor="notas-varias" className="text-xs">
                  Notas varias
                </Label>
                <Textarea
                  ref={notasVariasRef}
                  id="notas-varias"
                  rows={2}
                  className="resize-none text-xs"
                  disabled={isFieldDisabled("test-specific")}
                />
              </div>
            </div>
          </div>

          {/* Columna derecha: Observaciones */}
          <div className="col-span-4 space-y-0.5">
            <Label htmlFor="observaciones" className="text-xs">
              Observaciones
            </Label>
            <Textarea
              ref={observacionesRef}
              id="observaciones"
              rows={3}
              className="resize-none text-xs"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>
        </div>

        {/* Fila 5: N° muestra, Fecha recepción, Dto (%), Guardar y Continuar, Nueva OT */}
        <div className="flex flex-wrap items-end gap-3">
          {/* N° muestra */}
          <div className="flex flex-col space-y-0.5">
            <Label htmlFor="numero-muestra" className="text-xs">
              N° muestra
            </Label>
            <Input
              ref={numeroMuestraRef}
              id="numero-muestra"
              type="number"
              className="h-8 w-24"
              disabled={isFieldDisabled("test-specific")}
            />
          </div>

          {/* Fecha recepción */}
          <div className="flex flex-col space-y-0.5">
            <Label className="text-xs">Fecha recepción</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 w-40 justify-start text-left font-normal text-xs",
                    !date && "text-muted-foreground"
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

          {/* Dto (%) */}
          <div className="flex flex-col space-y-0.5">
            <Label htmlFor="descuento" className="text-xs">
              Dto (%)
            </Label>
            <Input
              ref={descuentoRef}
              id="descuento"
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="h-8 w-20"
              disabled={isFieldDisabled("main")}
            />
          </div>

          {/* Botón Guardar y Continuar */}
          <Button
            type="button"
            onClick={onContinuar}
            disabled={isSubmitting || !selectedCompania}
            className="h-8 min-w-[160px] bg-black hover:bg-black/90 text-white font-medium text-xs px-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar y Continuar"
            )}
          </Button>

          {/* Botón Nueva OT */}
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="h-8 min-w-[120px] font-medium text-xs px-4 border-black text-black hover:bg-black hover:text-white transition-colors"
          >
            Nueva OT
          </Button>
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

      {/* Tabla de pruebas de la orden de trabajo */}
      <div className="mt-6">
        <WorkOrderTestsTable
          ordenTrabajo={ordenActual}
          refreshTrigger={shouldRefreshTable}
        />
      </div>
    </div>
  );
}
