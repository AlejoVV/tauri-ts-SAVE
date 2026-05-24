import { supabase } from "@/modulos/nucleo/lib/supabaseClient";
import type { BusquedaOTResult, Empresa, Contacto, PruebaEnCurso } from "@/modulos/informes/tipos";

const SELECT_CATALOGO = "tipo_de_evaluacion, numero_de_aplicaciones, condicion_de_inoculacion, aplicacion_de_tratamiento, numero_de_repeticiones, unidades_por_repeticion, condiciones_ambientales, registro_de_datos, metodo_calculo_de_eficacia, nombre_cientifico";

function mapearValorVacio(valor: string | null | undefined): string {
  if (!valor || valor.trim() === "") return "N/A";
  return valor.trim();
}

async function buscarCatalogo(objetivo: string, tipo: string, insumo: string, duracion: string) {
  const todosVacios = tipo === "N/A" && insumo === "N/A" && duracion === "N/A";

  if (!todosVacios) {
    try {
      const { data } = await supabase.from("catalogo_eficacia_v2").select(SELECT_CATALOGO)
        .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).eq("tipo_insumo", insumo).eq("duracion", duracion).single();
      if (data) return data;
    } catch (error) {
      console.error("Catálogo v2 (full match) sin resultados para objetivo:", objetivo, error);
    }

    if (tipo !== "N/A" && insumo !== "N/A") {
      try {
        const { data } = await supabase.from("catalogo_eficacia_v2").select(SELECT_CATALOGO)
          .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).eq("tipo_insumo", insumo).single();
        if (data) return data;
      } catch (error) {
        console.error("Catálogo v2 (tipo+insumo) sin resultados para objetivo:", objetivo, error);
      }
    }

    if (tipo !== "N/A") {
      try {
        const { data } = await supabase.from("catalogo_eficacia_v2").select(SELECT_CATALOGO)
          .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).single();
        if (data) return data;
      } catch (error) {
        console.error("Catálogo v2 (solo tipo) sin resultados para objetivo:", objetivo, error);
      }
    }
  }

  try {
    const { data } = await supabase.from("catalogo_eficacia_v2").select(SELECT_CATALOGO)
      .eq("objetivo_eficacia", objetivo).limit(1).single();
    if (data) return data;
  } catch (error) {
    console.error("Catálogo v2 (solo objetivo) sin resultados:", objetivo, error);
  }

  try {
    const { data } = await supabase.from("catalogo_eficacia").select(SELECT_CATALOGO)
      .eq("objetivo_eficacia", objetivo).single();
    return data ?? null;
  } catch (error) {
    console.error("No se encontraron datos en ningún catálogo para objetivo:", objetivo, error);
    return null;
  }
}

