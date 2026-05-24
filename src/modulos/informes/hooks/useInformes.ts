import { useState, useCallback, useRef } from "react";
import type { InformesState } from "@/modulos/informes/tipos";
import { buscarOTPorNumero } from "@/modulos/informes/servicios";

export function useInformes() {
  const [state, setState] = useState<InformesState>({
    otBuscada: "",
    resultadoBusqueda: null,
    loading: false,
    error: null,
  });

  const otBuscadaRef = useRef("");

  const buscarOT = useCallback(async (numeroOT: string) => {
    if (!numeroOT.trim()) {
      setState(prev => ({ ...prev, error: "Por favor ingrese un número de OT válido", resultadoBusqueda: null }));
      return;
    }

    otBuscadaRef.current = numeroOT;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const resultado = await buscarOTPorNumero(numeroOT);

      setState(prev => ({
        ...prev,
        otBuscada: numeroOT,
        resultadoBusqueda: resultado,
        loading: false,
        error: !resultado.otValida
          ? "No se encontró la Orden de Trabajo especificada"
          : resultado.pruebasEnCurso.length === 0
            ? `OT ${numeroOT} encontrada, pero no tiene pruebas en estado "En Curso"`
            : null,
      }));
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Error al buscar la OT. Por favor intente nuevamente.",
      }));
    }
  }, []);

  const limpiarBusqueda = useCallback(() => {
    otBuscadaRef.current = "";
    setState({ otBuscada: "", resultadoBusqueda: null, loading: false, error: null });
  }, []);

  const actualizarOTBuscada = useCallback((ot: string) => {
    setState(prev => ({ ...prev, otBuscada: ot, error: null }));
  }, []);

  const refetch = useCallback(() => {
    if (otBuscadaRef.current) buscarOT(otBuscadaRef.current);
  }, [buscarOT]);

  return { ...state, buscarOT, limpiarBusqueda, actualizarOTBuscada, refetch };
}
