import { useState, useCallback } from 'react';
import { supabase } from '../../nucleo/lib/supabaseClient';
import { BusquedaOTResult, InformesState, PruebaEnCurso } from '../tipos';

export const useInformes = () => {
  const [state, setState] = useState<InformesState>({
    ot_buscada: '',
    resultado_busqueda: null,
    loading: false,
    error: null
  });

  const buscarOT = useCallback(async (numeroOT: string) => {
    if (!numeroOT.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Por favor ingrese un número de OT válido',
        resultado_busqueda: null
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Buscar las pruebas asociadas a la OT con información del procedimiento desde objetivos
      const { data: pruebasData, error: pruebasError } = await supabase
        .from('pruebas_ordenes_trabajo')
        .select(`
          prueba_id,
          prueba_numero_muestra,
          prueba_estado_lab,
          prueba_dosis_producto,
          prueba_obs,
          prueba_fecha_creacion,
          prueba_estado_proceso,
          prueba_contacto,
          prueba_compania,
          prueba_semana_entrega,
          prueba_fecha_entrega_remision,
          objetivos!inner(
            objetivo_nombre,
            objetivo_procedimiento
          ),
          productos(
            producto_nombre,
            producto_ingrediente_activo
          ),
          especie_vegetal(
            especie_nombre
          ),
          fincas(
            finca_nombre
          )
        `)
        .eq('prueba_orden_id', parseInt(numeroOT));

      if (pruebasError) {
        console.error('Error en consulta:', pruebasError);
        throw pruebasError;
      }

      // Verificar si existe la OT
      if (!pruebasData || pruebasData.length === 0) {
        setState(prev => ({
          ...prev,
          ot_buscada: numeroOT,
          resultado_busqueda: {
            ot_valida: false,
            empresa: undefined,
            contacto: undefined,
            pruebas_en_curso: []
          },
          loading: false,
          error: 'No se encontró la Orden de Trabajo especificada'
        }));
        return;
      }

      // Filtrar solo las pruebas "En Curso"
      const pruebasEnCurso = pruebasData.filter(prueba => prueba.prueba_estado_lab === 'En Curso');

      // Obtener información de empresa y contacto de la primera prueba
      let empresa = undefined;
      let contacto = undefined;

      if (pruebasData && pruebasData.length > 0) {
        const primeraPrueba = pruebasData[0];
        
        // Obtener email del contacto desde vistamaestratotal
        let emailContacto = 'Sin información';
        const { data: vistaData, error: vistaError } = await supabase
          .from('vistamaestratotal')
          .select('contacto_email')
          .eq('prueba_orden_id', parseInt(numeroOT))
          .limit(1);

        if (!vistaError && vistaData && vistaData.length > 0) {
          emailContacto = vistaData[0].contacto_email || 'Sin información';
        }
        
        empresa = {
          id: '1',
          nombre: primeraPrueba.prueba_compania || 'Sin información',
          direccion: 'Sin información',
          telefono: 'Sin información'
        };

        contacto = {
          id: '1',
          nombre: primeraPrueba.prueba_contacto || 'Sin información',
          email: emailContacto,
          telefono: 'Sin información',
          empresa_id: '1'
        };
      }

      // Obtener fechas de montaje para las pruebas
      const pruebaIds = pruebasEnCurso.map(p => p.prueba_id).filter(id => id !== null);
      let fechasMontaje: Record<number, string> = {};

      if (pruebaIds.length > 0) {
        const { data: montajesData, error: montajesError } = await supabase
          .from('pruebas_en_montajes')
          .select(`
            prueba_id,
            montaje_id,
            montajes_de_laboratorio!inner (
              id,
              fecha_creacion
            )
          `)
          .in('prueba_id', pruebaIds);

        if (montajesError) {
          console.error('Error al obtener fechas de montaje:', montajesError);
        }

        if (montajesData) {
          montajesData.forEach(item => {
            if (item.prueba_id && item.montajes_de_laboratorio?.fecha_creacion) {
              fechasMontaje[item.prueba_id] = item.montajes_de_laboratorio.fecha_creacion;
            }
          });
          console.log("Datos de montajes obtenidos:", montajesData);
          console.log("Fechas de montaje mapeadas:", fechasMontaje);
        }
      }

      // Obtener las eficacias para las pruebas
      let eficaciasPruebas: Record<number, number> = {};

      if (pruebaIds.length > 0) {
        const { data: eficaciasData, error: eficaciasError } = await supabase
          .from('eficacia_de_pruebas')
          .select('prueba_id, eficacia')
          .in('prueba_id', pruebaIds);

        if (eficaciasError) {
          console.error('Error al obtener eficacias de pruebas:', eficaciasError);
        }

        if (eficaciasData) {
          eficaciasData.forEach(item => {
            if (item.prueba_id && item.eficacia !== null) {
              eficaciasPruebas[item.prueba_id] = item.eficacia;
            }
          });
          console.log("Eficacias obtenidas:", eficaciasData);
          console.log("Eficacias mapeadas:", eficaciasPruebas);
        }
      }

      // Función para calcular días transcurridos
      const calcularDiasMontaje = (fechaMontaje: string): number => {
        const fechaInicio = new Date(fechaMontaje);
        const fechaActual = new Date();
        const diferenciaTiempo = fechaActual.getTime() - fechaInicio.getTime();
        return Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
      };

      // Mapear las pruebas en curso al formato esperado
      const pruebasFormateadas: PruebaEnCurso[] = pruebasEnCurso.map(prueba => {
        // Usar fecha de montaje si existe, sino usar prueba_fecha_entrega_remision como fallback
        const fechaMontaje = fechasMontaje[prueba.prueba_id!] || prueba.prueba_fecha_entrega_remision || '';
        const diasMontaje = fechaMontaje ? calcularDiasMontaje(fechaMontaje) : 0;

        return {
          no_prueba: prueba.prueba_id?.toString() || '0',
          no_muestra: prueba.prueba_numero_muestra || 'Sin información',
          estado_en_lab: (prueba.prueba_estado_lab as string) || 'Sin información',
          objetivo: prueba.objetivos?.objetivo_nombre || 'Sin información',
          producto: prueba.productos?.producto_nombre || 'Sin información',
          dosis: parseFloat(prueba.prueba_dosis_producto || '0') || 0,
          especie_vegetal: prueba.especie_vegetal?.especie_nombre || 'Sin información',
          observaciones: prueba.prueba_obs || 'Sin información',
          finca_de_la_cepa: prueba.fincas?.finca_nombre || 'Sin información',
          fecha_ingreso_ot: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : 'Sin información',
          estado_proceso: prueba.prueba_estado_proceso || 'Sin información',
          procedimiento: prueba.objetivos?.objetivo_procedimiento || 'Sin información',
          // Nuevos campos
          finca: prueba.fincas?.finca_nombre || 'Sin información',
          prueba_id: prueba.prueba_id?.toString() || '0',
          fecha_montaje: fechaMontaje ? new Date(fechaMontaje).toLocaleDateString() : 'Sin fecha',
          dias_montaje: diasMontaje,
          semana_entrega: prueba.prueba_semana_entrega || null,
          ingrediente_activo: prueba.productos?.producto_ingrediente_activo || 'Sin información',
          eficacia_vs_testigo: eficaciasPruebas[prueba.prueba_id!] 
            ? `${eficaciasPruebas[prueba.prueba_id!]}%` 
            : 'Sin información'
        };
      });

      const resultado: BusquedaOTResult = {
        ot_valida: true,
        empresa,
        contacto,
        pruebas_en_curso: pruebasFormateadas
      };

      setState(prev => ({
        ...prev,
        ot_buscada: numeroOT,
        resultado_busqueda: resultado,
        loading: false,
        error: pruebasFormateadas.length === 0 ? `OT ${numeroOT} encontrada, pero no tiene pruebas en estado "En Curso"` : null
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al buscar la OT. Por favor intente nuevamente.'
      }));
      console.error('Error en búsqueda:', error);
    }
  }, []);

  const limpiarBusqueda = useCallback(() => {
    setState({
      ot_buscada: '',
      resultado_busqueda: null,
      loading: false,
      error: null
    });
  }, []);

  const actualizarOTBuscada = useCallback((ot: string) => {
    setState(prev => ({ ...prev, ot_buscada: ot, error: null }));
  }, []);

  return {
    ...state,
    buscarOT,
    limpiarBusqueda,
    actualizarOTBuscada
  };
};