export async function buscarOTPorNumero(numeroOT: string): Promise<BusquedaOTResult> {
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
    console.error('Error en consulta pruebas_ordenes_trabajo:', pruebasError);
    throw pruebasError;
  }

  if (!pruebasData || pruebasData.length === 0) {
    return { ot_valida: false, empresa: undefined, contacto: undefined, pruebas_en_curso: [] };
  }

  const pruebasEnCurso = pruebasData.filter(prueba => prueba.prueba_estado_lab === 'En Curso');

  let empresa: Empresa | undefined;
  let contacto: Contacto | undefined;

  const primeraPrueba = pruebasData[0];
  let emailContacto = '-';

  const { data: vistaData, error: vistaError } = await supabase
    .from('vistamaestratotal')
    .select('contacto_email')
    .eq('prueba_orden_id', parseInt(numeroOT))
    .limit(1);

  if (vistaError) {
    console.error('Error al obtener email de contacto:', vistaError);
  } else if (vistaData && vistaData.length > 0) {
    emailContacto = vistaData[0].contacto_email || '-';
  }

  empresa = { id: '1', nombre: primeraPrueba.prueba_compania || '-', direccion: '-', telefono: '-' };
  contacto = { id: '1', nombre: primeraPrueba.prueba_contacto || '-', email: emailContacto, telefono: '-', empresa_id: '1' };

  const pruebaIds = pruebasEnCurso.map(p => p.prueba_id).filter(id => id !== null);
  let fechasMontaje: Record<number, string> = {};

  if (pruebaIds.length > 0) {
    const { data: montajesData, error: montajesError } = await supabase
      .from('pruebas_en_montajes')
      .select(`prueba_id, montaje_id, montajes_de_laboratorio!inner (id, fecha_creacion)`)
      .in('prueba_id', pruebaIds);

    if (montajesError) {
      console.error('Error al obtener fechas de montaje:', montajesError);
    } else if (montajesData) {
      montajesData.forEach(item => {
        if (item.prueba_id && item.montajes_de_laboratorio?.fecha_creacion) {
          fechasMontaje[item.prueba_id] = item.montajes_de_laboratorio.fecha_creacion;
        }
      });
    }
  }

  let eficaciasPruebas: Record<number, number> = {};

  if (pruebaIds.length > 0) {
    const { data: eficaciasData, error: eficaciasError } = await supabase
      .from('eficacia_de_pruebas')
      .select('prueba_id, eficacia')
      .in('prueba_id', pruebaIds);

    if (eficaciasError) {
      console.error('Error al obtener eficacias de pruebas:', eficaciasError);
    } else if (eficaciasData) {
      eficaciasData.forEach(item => {
        if (item.prueba_id && item.eficacia !== null) {
          eficaciasPruebas[item.prueba_id] = item.eficacia;
        }
      });
    }
  }

  const calcularDiasMontaje = (fechaMontaje: string): number => {
    const diferenciaTiempo = Date.now() - new Date(fechaMontaje).getTime();
    return Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
  };

  const pruebasFormateadas: PruebaEnCurso[] = pruebasEnCurso.map(prueba => {
    const fechaMontaje = fechasMontaje[prueba.prueba_id] || prueba.prueba_fecha_entrega_remision || '';
    const diasMontaje = fechaMontaje ? calcularDiasMontaje(fechaMontaje) : 0;

    return {
      no_prueba: prueba.prueba_id?.toString() || '0',
      no_muestra: prueba.prueba_numero_muestra || '-',
      estado_en_lab: prueba.prueba_estado_lab || '-',
      objetivo: prueba.objetivos?.objetivo_nombre || '-',
      producto: prueba.productos?.producto_nombre || '-',
      dosis: parseFloat(prueba.prueba_dosis_producto || '0') || 0,
      especie_vegetal: prueba.especie_vegetal?.especie_nombre || '-',
      observaciones: prueba.prueba_obs || '-',
      finca_de_la_cepa: prueba.fincas?.finca_nombre || '-',
      fecha_ingreso_ot: prueba.prueba_fecha_creacion ? new Date(prueba.prueba_fecha_creacion).toLocaleDateString() : '-',
      estado_proceso: prueba.prueba_estado_proceso || '-',
      procedimiento: prueba.objetivos?.objetivo_procedimiento || '-',
      finca: prueba.fincas?.finca_nombre || '-',
      prueba_id: prueba.prueba_id?.toString() || '0',
      fecha_montaje: fechaMontaje ? new Date(fechaMontaje).toLocaleDateString() : '-',
      dias_montaje: diasMontaje,
      semana_entrega: prueba.prueba_semana_entrega || null,
      ingrediente_activo: prueba.productos?.producto_ingrediente_activo || '-',
      eficacia_vs_testigo: eficaciasPruebas[prueba.prueba_id] ? `${eficaciasPruebas[prueba.prueba_id]}%` : '-',
    };
  });

  return { ot_valida: true, empresa, contacto, pruebas_en_curso: pruebasFormateadas };
}

