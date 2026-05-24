import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/modulos/nucleo/lib/supabaseClient";
import type {
  BusquedaOTResult,
  CatalogoCampos,
  DatosPrueba,
  Empresa,
  Contacto,
  InfoContacto,
  PruebaEnCurso,
} from "@/modulos/informes/tipos";

const selectCatalogo = "tipo_de_evaluacion, numero_de_aplicaciones, condicion_de_inoculacion, aplicacion_de_tratamiento, numero_de_repeticiones, unidades_por_repeticion, condiciones_ambientales, registro_de_datos, metodo_calculo_de_eficacia, nombre_cientifico";

function mapearValorVacio(valor: string | null | undefined): string {
  if (!valor || valor.trim() === "") return "N/A";
  return valor.trim();
}

interface CatalogoRaw {
  tipo_de_evaluacion: string | null;
  numero_de_aplicaciones: string | null;
  condicion_de_inoculacion: string | null;
  aplicacion_de_tratamiento: string | null;
  numero_de_repeticiones: string | null;
  unidades_por_repeticion: string | null;
  condiciones_ambientales: string | null;
  registro_de_datos: string | null;
  metodo_calculo_de_eficacia: string | null;
  nombre_cientifico: string | null;
}

function mapearCatalogo(raw: CatalogoRaw): CatalogoCampos {
  return {
    tipoDeEvaluacion: raw.tipo_de_evaluacion,
    numeroDeAplicaciones: raw.numero_de_aplicaciones,
    condicionDeInoculacion: raw.condicion_de_inoculacion,
    aplicacionDeTratamiento: raw.aplicacion_de_tratamiento,
    numeroDeRepeticiones: raw.numero_de_repeticiones,
    unidadesPorRepeticion: raw.unidades_por_repeticion,
    condicionesAmbientales: raw.condiciones_ambientales,
    registroDeDatos: raw.registro_de_datos,
    metodoCalculoDeEficacia: raw.metodo_calculo_de_eficacia,
    nombreCientifico: raw.nombre_cientifico,
  };
}

async function buscarCatalogo(
  objetivo: string,
  tipo: string,
  insumo: string,
  duracion: string,
): Promise<CatalogoCampos | null> {
  const todosVacios = tipo === "N/A" && insumo === "N/A" && duracion === "N/A";

  if (!todosVacios) {
    const { data: d1, error: e1 } = await supabase.from("catalogo_eficacia_v2").select(selectCatalogo)
      .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).eq("tipo_insumo", insumo).eq("duracion", duracion).single();
    if (e1 && e1.code !== "PGRST116") console.error("Catálogo v2 (full match) error:", objetivo, e1);
    if (d1) return mapearCatalogo(d1 as CatalogoRaw);

    if (tipo !== "N/A" && insumo !== "N/A") {
      const { data: d2, error: e2 } = await supabase.from("catalogo_eficacia_v2").select(selectCatalogo)
        .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).eq("tipo_insumo", insumo).single();
      if (e2 && e2.code !== "PGRST116") console.error("Catálogo v2 (tipo+insumo) error:", objetivo, e2);
      if (d2) return mapearCatalogo(d2 as CatalogoRaw);
    }

    if (tipo !== "N/A") {
      const { data: d3, error: e3 } = await supabase.from("catalogo_eficacia_v2").select(selectCatalogo)
        .eq("objetivo_eficacia", objetivo).eq("tipo_de_evaluacion", tipo).single();
      if (e3 && e3.code !== "PGRST116") console.error("Catálogo v2 (solo tipo) error:", objetivo, e3);
      if (d3) return mapearCatalogo(d3 as CatalogoRaw);
    }
  }

  const { data: d4, error: e4 } = await supabase.from("catalogo_eficacia_v2").select(selectCatalogo)
    .eq("objetivo_eficacia", objetivo).limit(1).single();
  if (e4 && e4.code !== "PGRST116") console.error("Catálogo v2 (solo objetivo) error:", objetivo, e4);
  if (d4) return mapearCatalogo(d4 as CatalogoRaw);

  const { data: d5, error: e5 } = await supabase.from("catalogo_eficacia").select(selectCatalogo)
    .eq("objetivo_eficacia", objetivo).single();
  if (e5 && e5.code !== "PGRST116") {
    console.error("No se encontraron datos en ningún catálogo para objetivo:", objetivo, e5);
  }
  return d5 ? mapearCatalogo(d5 as CatalogoRaw) : null;
}

