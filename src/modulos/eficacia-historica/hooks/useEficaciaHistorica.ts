import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../nucleo/lib/supabaseClient';
import {
  EficaciaHistoricaState,
  BusquedaFiltros,
  Producto,
  IngredienteActivo,
  PruebaHistorica,
  OpcionBusqueda
} from '../tipos';

const estadoInicial: EficaciaHistoricaState = {
  filtros: {
    tipo_busqueda: 'producto',
    termino_busqueda: ''
  },
  productos_disponibles: [],
  ingredientes_activos_disponibles: [],
  pruebas_historicas: [],
  loading: false,
  error: null,
  cargando_productos: false,
  cargando_ingredientes: false,
  cargando_pruebas: false,
};

export const useEficaciaHistorica = () => {
  const [state, setState] = useState<EficaciaHistoricaState>(estadoInicial);

  // Cargar productos disponibles
  const cargarProductos = useCallback(async (termino: string = '') => {
    setState(prev => ({ ...prev, cargando_productos: true, error: null }));

    try {
      let query = supabase
        .from('productos')
        .select('producto_id, producto_nombre, producto_ingrediente_activo, producto_casa_comercial, producto_tipo')
        .order('producto_nombre');

      if (termino.trim()) {
        query = query.ilike('producto_nombre', `%${termino}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        productos_disponibles: data || [],
        cargando_productos: false
      }));

    } catch (error) {
      console.error('Error al cargar productos:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar los productos',
        cargando_productos: false
      }));
    }
  }, []);

  // Cargar ingredientes activos disponibles
  const cargarIngredientesActivos = useCallback(async (termino: string = '') => {
    setState(prev => ({ ...prev, cargando_ingredientes: true, error: null }));

    try {
      let query = supabase
        .from('productos')
        .select('producto_ingrediente_activo')
        .not('producto_ingrediente_activo', 'is', null)
        .not('producto_ingrediente_activo', 'eq', '');

      if (termino.trim()) {
        query = query.ilike('producto_ingrediente_activo', `%${termino}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por ingrediente activo y contar productos
      const ingredientesMap = new Map<string, number>();
      
      data?.forEach(item => {
        if (item.producto_ingrediente_activo) {
          const ingrediente = item.producto_ingrediente_activo;
          ingredientesMap.set(ingrediente, (ingredientesMap.get(ingrediente) || 0) + 1);
        }
      });

      const ingredientesActivos: IngredienteActivo[] = Array.from(ingredientesMap.entries())
        .map(([ingrediente_activo, cantidad_productos]) => ({
          ingrediente_activo,
          cantidad_productos
        }))
        .sort((a, b) => a.ingrediente_activo.localeCompare(b.ingrediente_activo));

      setState(prev => ({
        ...prev,
        ingredientes_activos_disponibles: ingredientesActivos,
        cargando_ingredientes: false
      }));

    } catch (error) {
      console.error('Error al cargar ingredientes activos:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al cargar los ingredientes activos',
        cargando_ingredientes: false
      }));
    }
  }, []);

  // Buscar pruebas históricas
  const buscarPruebasHistoricas = useCallback(async (filtros: BusquedaFiltros) => {
    if (!filtros.producto_seleccionado && !filtros.ingrediente_activo_seleccionado) {
      setState(prev => ({
        ...prev,
        error: 'Debe seleccionar un producto o ingrediente activo para buscar'
      }));
      return;
    }

    setState(prev => ({ ...prev, cargando_pruebas: true, error: null }));

    try {
      const pruebasHistoricas: PruebaHistorica[] = [];

      // Buscar en pruebas_anteriores
      if (filtros.tipo_busqueda === 'producto' && filtros.producto_seleccionado) {
        const { data: pruebasAnteriores, error: errorAnteriores } = await supabase
          .from('pruebas_anteriores')
          .select('*')
          .ilike('producto', `%${filtros.producto_seleccionado.producto_nombre}%`);

        if (errorAnteriores) {
          console.error('Error en pruebas_anteriores:', errorAnteriores);
        } else if (pruebasAnteriores) {
          pruebasAnteriores.forEach(prueba => {
            pruebasHistoricas.push({
              numero_prueba: prueba.no_prueba?.toString() || 'N/A',
              producto: prueba.producto || 'N/A',
              dosis: prueba.dosis || 'N/A',
              unidades: prueba.unidades || 'N/A',
              especie_vegetal: prueba.especie_vegetal || 'N/A',
              objetivo: prueba.objetivo,
              finca: prueba.finca_de_la_cepa,
              fecha_creacion: prueba.fecha_ingreso_ot ? new Date(prueba.fecha_ingreso_ot).toLocaleDateString() : undefined,
              casa_comercial: prueba.c_comercial,
              contacto: prueba.contacto,
              fuente: 'pruebas_anteriores'
            });
          });
        }
      }

      // Buscar en pruebas_ordenes_trabajo
      if (filtros.tipo_busqueda === 'producto' && filtros.producto_seleccionado) {
        // Búsqueda directa por producto_id
        const { data: pruebasOrdenes, error: errorOrdenes } = await supabase
          .from('pruebas_ordenes_trabajo')
          .select(`
            prueba_id,
            prueba_dosis_producto,
            prueba_producto_unid,
            prueba_fecha_creacion,
            prueba_contacto,
            productos!inner (
              producto_nombre,
              producto_ingrediente_activo,
              producto_casa_comercial
            ),
            especie_vegetal (
              especie_nombre
            ),
            objetivos (
              objetivo_nombre
            ),
            fincas (
              finca_nombre
            )
          `)
          .eq('prueba_producto_id', filtros.producto_seleccionado.producto_id);

        if (errorOrdenes) {
          console.error('Error en pruebas_ordenes_trabajo:', errorOrdenes);
        } else if (pruebasOrdenes) {
          pruebasOrdenes.forEach(prueba => {
            // Si no hay especie en la tabla principal, buscar en vistamaestratotal
            let especieVegetal = prueba.especie_vegetal?.especie_nombre;
            if (!especieVegetal && prueba.prueba_id) {
              // Nota: Esta búsqueda adicional se hará en una función separada por performance
              especieVegetal = 'Ver vista maestra'; // Placeholder
            }

            pruebasHistoricas.push({
              numero_prueba: prueba.prueba_id?.toString() || 'N/A',
              producto: prueba.productos?.producto_nombre || 'N/A',
              dosis: prueba.prueba_dosis_producto || 'N/A',
              unidades: prueba.prueba_producto_unid || 'N/A',
              especie_vegetal: especieVegetal || 'N/A',
              objetivo: prueba.objetivos?.objetivo_nombre,
              finca: prueba.fincas?.finca_nombre,
              fecha_creacion: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : undefined,
              casa_comercial: prueba.productos?.producto_casa_comercial,
              contacto: prueba.prueba_contacto,
              fuente: 'pruebas_ordenes_trabajo'
            });
          });
        }
      } else if (filtros.tipo_busqueda === 'ingrediente_activo' && filtros.ingrediente_activo_seleccionado) {
        // Búsqueda por ingrediente activo - necesitamos primero obtener los productos con ese ingrediente
        const { data: productosConIngrediente, error: errorProductosIngrediente } = await supabase
          .from('productos')
          .select('producto_id')
          .eq('producto_ingrediente_activo', filtros.ingrediente_activo_seleccionado);

        if (errorProductosIngrediente) {
          console.error('Error al buscar productos por ingrediente activo:', errorProductosIngrediente);
        } else if (productosConIngrediente && productosConIngrediente.length > 0) {
          const productosIds = productosConIngrediente.map(p => p.producto_id);
          
          const { data: pruebasOrdenes, error: errorOrdenes } = await supabase
            .from('pruebas_ordenes_trabajo')
            .select(`
              prueba_id,
              prueba_dosis_producto,
              prueba_producto_unid,
              prueba_fecha_creacion,
              prueba_contacto,
              productos!inner (
                producto_nombre,
                producto_ingrediente_activo,
                producto_casa_comercial
              ),
              especie_vegetal (
                especie_nombre
              ),
              objetivos (
                objetivo_nombre
              ),
              fincas (
                finca_nombre
              )
            `)
            .in('prueba_producto_id', productosIds);

          if (errorOrdenes) {
            console.error('Error en pruebas_ordenes_trabajo por ingrediente:', errorOrdenes);
          } else if (pruebasOrdenes) {
            pruebasOrdenes.forEach(prueba => {
              // Si no hay especie en la tabla principal, buscar en vistamaestratotal
              let especieVegetal = prueba.especie_vegetal?.especie_nombre;
              if (!especieVegetal && prueba.prueba_id) {
                // Nota: Esta búsqueda adicional se hará en una función separada por performance
                especieVegetal = 'Ver vista maestra'; // Placeholder
              }

              pruebasHistoricas.push({
                numero_prueba: prueba.prueba_id?.toString() || 'N/A',
                producto: prueba.productos?.producto_nombre || 'N/A',
                dosis: prueba.prueba_dosis_producto || 'N/A',
                unidades: prueba.prueba_producto_unid || 'N/A',
                especie_vegetal: especieVegetal || 'N/A',
                objetivo: prueba.objetivos?.objetivo_nombre,
                finca: prueba.fincas?.finca_nombre,
                fecha_creacion: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : undefined,
                casa_comercial: prueba.productos?.producto_casa_comercial,
                contacto: prueba.prueba_contacto,
                fuente: 'pruebas_ordenes_trabajo'
              });
            });
          }
        }
      }

      // Completar información de especies desde vistamaestratotal para pruebas que no la tienen
      const pruebasSinEspecie = pruebasHistoricas.filter(p => p.especie_vegetal === 'Ver vista maestra');
      if (pruebasSinEspecie.length > 0) {
        const pruebaIds = pruebasSinEspecie
          .map(p => parseInt(p.numero_prueba))
          .filter(id => !isNaN(id));

        if (pruebaIds.length > 0) {
          const { data: vistaData, error: vistaError } = await supabase
            .from('vistamaestratotal')
            .select('prueba_id, especie_nombre')
            .in('prueba_id', pruebaIds);

          if (!vistaError && vistaData) {
            const especiesMap = new Map(vistaData.map(item => [item.prueba_id, item.especie_nombre]));
            
            pruebasHistoricas.forEach(prueba => {
              if (prueba.especie_vegetal === 'Ver vista maestra') {
                const pruebaId = parseInt(prueba.numero_prueba);
                prueba.especie_vegetal = especiesMap.get(pruebaId) || 'Sin información';
              }
            });
          }
        }
      }

      setState(prev => ({
        ...prev,
        pruebas_historicas: pruebasHistoricas,
        cargando_pruebas: false
      }));

    } catch (error) {
      console.error('Error al buscar pruebas históricas:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al buscar las pruebas históricas',
        cargando_pruebas: false,
        pruebas_historicas: []
      }));
    }
  }, []);

  // Actualizar filtros
  const actualizarFiltros = useCallback((nuevosFiltros: Partial<BusquedaFiltros>) => {
    setState(prev => ({
      ...prev,
      filtros: { ...prev.filtros, ...nuevosFiltros },
      error: null
    }));
  }, []);

  // Limpiar búsqueda
  const limpiarBusqueda = useCallback(() => {
    setState(estadoInicial);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    cargarProductos();
    cargarIngredientesActivos();
  }, [cargarProductos, cargarIngredientesActivos]);

  return {
    ...state,
    cargarProductos,
    cargarIngredientesActivos,
    buscarPruebasHistoricas,
    actualizarFiltros,
    limpiarBusqueda
  };
};
