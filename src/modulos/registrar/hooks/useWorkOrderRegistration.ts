// Hook para manejar el flujo de registro de órdenes de trabajo y pruebas
import { useState, useCallback, useEffect, useRef } from "react";
import {
  obtenerProximosIds,
  registrarPrueba,
  type DatosRegistroPrueba,
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
  setOrdenEspecifica: (numeroOT: number) => void;

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
   * Maneja el envío del formulario (Continuar)
   * La función de BD maneja automáticamente:
   * - Crear la orden si no existe
   * - Validar que los IDs de entidades existan
   * - Insertar la prueba
   * - Retornar el siguiente prueba_id consultado de la BD
   * 
   * rerender-functional-setstate - Use functional setState for stable callbacks
   */
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      // js-early-exit - Return early if already submitting
      if (isSubmitting) return;

      // Validación básica
      if (!formData.facturar) {
        setError("Debe seleccionar una compañía");
        return;
      }

      if (!formData.objetivo) {
        setError("Debe seleccionar un objetivo");
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Preparar datos para la función de BD
        const datosRegistro: DatosRegistroPrueba = {
          prueba_orden_id: ordenActual || 0, // Si es null, será la nueva orden
          prueba_id: pruebaActual,
          orden_descuento: formData.descuento || "0",
          objetivo_nombre: formData.objetivo,
          producto_nombre: formData.producto || null,
          especie_nombre: formData.especieVegetal || null,
          finca_nombre: formData.finca || null,
          dosis_producto: formData.dosis || null,
          producto_unid: formData.unidadesProducto || "cc/lt",
          cantidad: formData.cantidadPruebas || "1",
          observaciones: formData.observaciones || null,
          notas_varias: formData.notasVarias || null,
          fecha_recibido: formData.fechaRecepcion
            ? formData.fechaRecepcion.toISOString().split("T")[0]
            : null,
          compania_nombre: formData.facturar,
          contacto_nombre: formData.contacto || null,
          estado_lab: "Pendiente",
          numero_muestra: formData.numeroMuestra || null,
          inst: formData.analisisSolicitado || null,
        };

        // Llamar a la función de BD que maneja todo
        const { ordenId, pruebaId, siguientePruebaId } = await registrarPrueba(
          datosRegistro
        );

        // Determinar si fue la primera prueba
        const esPrimeraPrueba = !hasPruebasRegistradas;

        // Actualizar estados
        if (esPrimeraPrueba) {
          setOrdenActual(ordenId);
          setHasPruebasRegistradas(true);
          setSuccessMessage(
            `Orden de Trabajo #${ordenId} y Prueba #${pruebaId} creadas exitosamente`
          );
        } else {
          setSuccessMessage(
            `Prueba #${pruebaId} agregada a la Orden de Trabajo #${ordenId}`
          );
        }

        // Guardar datos del formulario para referencia
        lastFormDataRef.current = formData;

        // Actualizar el ID de prueba con el valor consultado de la BD
        setPruebaActual(siguientePruebaId);

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
    [isSubmitting, pruebaActual, ordenActual, hasPruebasRegistradas]
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

  /**
   * Establece un número de OT específico para adicionar pruebas
   * Se usa cuando se carga una OT existente
   * rerender-functional-setstate - Stable callback
   */
  const setOrdenEspecifica = useCallback((numeroOT: number) => {
    setOrdenActual(numeroOT);
    setHasPruebasRegistradas(true); // Ya tiene pruebas registradas
    setError(null);
    setSuccessMessage(null);
  }, []);

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
    setOrdenEspecifica,
    shouldRefreshTable,
  };
}