export async function buscarOTPorNumero(numeroOT: string): Promise<BusquedaOTResult> {
  const { data: pruebasData, error: pruebasError } = await supabase
    .from("pruebas_ordenes_trabajo")
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
    .eq("prueba_orden_id", Number(numeroOT));

  if (pruebasError) {
    console.error("Error en consulta pruebas_ordenes_trabajo:", pruebasError);
    throw pruebasError;
  }

  if (!pruebasData || pruebasData.length === 0) {
    return { otValida: false, empresa: undefined, contacto: undefined, pruebasEnCurso: [] };
  }

  const pruebasEnCursoRaw = pruebasData.filter(p => p.prueba_estado_lab === "En Curso");
  const primeraPrueba = pruebasData[0];

  let emailContacto = "-";
  const { data: vistaData, error: vistaError } = await supabase
    .from("vistamaestratotal")
    .select("contacto_email")
    .eq("prueba_orden_id", Number(numeroOT))
    .limit(1);

  if (vistaError) {
    console.error("Error al obtener email de contacto:", vistaError);
  } else if (vistaData && vistaData.length > 0) {
    emailContacto = vistaData[0].contacto_email || "-";
  }

  const empresa: Empresa = {
    id: "1",
    nombre: primeraPrueba.prueba_compania || "-",
    direccion: "-",
    telefono: "-",
  };

  const contacto: Contacto = {
    id: "1",
    nombre: primeraPrueba.prueba_contacto || "-",
    email: emailContacto,
    telefono: "-",
    empresaId: "1",
  };

  const pruebaIds = pruebasEnCursoRaw.map(p => p.prueba_id).filter(id => id !== null);
  const fechasMontaje: Record<number, string> = {};

  if (pruebaIds.length > 0) {
    const { data: montajesData, error: montajesError } = await supabase
      .from("pruebas_en_montajes")
      .select("prueba_id, montaje_id, montajes_de_laboratorio!inner (id, fecha_creacion)")
      .in("prueba_id", pruebaIds);

    if (montajesError) {
      console.error("Error al obtener fechas de montaje:", montajesError);
    } else if (montajesData) {
      montajesData.forEach(item => {
        if (item.prueba_id && item.montajes_de_laboratorio?.fecha_creacion) {
          fechasMontaje[item.prueba_id] = item.montajes_de_laboratorio.fecha_creacion;
        }
      });
    }
  }

  const eficaciasPruebas: Record<number, number> = {};

  if (pruebaIds.length > 0) {
    const { data: eficaciasData, error: eficaciasError } = await supabase
      .from("eficacia_de_pruebas")
      .select("prueba_id, eficacia")
      .in("prueba_id", pruebaIds);

    if (eficaciasError) {
      console.error("Error al obtener eficacias de pruebas:", eficaciasError);
    } else if (eficaciasData) {
      eficaciasData.forEach(item => {
        if (item.prueba_id && item.eficacia !== null) {
          eficaciasPruebas[item.prueba_id] = item.eficacia;
        }
      });
    }
  }

  const calcularDiasMontaje = (fecha: string): number =>
    differenceInDays(new Date(), new Date(fecha));

  const pruebasEnCurso: PruebaEnCurso[] = pruebasEnCursoRaw.map(prueba => {
    const fechaMontaje = fechasMontaje[prueba.prueba_id] || prueba.prueba_fecha_entrega_remision || "";
    const diasMontaje = fechaMontaje ? calcularDiasMontaje(fechaMontaje) : 0;

    return {
      noPrueba: prueba.prueba_id?.toString() || "0",
      noMuestra: prueba.prueba_numero_muestra || "-",
      estadoEnLab: prueba.prueba_estado_lab || "-",
      objetivo: prueba.objetivos?.objetivo_nombre || "-",
      producto: prueba.productos?.producto_nombre || "-",
      dosis: parseFloat(prueba.prueba_dosis_producto || "0") || 0,
      especieVegetal: prueba.especie_vegetal?.especie_nombre || "-",
      observaciones: prueba.prueba_obs || "-",
      fincaDeLaCepa: prueba.fincas?.finca_nombre || "-",
      fechaIngresoOt: prueba.prueba_fecha_creacion
        ? format(new Date(prueba.prueba_fecha_creacion), "dd/MM/yyyy", { locale: es })
        : "-",
      estadoProceso: prueba.prueba_estado_proceso || "-",
      procedimiento: prueba.objetivos?.objetivo_procedimiento || "-",
      finca: prueba.fincas?.finca_nombre || "-",
      pruebaId: prueba.prueba_id?.toString() || "0",
      fechaMontaje: fechaMontaje ? format(new Date(fechaMontaje), "dd/MM/yyyy", { locale: es }) : "-",
      diasMontaje,
      semanaEntrega: prueba.prueba_semana_entrega || null,
      ingredienteActivo: prueba.productos?.producto_ingrediente_activo || "-",
      eficaciaVsTestigo: eficaciasPruebas[prueba.prueba_id]
        ? `${eficaciasPruebas[prueba.prueba_id]}%`
        : "-",
    };
  });

  return { otValida: true, empresa, contacto, pruebasEnCurso };
}

