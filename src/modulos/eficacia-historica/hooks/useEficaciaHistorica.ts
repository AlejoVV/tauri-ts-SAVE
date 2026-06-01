import { useState, useCallback, useEffect } from 'react';
import type { EficaciaHistoricaState, BusquedaFiltros } from '@/modulos/eficacia-historica/tipos';
import { getProductos, getIngredientesActivos, buscarPruebasHistoricas } from '@/modulos/eficacia-historica/servicios';

const estadoInicial: EficaciaHistoricaState = {
  filtros: {
    tipoBusqueda: 'producto',
    terminoBusqueda: '',
  },
  productosDisponibles: [],
  ingredientesActivosDisponibles: [],
  pruebasHistoricas: [],
  error: null,
  cargandoProductos: false,
  cargandoIngredientes: false,
  cargandoPruebas: false,
};

export function useEficaciaHistorica() {
  const [state, setState] = useState<EficaciaHistoricaState>(estadoInicial);

  const cargarProductos = useCallback(async (termino: string = '') => {
    setState(prev => ({ ...prev, cargandoProductos: true, error: null }));
    try {
      const data = await getProductos(termino);
      setState(prev => ({ ...prev, productosDisponibles: data, cargandoProductos: false }));
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setState(prev => ({ ...prev, error: 'Error al cargar los productos', cargandoProductos: false }));
    }
  }, []);

  const cargarIngredientesActivos = useCallback(async (termino: string = '') => {
    setState(prev => ({ ...prev, cargandoIngredientes: true, error: null }));
    try {
      const data = await getIngredientesActivos(termino);
      setState(prev => ({ ...prev, ingredientesActivosDisponibles: data, cargandoIngredientes: false }));
    } catch (error) {
      console.error('Error al cargar ingredientes activos:', error);
      setState(prev => ({ ...prev, error: 'Error al cargar los ingredientes activos', cargandoIngredientes: false }));
    }
  }, []);

  const buscarHistorial = useCallback(async (filtros: BusquedaFiltros) => {
    if (!filtros.productoSeleccionado && !filtros.ingredienteActivoSeleccionado) {
      setState(prev => ({ ...prev, error: 'Debe seleccionar un producto o ingrediente activo para buscar' }));
      return;
    }

    setState(prev => ({ ...prev, cargandoPruebas: true, error: null }));
    try {
      const data = await buscarPruebasHistoricas(filtros);
      setState(prev => ({ ...prev, pruebasHistoricas: data, cargandoPruebas: false }));
    } catch (error) {
      console.error('Error al buscar pruebas históricas:', error);
      setState(prev => ({ ...prev, error: 'Error al buscar las pruebas históricas', cargandoPruebas: false, pruebasHistoricas: [] }));
    }
  }, []);

  const actualizarFiltros = useCallback((nuevosFiltros: Partial<BusquedaFiltros>) => {
    setState(prev => ({ ...prev, filtros: { ...prev.filtros, ...nuevosFiltros }, error: null }));
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setState(estadoInicial);
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([cargarProductos(), cargarIngredientesActivos()]);
  }, [cargarProductos, cargarIngredientesActivos]);

  useEffect(() => {
    cargarProductos();
    cargarIngredientesActivos();
  }, [cargarProductos, cargarIngredientesActivos]);

  return {
    ...state,
    cargarProductos,
    cargarIngredientesActivos,
    buscarHistorial,
    actualizarFiltros,
    limpiarBusqueda,
    refetch,
  };
}
