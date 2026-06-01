import { supabase } from '@/modulos/nucleo/lib/supabaseClient';
import type { Producto, IngredienteActivo, PruebaHistorica, BusquedaFiltros } from '@/modulos/eficacia-historica/tipos';

export async function getProductos(termino: string = ''): Promise<Producto[]> {
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
    return data ?? [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
}

export async function getIngredientesActivos(termino: string = ''): Promise<IngredienteActivo[]> {
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

    const ingredientesMap = new Map<string, number>();
    data?.forEach(item => {
      if (item.producto_ingrediente_activo) {
        ingredientesMap.set(item.producto_ingrediente_activo, (ingredientesMap.get(item.producto_ingrediente_activo) || 0) + 1);
      }
    });

    return Array.from(ingredientesMap.entries())
      .map(([ingrediente_activo, cantidad_productos]) => ({ ingrediente_activo, cantidad_productos }))
      .sort((a, b) => a.ingrediente_activo.localeCompare(b.ingrediente_activo));
  } catch (error) {
    console.error('Error al obtener ingredientes activos:', error);
    throw error;
  }
}

export async function buscarPruebasHistoricas(filtros: BusquedaFiltros): Promise<PruebaHistorica[]> {
  const pruebas: PruebaHistorica[] = [];

  if (filtros.tipoBusqueda === 'producto' && filtros.productoSeleccionado) {
    const { data: pruebasAnteriores, error: errorAnteriores } = await supabase
      .from('pruebas_anteriores')
      .select('*')
      .ilike('producto', `%${filtros.productoSeleccionado.producto_nombre}%`);

    if (errorAnteriores) {
      console.error('Error al buscar en pruebas_anteriores:', errorAnteriores);
      throw errorAnteriores;
    }

    pruebasAnteriores?.forEach(prueba => {
      pruebas.push({
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
        fuente: 'pruebas_anteriores',
      });
    });

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
      .eq('prueba_producto_id', filtros.productoSeleccionado.producto_id);

    if (errorOrdenes) {
      console.error('Error al buscar en pruebas_ordenes_trabajo:', errorOrdenes);
      throw errorOrdenes;
    }

    pruebasOrdenes?.forEach(prueba => {
      pruebas.push({
        numero_prueba: prueba.prueba_id?.toString() || 'N/A',
        producto: prueba.productos?.producto_nombre || 'N/A',
        dosis: prueba.prueba_dosis_producto || 'N/A',
        unidades: prueba.prueba_producto_unid || 'N/A',
        especie_vegetal: prueba.especie_vegetal?.especie_nombre || 'Ver vista maestra',
        objetivo: prueba.objetivos?.objetivo_nombre,
        finca: prueba.fincas?.finca_nombre,
        fecha_creacion: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : undefined,
        casa_comercial: prueba.productos?.producto_casa_comercial,
        contacto: prueba.prueba_contacto,
        fuente: 'pruebas_ordenes_trabajo',
      });
    });

  } else if (filtros.tipoBusqueda === 'ingrediente_activo' && filtros.ingredienteActivoSeleccionado) {
    const { data: productosConIngrediente, error: errorProductos } = await supabase
      .from('productos')
      .select('producto_id')
      .eq('producto_ingrediente_activo', filtros.ingredienteActivoSeleccionado);

    if (errorProductos) {
      console.error('Error al buscar productos por ingrediente activo:', errorProductos);
      throw errorProductos;
    }

    if (productosConIngrediente && productosConIngrediente.length > 0) {
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
        console.error('Error al buscar pruebas por ingrediente activo:', errorOrdenes);
        throw errorOrdenes;
      }

      pruebasOrdenes?.forEach(prueba => {
        pruebas.push({
          numero_prueba: prueba.prueba_id?.toString() || 'N/A',
          producto: prueba.productos?.producto_nombre || 'N/A',
          dosis: prueba.prueba_dosis_producto || 'N/A',
          unidades: prueba.prueba_producto_unid || 'N/A',
          especie_vegetal: prueba.especie_vegetal?.especie_nombre || 'Ver vista maestra',
          objetivo: prueba.objetivos?.objetivo_nombre,
          finca: prueba.fincas?.finca_nombre,
          fecha_creacion: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : undefined,
          casa_comercial: prueba.productos?.producto_casa_comercial,
          contacto: prueba.prueba_contacto,
          fuente: 'pruebas_ordenes_trabajo',
        });
      });
    }
  }

  const pruebasSinEspecie = pruebas.filter(p => p.especie_vegetal === 'Ver vista maestra');
  if (pruebasSinEspecie.length > 0) {
    const pruebaIds = pruebasSinEspecie.map(p => parseInt(p.numero_prueba)).filter(id => !isNaN(id));

    if (pruebaIds.length > 0) {
      const { data: vistaData, error: vistaError } = await supabase
        .from('vistamaestratotal')
        .select('prueba_id, especie_nombre')
        .in('prueba_id', pruebaIds);

      // enriquecimiento no crítico — fallo no debe bloquear los resultados principales ya obtenidos
      if (vistaError) {
        console.error('Error al obtener especies desde vistamaestratotal:', vistaError);
      } else if (vistaData) {
        const especiesMap = new Map(vistaData.map(item => [item.prueba_id, item.especie_nombre]));
        pruebas.forEach(prueba => {
          if (prueba.especie_vegetal === 'Ver vista maestra') {
            const pruebaId = parseInt(prueba.numero_prueba);
            prueba.especie_vegetal = especiesMap.get(pruebaId) || 'Sin información';
          }
        });
      }
    }
  }

  return pruebas;
}
