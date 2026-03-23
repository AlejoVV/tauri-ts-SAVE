import { useEffect, useRef, useState } from "react";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { GenericCombobox } from "@/modulos/registrar/components/comboboxes/generic-combobox";
import { AsyncCombobox } from "@/modulos/registrar/components/comboboxes/async-combobox";
import { useFormularioRegistro } from "@/modulos/registrar/hooks/useFormularioRegistro";

import type { VistaMaestraRow } from "@/modulos/registrar/servicios/workOrderService";
import {
  obtenerPruebaPorId,
  actualizarPrueba,
} from "@/modulos/registrar/servicios/workOrderService";

interface EditTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prueba: VistaMaestraRow | null;
  onSuccess: () => void;
}

export function EditTestModal({
  open,
  onOpenChange,
  prueba,
  onSuccess,
}: EditTestModalProps) {
  const dosisRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const numeroMuestraRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);
  const analisisSolicitadoRef = useRef<HTMLTextAreaElement>(null);
  const notasVariasRef = useRef<HTMLTextAreaElement>(null);

  const [date, setDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    fincas,
    objetivos,
    especies,
    loading,
    selectedFinca,
    selectedObjetivo,
    selectedProducto,
    selectedEspecie,
    setSelectedFinca,
    setSelectedObjetivo,
    setSelectedProducto,
    setSelectedEspecie,
    buscarProductosAsync,
    unidadesProducto,
    cargarDatosOT,
  } = useFormularioRegistro();

  useEffect(() => {
    if (!prueba || !open) return;

    const cargarDatos = async () => {
      try {
        await cargarDatosOT(
          prueba.facturara || "",
          prueba.contacto || "",
          prueba.finca_nombre || ""
        );

        setSelectedObjetivo(prueba.objetivo_nombre || "");
        setSelectedEspecie(prueba.especie_nombre || "");
        setSelectedProducto(prueba.producto_nombre || "", prueba.producto_unid || undefined);

        if (prueba.prueba_id) {
          const pruebaDatos = await obtenerPruebaPorId(prueba.prueba_id);

          if (analisisSolicitadoRef.current)
            analisisSolicitadoRef.current.value = pruebaDatos.prueba_inst || "";
          if (notasVariasRef.current)
            notasVariasRef.current.value = pruebaDatos.prueba_notas_varias || "";
        }

        if (dosisRef.current)
          dosisRef.current.value = prueba.dosis_producto || "";
        if (cantidadRef.current)
          cantidadRef.current.value = prueba.prueba_cantidad || "1";
        if (numeroMuestraRef.current)
          numeroMuestraRef.current.value = prueba.prueba_numero_muestra || "";
        if (observacionesRef.current)
          observacionesRef.current.value = prueba.observaciones || "";

        if (prueba.fecha_recibo_muestra) {
          setDate(new Date(prueba.fecha_recibo_muestra));
        } else {
          setDate(undefined);
        }
      } catch (err) {
        console.error("Error al cargar datos de la prueba:", err);
      }
    };

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prueba, open]);

  const handleGuardar = async () => {
    if (!prueba?.prueba_id) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const result = await actualizarPrueba(prueba.prueba_id, {
      objetivo_nombre: selectedObjetivo || null,
      finca_nombre: selectedFinca || null,
      especie_nombre: selectedEspecie || null,
      producto_nombre: selectedProducto || null,
      dosis_producto: dosisRef.current?.value || null,
      producto_unid: unidadesProducto || null,
      cantidad: cantidadRef.current?.value || null,
      observaciones: observacionesRef.current?.value || null,
      notas_varias: notasVariasRef.current?.value || null,
      analisis_solicitado: analisisSolicitadoRef.current?.value || null,
      numero_muestra: numeroMuestraRef.current?.value || null,
      fecha_recibido: date ? date.toISOString().split("T")[0] : null,
    });

    if (!result.success) {
      setError(result.error ?? "Error al actualizar la prueba");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(`Prueba #${prueba.prueba_id} actualizada exitosamente`);
    setTimeout(() => {
      setSuccessMessage(null);
      onSuccess();
      onOpenChange(false);
    }, 1500);

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[90vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Editar Prueba{prueba?.prueba_id ? ` #${prueba.prueba_id}` : ""}
          </DialogTitle>
        </DialogHeader>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Facturar a</Label>
              <Input
                value={prueba?.facturara || "-"}
                readOnly
                className="h-9 bg-muted text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Contacto</Label>
              <Input
                value={prueba?.contacto || "-"}
                readOnly
                className="h-9 bg-muted text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-10 space-y-1">
              <Label className="text-sm">Objetivo</Label>
              <GenericCombobox
                items={objetivos}
                value={selectedObjetivo}
                onValueChange={(value, item) =>
                  setSelectedObjetivo(value, item?.tipoPrueba)
                }
                placeholder="Seleccionar objetivo..."
                searchPlaceholder="Buscar objetivo..."
                emptyMessage="No se encontraron objetivos."
                loading={loading.objetivos}
                className="min-h-[36px] h-auto py-1 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="edit-cantidad" className="text-sm">
                Cantidad
              </Label>
              <Input
                ref={cantidadRef}
                id="edit-cantidad"
                type="number"
                min="1"
                defaultValue="1"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 space-y-1">
              <Label className="text-sm">Finca</Label>
              <GenericCombobox
                items={fincas}
                value={selectedFinca}
                onValueChange={(value) => setSelectedFinca(value)}
                placeholder="Seleccionar finca..."
                searchPlaceholder="Buscar finca..."
                emptyMessage="No se encontraron fincas."
                loading={loading.fincas}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-sm">Especie</Label>
              <GenericCombobox
                items={especies}
                value={selectedEspecie}
                onValueChange={(value) => setSelectedEspecie(value)}
                placeholder="Seleccionar especie..."
                searchPlaceholder="Buscar especie..."
                emptyMessage="No se encontraron especies."
                loading={loading.especies}
              />
            </div>
            <div className="col-span-4 space-y-1">
              <Label className="text-sm">Producto</Label>
              <AsyncCombobox
                value={selectedProducto}
                onValueChange={(value, item) =>
                  setSelectedProducto(
                    value,
                    item?.unidades,
                    item?.casaComercial,
                    item?.tipo
                  )
                }
                onSearch={buscarProductosAsync}
                placeholder="Seleccionar producto..."
                searchPlaceholder="Buscar producto..."
                emptyMessage="No se encontraron productos."
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="edit-dosis" className="text-sm">
                Dosis
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  ref={dosisRef}
                  id="edit-dosis"
                  type="number"
                  step="0.01"
                  className="h-9 text-sm flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {unidadesProducto}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-analisis" className="text-sm">
                Análisis solicitado
              </Label>
              <Textarea
                ref={analisisSolicitadoRef}
                id="edit-analisis"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-notas" className="text-sm">
                Notas varias
              </Label>
              <Textarea
                ref={notasVariasRef}
                id="edit-notas"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-observaciones" className="text-sm">
              Observaciones
            </Label>
            <Textarea
              ref={observacionesRef}
              id="edit-observaciones"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="edit-numero-muestra" className="text-sm">
                N° muestra
              </Label>
              <Input
                ref={numeroMuestraRef}
                id="edit-numero-muestra"
                type="number"
                className="h-9 w-28 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Fecha recepción</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-44 justify-start text-left font-normal text-sm",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
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

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-sm h-9"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleGuardar()}
            disabled={isSubmitting}
            className="h-9 bg-black hover:bg-black/90 text-white text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
