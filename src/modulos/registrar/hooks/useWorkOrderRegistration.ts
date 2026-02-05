// Hook para manejar el flujo de registro de órdenes de trabajo y pruebas
import { useState, useCallback, useEffect, useRef } from "react";
import {
  obtenerProximosIds,
  crearOrdenConPrueba,
  agregarPruebaAOrden,
  obtenerFincaId,
  obtenerObjetivoId,
  obtenerEspecieId,
  obtenerProductoId,
  type DatosOrdenTrabajo,
  type DatosPrueba,
} from "../servicios/registroService";

// rerender-use-ref-transient-values - Use refs for transient frequent values
interface FormData {
  // Datos de la orden (no cambian al agregar pruebas)
  facturar: string;
  contacto: string;
  finca: string;
  descuento: string;

  // Datos de la prueba (cambian con cada prueba)
  objetivo: string;
  cantidadPruebas: string;
  especieVegetal: string;
  producto: string;
  dosis: string;
  unidadesProducto: string;
  numeroMuestra: string;
  fechaRecepcion: Date | undefined;
  observaciones: string;
  analisisSolicitado: string;
  notasVarias: string;
}

export interface UseWorkOrderRegistrationReturn {
  // IDs actuales
  ordenActual: number | null;
  pruebaActual: number;

  // Estados
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
  hasPruebasRegistradas: boolean; // Indica si ya se registró al menos una prueba

  // Funciones
  handleSubmit: (formData: FormData) => Promise<void>;
  resetForm: () => void;
  refreshIds: () => Promise<void>;

  // Trigger para recargar tabla
  shouldRefreshTable: number;
}

export function useWorkOrderRegistration(): UseWorkOrderRegistrationReturn {
  // Estados
  const [ordenActual, setOrdenActual] = useState<number | null>(null);
  const [pruebaActual, setPruebaActual] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldRefreshTable, setShouldRefreshTable] = useState(0);
  const [hasPruebasRegistradas, setHasPruebasRegistradas] = useState(false);

  // rerender-use-ref-transient-values - Store last form data in ref
  const lastFormDataRef = useRef<FormData | null>(null);

  /**
   * Carga los próximos IDs disponibles al iniciar
   * async-parallel - Load IDs in parallel
   */
  const refreshIds = useCallback(async () => {
    try {
      const { siguienteOrdenId, siguientePruebaId } =
        await obtenerProximosIds();
      setOrdenActual(siguienteOrdenId);
      setPruebaActual(siguientePruebaId);
    } catch (err) {
      console.error("Error al cargar IDs:", err);
      setError("Error al cargar los identificadores");
    }
  }, []);

  // Cargar IDs al montar el componente
  useEffect(() => {
    refreshIds();
  }, [refreshIds]);

  /**
   * Obtiene los IDs de las entidades relacionadas por sus nombres
   * async-parallel - Parallel fetching of entity IDs
   */
  const obtenerIdsEntidades = useCallback(
    async (formData: FormData) => {
      // js-early-exit - Return early for missing data
      if (!formData.facturar) {
        throw new Error("Debe seleccionar una compañía");
      }

      // async-parallel - Fetch all IDs in parallel
      const [fincaId, objetivoId, especieId, productoId] = await Promise.all([
        formData.finca ? obtenerFincaId(formData.finca) : Promise.resolve(null),
        formData.objetivo
          ? obtenerObjetivoId(formData.objetivo)
          : Promise.resolve(null),
        formData.especieVegetal
          ? obtenerEspecieId(formData.especieVegetal)
          : Promise.resolve(null),
        formData.producto
          ? obtenerProductoId(formData.producto)
          : Promise.resolve(null),
      ]);

      return { fincaId, objetivoId, especieId, productoId };
    },
    []
  );

  /**
   * Maneja el envío del formulario (Continuar)
   * rerender-functional-setstate - Use functional setState for stable callbacks
   */
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      // js-early-exit - Return early if already submitting
      if (isSubmitting) return;

      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Obtener IDs de las entidades relacionadas
        const { fincaId, objetivoId, especieId, productoId } =
          await obtenerIdsEntidades(formData);

        // Preparar datos de la prueba
        const datosPrueba: Omit<DatosPrueba, "prueba_orden_id"> = {
          prueba_id: pruebaActual,
          prueba_objetivo_id: objetivoId,
          prueba_producto_id: productoId,
          prueba_dosis_producto: formData.dosis,
          prueba_producto_unid: formData.unidadesProducto || "cc/lt",
          prueba_especie_id: especieId,
          prueba_cantidad: formData.cantidadPruebas || "1",
          prueba_finca_id: fincaId,
          prueba_precio: null, // Se calculará después según objetivo y tipo
          prueba_obs: formData.observaciones || null,
          prueba_notas_varias: formData.notasVarias || null,
          prueba_fecha_recibido: formData.fechaRecepcion
            ? formData.fechaRecepcion.toISOString().split("T")[0]
            : null,
          prueba_compania: formData.facturar,
          prueba_contacto: formData.contacto || null,
          prueba_numero_muestra: formData.numeroMuestra || null,
          prueba_estado_proceso: "En Proceso",
        };

        // Verificar si es la primera prueba de una nueva orden o una prueba adicional
        const esNuevaOrden = !hasPruebasRegistradas;

        if (esNuevaOrden) {
          // Primera prueba: Crear orden y prueba
          const datosOrden: DatosOrdenTrabajo = {
            orden_descuento: formData.descuento || null,
            orden_compra: null,
            orden_estado_ot: "Pendiente",
          };

          const { ordenId, pruebaId } = await crearOrdenConPrueba(
            datosOrden,
            datosPrueba
          );

          setOrdenActual(ordenId);
          setHasPruebasRegistradas(true); // Marcar que ya se registró la primera prueba
          setSuccessMessage(
            `Orden de Trabajo #${ordenId} y Prueba #${pruebaId} creadas exitosamente`
          );
        } else {
          // Prueba adicional: Agregar a la orden existente
          const pruebaId = await agregarPruebaAOrden(ordenActual!, datosPrueba);
          setSuccessMessage(
            `Prueba #${pruebaId} agregada a la Orden de Trabajo #${ordenActual}`
          );
        }

        // Guardar datos del formulario para la siguiente prueba
        lastFormDataRef.current = formData;

        // Incrementar el ID de prueba para la siguiente
        setPruebaActual((prev) => prev + 1);

        // Trigger refresh de la tabla
        setShouldRefreshTable((prev) => prev + 1);

        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Error al guardar datos:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Error al guardar la información. Por favor intente nuevamente."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, pruebaActual, ordenActual, obtenerIdsEntidades]
  );

  /**
   * Reinicia el formulario para una nueva orden
   * rerender-functional-setstate - Stable callback
   */
  const resetForm = useCallback(() => {
    setOrdenActual(null);
    setHasPruebasRegistradas(false);
    lastFormDataRef.current = null;
    setError(null);
    setSuccessMessage(null);
    refreshIds();
  }, [refreshIds]);

  return {
    ordenActual,
    pruebaActual,
    isSubmitting,
    error,
    successMessage,
    hasPruebasRegistradas,
    handleSubmit,
    resetForm,
    refreshIds,
    shouldRefreshTable,
  };
}
