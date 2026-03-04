"use client";

import { useState, useRef } from "react";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Comboboxes
import { GenericCombobox } from "@/modulos/registrar/components/comboboxes/generic-combobox";
import { AsyncCombobox } from "@/modulos/registrar/components/comboboxes/async-combobox";

// Hooks
import { useFormularioRegistro } from "@/modulos/registrar/hooks/useFormularioRegistro";
import { useWorkOrderRegistration } from "@/modulos/registrar/hooks/useWorkOrderRegistration";

// Modales
import { CompanyModal } from "@/modulos/registrar/components/modals/company-modal";
import { ContactModal } from "@/modulos/registrar/components/modals/contact-modal";
import { FarmModal } from "@/modulos/registrar/components/modals/farm-modal";
import { SpeciesModal } from "@/modulos/registrar/components/modals/species-modal";
import { ProductModal } from "@/modulos/registrar/components/modals/product-modal";
import { AddToOTConfirmationDialog } from "@/modulos/registrar/components/modals/add-to-ot-confirmation-dialog";
import { SearchOTDialog } from "@/modulos/registrar/components/modals/search-ot-dialog";

// Tabla de pruebas
import { WorkOrderTestsTable } from "@/modulos/registrar/components/work-order-tests-table";

// Tipos y servicios de gestión de pruebas
import type { OTData, VistaMaestraRow } from "@/modulos/registrar/servicios/workOrderService";
import {
  obtenerPruebaPorId,
  actualizarPrueba,
  eliminarPrueba,
} from "@/modulos/registrar/servicios/workOrderService";

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

  // Estado para edición / duplicado / eliminación de pruebas
  const [pruebaEditando, setPruebaEditando] = useState<VistaMaestraRow | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [pruebaAEliminar, setPruebaAEliminar] = useState<VistaMaestraRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

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
    recargarEspecies,
    buscarProductosAsync,
    contactoDisabled,
    unidadesProducto,
    productoCasaComercial,
    productoTipo,
    objetivoTipoPrueba,
    cargarDatosOT: cargarDatosOTHook,
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
    setOrdenEspecifica,
  } = useWorkOrderRegistration();

  // Estados de los modales
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [speciesModalOpen, setSpeciesModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Estados para modo adicionar
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [adicionarMode, setAdicionarMode] = useState(false);

  // Determinar qué campos deben estar deshabilitados
  // Los campos de orden (Facturar, Contacto, Finca, Descuento) se deshabilitan después de registrar la primera prueba
  const isFieldDisabled = (fieldType: "main" | "test-specific") => {
    // Si está en modo adicionar, bloquear campos principales
    if (adicionarMode) {
      return fieldType === "main";
    }
    if (mode === "add-to-existing") {
      return fieldType === "main";
    }
    if (fieldType === "main") {
      return disabled || hasPruebasRegistradas; // Bloquear solo después de registrar la primera prueba
    }
    return disabled;
  };

  /**
   * Carga los datos de una OT existente para adicionar pruebas
   * rerender-functional-setstate - Stable callback
   */
  /**
   * Carga los datos de una OT existente para adicionar pruebas
   * async-defer-await - Wait for data to load before proceeding
   */
  const cargarDatosOT = async (otData: OTData) => {
    // 1. Cargar compañía, contacto y finca usando la función del hook
    // que se encarga de agregar los items a las listas si no están presentes
    await cargarDatosOTHook(otData.facturarA, otData.contacto, otData.finca);
    
    // 2. Establecer descuento
    if (descuentoRef.current) {
      descuentoRef.current.value = otData.descuento;
    }

    // 3. Establecer modo de adición
    setAdicionarMode(true);

    // 4. Actualizar número de OT en el hook
    setOrdenEspecifica(otData.numeroOT);
  };

  /**
   * Limpia los campos específicos de prueba después de guardar
   * rerender-functional-setstate - Stable callback
   */
  const limpiarCamposPrueba = () => {
    // Limpiar campos de texto
    if (dosisRef.current) {
      dosisRef.current.value = "";
      dosisRef.current.placeholder = "";
    }
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
   * Pre-rellena todos los campos del formulario con datos de una prueba existente
   */
  const preRellenarFormulario = async (prueba: VistaMaestraRow) => {
    await cargarDatosOTHook(
      prueba.facturara || "",
      prueba.contacto || "",
      prueba.finca_nombre || ""
    );

    setSelectedObjetivo(prueba.objetivo_nombre || "");
    setSelectedEspecie(prueba.especie_nombre || "");
    setSelectedProducto(prueba.producto_nombre || "", prueba.producto_unid || undefined);

    if (dosisRef.current) dosisRef.current.value = prueba.dosis_producto || "";
    if (cantidadPruebasRef.current) cantidadPruebasRef.current.value = prueba.prueba_cantidad || "1";
    if (observacionesRef.current) observacionesRef.current.value = prueba.observaciones || "";
    if (numeroMuestraRef.current) numeroMuestraRef.current.value = prueba.prueba_numero_muestra?.toString() || "";

    if (prueba.fecha_recibo_muestra) {
      setDate(new Date(prueba.fecha_recibo_muestra));
    } else {
      setDate(undefined);
    }

    if (prueba.prueba_id) {
      try {
        const pruebaDatos = await obtenerPruebaPorId(prueba.prueba_id);
        if (analisisSolicitadoRef.current)
          analisisSolicitadoRef.current.value = pruebaDatos.prueba_inst || "";
        if (notasVariasRef.current)
          notasVariasRef.current.value = pruebaDatos.prueba_notas_varias || "";
      } catch (err) {
        console.error("Error al obtener datos completos de prueba:", err);
      }
    }
  };

  /**
   * Carga datos en el formulario para EDITAR una prueba existente
   */
  const handleEditarPrueba = async (prueba: VistaMaestraRow) => {
    setEditError(null);
    await preRellenarFormulario(prueba);
    setPruebaEditando(prueba);
  };

  /**
   * Carga datos en el formulario para DUPLICAR una prueba (crea una nueva)
   */
  const handleDuplicarPrueba = async (prueba: VistaMaestraRow) => {
    setEditError(null);
    await preRellenarFormulario(prueba);
    setPruebaEditando(null);
  };

  /**
   * Solicita confirmación antes de eliminar una prueba
   */
  const handleEliminarPrueba = (prueba: VistaMaestraRow) => {
    setPruebaAEliminar(prueba);
    setDeleteDialogOpen(true);
  };

  /**
   * Ejecuta la eliminación de la prueba confirmada
   */
  const handleConfirmarEliminar = async () => {
    if (!pruebaAEliminar?.prueba_id) return;
    setDeleteSubmitting(true);
    try {
      await eliminarPrueba(pruebaAEliminar.prueba_id);
      setDeleteDialogOpen(false);
      setPruebaAEliminar(null);
      setLocalRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error al eliminar prueba:", err);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  /**
   * Cancela el modo de edición y limpia el formulario
   */
  const handleCancelarEdicion = () => {
    setPruebaEditando(null);
    setEditError(null);
    limpiarCamposPrueba();
  };

  /**
   * js-early-exit: Returns placeholder text when field is empty and product is selected.
   * rerender-use-ref-transient-values: Reads DOM ref directly without triggering re-render.
   */
  const getDosisValue = (): string => {
    const value = dosisRef.current?.value ?? "";
    if (!value && dosisRef.current?.placeholder === "Por definir") {
      return "Por definir";
    }
    return value;
  };

  /**
   * Maneja el evento de guardar y continuar
   * async-defer-await - Defer await to where result is used
   */
  const onContinuar = async () => {
    // Modo edición: actualizar prueba existente
    if (pruebaEditando) {
      if (!pruebaEditando.prueba_id) return;
      setEditSubmitting(true);
      setEditError(null);
      try {
        await actualizarPrueba(pruebaEditando.prueba_id, {
          objetivo_nombre: selectedObjetivo || null,
          finca_nombre: selectedFinca || null,
          especie_nombre: selectedEspecie || null,
          producto_nombre: selectedProducto || null,
          dosis_producto: getDosisValue() || null,
          producto_unid: unidadesProducto || null,
          cantidad: cantidadPruebasRef.current?.value || null,
          observaciones: observacionesRef.current?.value || null,
          notas_varias: notasVariasRef.current?.value || null,
          analisis_solicitado: analisisSolicitadoRef.current?.value || null,
          numero_muestra: numeroMuestraRef.current?.value || null,
          fecha_recibido: date ? date.toISOString().split("T")[0] : null,
        });
        setPruebaEditando(null);
        limpiarCamposPrueba();
        setLocalRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        setEditError(
          err instanceof Error ? err.message : "Error al actualizar la prueba"
        );
      } finally {
        setEditSubmitting(false);
      }
      return;
    }

    // Modo normal: registrar nueva prueba
    const formData = {
      facturar: selectedCompania,
      contacto: selectedContacto,
      finca: selectedFinca,
      descuento: descuentoRef.current?.value || "",
      objetivo: selectedObjetivo,
      cantidadPruebas: cantidadPruebasRef.current?.value || "1",
      especieVegetal: selectedEspecie,
      producto: selectedProducto,
      dosis: getDosisValue(),
      unidadesProducto: unidadesProducto,
      numeroMuestra: numeroMuestraRef.current?.value || "",
      fechaRecepcion: date,
      observaciones: observacionesRef.current?.value || "",
      analisisSolicitado: analisisSolicitadoRef.current?.value || "",
      notasVarias: notasVariasRef.current?.value || "",
    };

    await handleSubmit(formData);

    if (!registrationError) {
      limpiarCamposPrueba();
    }
  };

  // Handlers para cuando se crea un nuevo item en los modales
  // async-defer-await: await reload before selecting so the item is in the list
  const handleCompanyCreated = async (nombre: string) => {
    setCompanyModalOpen(false);
    await recargarCompanias();
    setSelectedCompania(nombre);
  };

  // async-defer-await: await reload before selecting so the item is in the list
  const handleContactCreated = async (nombreCompleto: string) => {
    setContactModalOpen(false);
    await recargarContactos();
    setSelectedContacto(nombreCompleto);
  };

  // async-defer-await: await reload before selecting so the item is in the list
  const handleFarmCreated = async (nombre: string) => {
    setFarmModalOpen(false);
    await recargarFincas();
    setSelectedFinca(nombre);
  };

  // async-defer-await: await reload before selecting so the item is in the list
  const handleSpeciesCreated = async (nombre: string) => {
    setSpeciesModalOpen(false);
    await recargarEspecies();
    setSelectedEspecie(nombre);
  };

  // AsyncCombobox searches on demand — no reload needed, set selection directly
  const handleProductCreated = (nombre: string, unidades: string, casaComercial: string, tipo: string) => {
    setProductModalOpen(false);
    setSelectedProducto(nombre, unidades, casaComercial, tipo);
    if (dosisRef.current) {
      dosisRef.current.value = "";
      dosisRef.current.placeholder = nombre ? "Por definir" : "";
    }
  };

  return (
    <div className="space-y-1 pt-0.5">
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

      {editError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{editError}</AlertDescription>
        </Alert>
      )}

      {/* Indicador de modo edición */}
      {pruebaEditando && (
        <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
            Editando Prueba #{pruebaEditando.prueba_id}
          </Badge>
          <span className="text-xs text-amber-700 flex-1">
            Modifique los campos y haga clic en "Guardar Cambios"
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-amber-700 hover:text-amber-900"
            onClick={handleCancelarEdicion}
            title="Cancelar edición"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
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
        {/* Fila 1: OT, Adicionar, Prueba, Facturar a, Contacto */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-1 space-y-0.5">
            <Label htmlFor="ot" className="text-xs">
              OT
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="ot"
                value={ordenActual || "---"}
                readOnly
                className="w-full bg-muted h-8 text-center font-semibold"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={isSubmitting || adicionarMode}
                className="h-8 w-8 flex-shrink-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                title="Adicionar a OT existente"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
                      setSelectedProducto(
                        value,
                        item?.unidades,
                        item?.casaComercial,
                        item?.tipo
                      );
                      // rerender-use-ref-transient-values: mutate DOM directly, no re-render needed
                      if (dosisRef.current) {
                        dosisRef.current.value = "";
                        dosisRef.current.placeholder = value ? "Por definir" : "";
                      }
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
                <div className="space-y-1">
                  <Input
                    ref={dosisRef}
                    id="dosis"
                    type="text"
                    className="h-8"
                    disabled={isFieldDisabled("test-specific")}
                  />
                  {selectedProducto && unidadesProducto && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70 leading-tight px-1 min-w-0">
                      <span className="font-medium shrink-0">Unid:</span>
                      <span className="truncate" title={unidadesProducto}>{unidadesProducto}</span>
                    </div>
                  )}
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

        {/* Fila 5: N° muestra, Fecha recibo muestra, Dto (%), Guardar y Continuar, Nueva OT */}
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

          {/* Fecha recibo muestra */}
          <div className="flex flex-col space-y-0.5">
            <Label className="text-xs">Fecha recibo muestra</Label>
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

          {/* Botón Guardar y Continuar / Guardar Cambios */}
          <Button
            type="button"
            onClick={() => void onContinuar()}
            disabled={(pruebaEditando ? editSubmitting : isSubmitting) || !selectedCompania}
            className={cn(
              "h-8 min-w-[160px] font-medium text-xs px-4 text-white",
              pruebaEditando
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-black hover:bg-black/90"
            )}
          >
            {(pruebaEditando ? editSubmitting : isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Guardando...
              </>
            ) : pruebaEditando ? (
              "Guardar Cambios"
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

      {/* Modales para adicionar a OT existente */}
      <AddToOTConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={() => {
          setConfirmDialogOpen(false);
          setSearchDialogOpen(true);
        }}
      />
      <SearchOTDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onOTSelected={cargarDatosOT}
        numeroOTMaximo={ordenActual || 0}
      />

      {/* Tabla de pruebas de la orden de trabajo */}
      <div className="mt-3">
        <WorkOrderTestsTable
          ordenTrabajo={ordenActual}
          refreshTrigger={shouldRefreshTable + localRefreshTrigger}
          onEdit={(prueba) => void handleEditarPrueba(prueba)}
          onDuplicate={(prueba) => void handleDuplicarPrueba(prueba)}
          onDelete={handleEliminarPrueba}
        />
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Eliminar prueba</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            ¿Está seguro que desea eliminar la{" "}
            <span className="font-semibold text-foreground">
              Prueba #{pruebaAEliminar?.prueba_id}
            </span>
            {pruebaAEliminar?.objetivo_nombre && (
              <> — {pruebaAEliminar.objetivo_nombre}</>
            )}
            ? Esta acción no se puede deshacer.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSubmitting}
              className="text-sm h-8"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmarEliminar()}
              disabled={deleteSubmitting}
              className="text-sm h-8"
            >
              {deleteSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
