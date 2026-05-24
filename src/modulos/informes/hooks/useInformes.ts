import { useState, useCallback, useRef } from 'react';
import type { InformesState } from '@/modulos/informes/tipos';
import { buscarOTPorNumero } from '@/modulos/informes/servicios';

export function useInformes() {
  const [state, setState] = useState<InformesState>({
    ot_buscada: '',
    resultado_busqueda: null,
    loading: false,
    error: null
  });

  const otBuscadaRef = useRef('');

  const buscarOT = useCallback(async (numeroOT: string) => {
    otBuscadaRef.current = numeroOT;
    if (!numeroOT.trim()) {
      setState(prev => ({ ...prev, error: 'Por favor ingrese un número de OT válido', resultado_busqueda: null }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const resultado = await buscarOTPorNumero(numeroOT);

      setState(prev => ({
        ...prev,
        ot_buscada: numeroOT,
        resultado_busqueda: resultado,
        loading: false,
        error: !resultado.ot_valida
          ? 'No se encontró la Orden de Trabajo especificada'
          : resultado.pruebas_en_curso.length === 0
            ? `OT ${numeroOT} encontrada, pero no tiene pruebas en estado "En Curso"`
            : null,
      }));
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al buscar la OT. Por favor intente nuevamente.'
      }));
    }
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setState({ ot_buscada: '', resultado_busqueda: null, loading: false, error: null });
  }, []);

  const actualizarOTBuscada = useCallback((ot: string) => {
    setState(prev => ({ ...prev, ot_buscada: ot, error: null }));
  }, []);

  const refetch = useCallback(() => {
    if (otBuscadaRef.current) buscarOT(otBuscadaRef.current);
  }, [buscarOT]);

  return { ...state, buscarOT, limpiarBusqueda, actualizarOTBuscada, refetch };
}