export async function obtenerDatosPrueba(prueba: PruebaEnCurso, otBuscada: string): Promise<DatosPrueba> {
  try {
    const { data: vistaData, error: vistaError } = await supabase
      .from("vistamaestratotal")
      .select("finca_nombre, especie_nombre, producto_unid")
      .eq("prueba_id", Number(prueba.noPrueba))
      .single();

    if (vistaError && vistaError.code !== "PGRST116") {
      console.error("Error al obtener datos de vistamaestratotal para prueba:", prueba.noPrueba, vistaError);
    }

    const { data: pruebaEnMontaje, error: montajeRefError } = await supabase
      .from("pruebas_en_montajes")
      .select("montaje_id")
      .eq("prueba_id", Number(prueba.noPrueba))
      .single();

    if (montajeRefError && montajeRefError.code !== "PGRST116") {
      console.error("Error al obtener montaje para prueba:", prueba.noPrueba, montajeRefError);
    }

    let montajeData = null;
    if (pruebaEnMontaje?.montaje_id) {
      const { data, error: montajeDataError } = await supabase
        .from("montajes_de_laboratorio")
        .select("variedad, tipo_evaluacion, duracion_prueba, tipo_insumo, nombre_cientifico")
        .eq("id", pruebaEnMontaje.montaje_id)
        .single();

      if (montajeDataError && montajeDataError.code !== "PGRST116") {
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
      codPrueba: `${otBuscada}-${prueba.noPrueba}`,
      objetivo: prueba.objetivo,
      producto: prueba.producto,
      dosis: prueba.dosis,
      especie: vistaData?.especie_nombre || prueba.especieVegetal,
      finca: vistaData?.finca_nombre || prueba.fincaDeLaCepa,
      observaciones: prueba.observaciones,
      tipoEvaluacion: catalogoData?.tipoDeEvaluacion || "",
      variedad: montajeData?.variedad || "",
      unidades: vistaData?.producto_unid || "",
      numeroAplicaciones: catalogoData?.numeroDeAplicaciones || "",
      condicionInoculacion: catalogoData?.condicionDeInoculacion || "",
      aplicacionTratamiento: catalogoData?.aplicacionDeTratamiento || "",
      numeroRepeticiones: catalogoData?.numeroDeRepeticiones || "",
      unidadesRepeticion: catalogoData?.unidadesPorRepeticion || "",
      condicionesAmbientales: catalogoData?.condicionesAmbientales || "",
      registroDatos: catalogoData?.registroDeDatos || "",
      metodoEficacia: catalogoData?.metodoCalculoDeEficacia || "",
      duracionPrueba: montajeData?.duracion_prueba || "",
      tipoInsumo: montajeData?.tipo_insumo || "",
      nombreCientifico: catalogoData?.nombreCientifico || montajeData?.nombre_cientifico || "",
      ingredienteActivo: prueba.ingredienteActivo,
      eficaciaVsTestigo: prueba.eficaciaVsTestigo,
    };
  } catch (error) {
    console.error("Error al obtener datos de prueba:", prueba.noPrueba, error);
    throw error;
  }
}

export async function obtenerInfoContacto(nombreContacto: string, nombreEmpresa: string): Promise<InfoContacto> {
  const { data, error } = await supabase
    .from("vistacontactoscompanias")
    .select("contacto_nombres, encabezado, contacto_cargo")
    .eq("nombre_completo", nombreContacto)
    .eq("compania", nombreEmpresa)
    .limit(1);

  if (error) {
    console.error("Error al consultar vistacontactoscompanias:", error);
    return { contactoNombres: "", encabezado: "", contactoCargo: "" };
  }

  if (data && data.length > 0) {
    return {
      contactoNombres: data[0].contacto_nombres || "",
      encabezado: data[0].encabezado || "",
      contactoCargo: data[0].contacto_cargo || "",
    };
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