export async function obtenerDatosPrueba(prueba: PruebaEnCurso, otBuscada: string) {
  try {
    const { data: vistaData, error: vistaError } = await supabase
      .from("vistamaestratotal")
      .select("finca_nombre, especie_nombre, producto_unid")
      .eq("prueba_id", Number(prueba.no_prueba))
      .single();

    if (vistaError) {
      console.error("Error al obtener datos de vistamaestratotal para prueba:", prueba.no_prueba, vistaError);
    }

    const { data: pruebaEnMontaje, error: montajeRefError } = await supabase
      .from("pruebas_en_montajes")
      .select("montaje_id")
      .eq("prueba_id", Number(prueba.no_prueba))
      .single();

    if (montajeRefError) {
      console.error("Error al obtener montaje para prueba:", prueba.no_prueba, montajeRefError);
    }

    let montajeData = null;
    if (pruebaEnMontaje?.montaje_id) {
      const { data, error: montajeDataError } = await supabase
        .from("montajes_de_laboratorio")
        .select("variedad, tipo_evaluacion, duracion_prueba, tipo_insumo, nombre_cientifico")
        .eq("id", pruebaEnMontaje.montaje_id)
        .single();

      if (montajeDataError) {
        console.error("Error al obtener datos del montaje:", pruebaEnMontaje.montaje_id, montajeDataError);
      }
      montajeData = data;
    }

    const catalogoData = await buscarCatalogo(
      prueba.objetivo,
      mapearValorVacio(montajeData?.tipo_evaluacion),
      mapearValorVacio(montajeData?.tipo_insumo),
      mapearValorVacio(montajeData?.duracion_prueba),
    );

    return {
      cod_prueba: `${otBuscada}-${prueba.no_prueba}`,
      objetivo: prueba.objetivo,
      producto: prueba.producto,
      dosis: prueba.dosis,
      especie: vistaData?.especie_nombre || prueba.especie_vegetal,
      finca: vistaData?.finca_nombre || prueba.finca_de_la_cepa,
      observaciones: prueba.observaciones,
      tipo_evaluacion: catalogoData?.tipo_de_evaluacion || "",
      variedad: montajeData?.variedad || "",
      unidades: vistaData?.producto_unid || "",
      numero_aplicaciones: catalogoData?.numero_de_aplicaciones || "",
      condicion_inoculacion: catalogoData?.condicion_de_inoculacion || "",
      aplicacion_tratamiento: catalogoData?.aplicacion_de_tratamiento || "",
      numero_repeticiones: catalogoData?.numero_de_repeticiones || "",
      unidades_repeticion: catalogoData?.unidades_por_repeticion || "",
      condiciones_ambientales: catalogoData?.condiciones_ambientales || "",
      registro_datos: catalogoData?.registro_de_datos || "",
      metodo_eficacia: catalogoData?.metodo_calculo_de_eficacia || "",
      duracion_prueba: montajeData?.duracion_prueba || "",
      tipo_insumo: montajeData?.tipo_insumo || "",
      nombre_cientifico: catalogoData?.nombre_cientifico || montajeData?.nombre_cientifico || "",
      ingrediente_activo: prueba.ingrediente_activo,
      eficacia_vs_testigo: prueba.eficacia_vs_testigo,
    };
  } catch (error) {
    console.error("Error al obtener datos de prueba:", prueba.no_prueba, error);
    throw error;
  }
}

export async function obtenerInfoContacto(nombreContacto: string, nombreEmpresa: string) {
  try {
    const { data } = await supabase
      .from("vistacontactoscompanias")
      .select("contacto_nombres, encabezado, contacto_cargo")
      .eq("nombre_completo", nombreContacto)
      .eq("compania", nombreEmpresa)
      .limit(1);

    if (data && data.length > 0) {
      return {
        contactoNombres: data[0].contacto_nombres || "",
        encabezado: data[0].encabezado || "",
        contactoCargo: data[0].contacto_cargo || "",
      };
    }
  } catch (error) {
    console.error("Error al consultar vistacontactoscompanias:", error);
  }
  return { contactoNombres: "", encabezado: "", contactoCargo: "" };
}

export async function llamarEdgeFunctionDocx(payload: unknown): Promise<Blob> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fill-docx-template`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: string }).error || `Error del servidor: ${response.status}`;
    console.error("Error en llamarEdgeFunctionDocx:", message);
    throw new Error(message);
  }

  return response.blob();
}
