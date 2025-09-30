import React, { useState } from "react";
import { FileText, Building2, User, Download, Loader2 } from "lucide-react";
import { useInformes } from "./hooks/useInformes";
import { BusquedaOT, TablaPruebas } from "./componentes";
import { supabase } from "../nucleo/lib/supabaseClient";
import { PruebaEnCurso } from "./tipos";

export const Informes: React.FC = () => {
  const {
    ot_buscada,
    resultado_busqueda,
    loading,
    error,
    buscarOT,
    limpiarBusqueda,
    actualizarOTBuscada,
  } = useInformes();

  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<
    PruebaEnCurso[]
  >([]);

  const handleBuscar = () => {
    buscarOT(ot_buscada);
  };

  const handleLimpiar = () => {
    limpiarBusqueda();
    setPruebasSeleccionadas([]); // Limpiar selección al limpiar búsqueda
  };

  const handleSelectionChange = (selectedTests: PruebaEnCurso[]) => {
    setPruebasSeleccionadas(selectedTests);
  };

  const generarReporte = async () => {
    if (
      !resultado_busqueda?.ot_valida ||
      !resultado_busqueda.contacto ||
      !resultado_busqueda.empresa
    ) {
      setErrorReporte("No hay datos suficientes para generar el reporte");
      return;
    }

    // Verificar que hay pruebas seleccionadas
    if (pruebasSeleccionadas.length === 0) {
      setErrorReporte(
        "Debe seleccionar al menos una prueba para generar el reporte"
      );
      return;
    }

    setGenerandoReporte(true);
    setErrorReporte(null);

    try {
      // Preparar los datos para enviar a la Edge Function
      const fechaHoy = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Obtener información de fincas de las pruebas SELECCIONADAS
      const fincas = [
        ...new Set(pruebasSeleccionadas.map((p) => p.finca_de_la_cepa)),
      ];
      const fincasTexto = fincas.join(", ");

      // Consultar vistacontactoscompanias para obtener información adicional del contacto
      let contactoNombres = "";
      let encabezado = "";
      let contactoCargo = "";

      try {
        const { data: vistaContactoData, error: vistaContactoError } =
          await supabase
            .from("vistacontactoscompanias")
            .select("contacto_nombres, encabezado, contacto_cargo")
            .eq("nombre_completo", resultado_busqueda.contacto.nombre)
            .eq("compania", resultado_busqueda.empresa.nombre)
            .limit(1);

        if (
          !vistaContactoError &&
          vistaContactoData &&
          vistaContactoData.length > 0
        ) {
          const contactoInfo = vistaContactoData[0];
          contactoNombres = contactoInfo.contacto_nombres || "";
          encabezado = contactoInfo.encabezado || "";
          contactoCargo = contactoInfo.contacto_cargo || "";
        }
      } catch (error) {
        console.error("Error al consultar vistacontactoscompanias:", error);
      }

      // Construir el payload y mostrar previsualización antes de enviar
      const filename = `reporte_eficacia_OT_${ot_buscada}_${
        new Date().toISOString().split("T")[0]
      }`;

      const datosReporte = {
        // Información de contacto
        autoriza: resultado_busqueda.contacto.nombre,
        email: resultado_busqueda.contacto.email,

        // Información adicional del contacto desde vistacontactoscompanias
        nombre: contactoNombres,
        encabezado: encabezado,
        cargo: contactoCargo,
        // Información de empresa
        facturar_a: resultado_busqueda.empresa.nombre,

        // Información de OT
        ot: ot_buscada,

        // Información de fincas
        finca_de_la_cepa: fincasTexto,

        // Fecha actual
        fecha_hoy: fechaHoy,

        // nombre archivo
        archivo: filename,

        // Información adicional de las pruebas
        total_pruebas: pruebasSeleccionadas.length,
        pruebas: await Promise.all(
          pruebasSeleccionadas.map(async (prueba) => {
            // Consultar información adicional de vistamaestratotal
            const { data: vistaData } = await supabase
              .from("vistamaestratotal")
              .select("finca_nombre, especie_nombre, producto_unid")
              .eq("prueba_id", Number(prueba.no_prueba))
              .single();
            console.log(vistaData);

            // Consultar montaje_id desde pruebas_en_montajes usando prueba_id
            const { data: pruebaEnMontaje } = await supabase
              .from("pruebas_en_montajes")
              .select("montaje_id")
              .eq("prueba_id", Number(prueba.no_prueba))
              .single();

            // Consultar variedad de montajes_de_laboratorio usando el montaje_id obtenido
            let montajeData = null;
            if (pruebaEnMontaje?.montaje_id) {
              const { data } = await supabase
                .from("montajes_de_laboratorio")
                .select("variedad")
                .eq("id", pruebaEnMontaje.montaje_id)
                .single();
              montajeData = data;
            }
            console.log("montaje:", montajeData);

            // Consultar información del catálogo de eficacia
            const { data: catalogoData } = await supabase
              .from("catalogo_eficacia")
              .select(
                "tipo_de_evaluacion, numero_de_aplicaciones, condicion_de_inoculacion, aplicacion_de_tratamiento, numero_de_repeticiones, unidades_por_repeticion, condiciones_ambientales, registro_de_datos, metodo_calculo_de_eficacia"
              )
              .eq("objetivo_eficacia", prueba.objetivo)
              .single();

            return {
              cod_prueba: `${ot_buscada}-${prueba.no_prueba}`,
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
              aplicacion_tratamiento:
                catalogoData?.aplicacion_de_tratamiento || "",
              numero_repeticiones: catalogoData?.numero_de_repeticiones || "",
              unidades_repeticion: catalogoData?.unidades_por_repeticion || "",
              condiciones_ambientales:
                catalogoData?.condiciones_ambientales || "",
              registro_datos: catalogoData?.registro_de_datos || "",
              metodo_eficacia: catalogoData?.metodo_calculo_de_eficacia || "",
            };
          })
        ),
      };

      const payload = {
        data: datosReporte,
        filename,
      };

      console.log(
        "Previsualización de la petición a fill-docx-template:",
        payload
      );
      const continuar = window.confirm(
        `Esta es la petición que se enviará a fill-docx-template:\n\n${JSON.stringify(
          payload,
          null,
          2
        )}\n\n¿Deseas enviarla ahora?`
      );
      if (!continuar) {
        setGenerandoReporte(false);
        return;
      }
      // Llamar a la Edge Function
      const response = await fetch(
        "https://khdlelfasivdxznupruw.supabase.co/functions/v1/fill-docx-template",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZGxlbGZhc2l2ZHh6bnVwcnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTA0MDIsImV4cCI6MjA2Nzc4NjQwMn0.zv0kxgfdpzrgp0URDoGBg-yk8poMyh4rA6Zw31AZj8w`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Error del servidor: ${response.status}`
        );
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al generar reporte:", error);
      setErrorReporte(
        error instanceof Error
          ? error.message
          : "Error desconocido al generar el reporte"
      );
    } finally {
      setGenerandoReporte(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 p-2 md:p-4 flex flex-col">
      <div className="w-full mx-auto px-2 md:px-4 flex flex-col h-full">
        {/* Sección de Búsqueda en una sola fila */}
        <div className="mb-2 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3 overflow-hidden">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Input OT */}
              <div className="flex-shrink-0">
                <BusquedaOT
                  valor={ot_buscada}
                  onCambio={actualizarOTBuscada}
                  onBuscar={handleBuscar}
                  onLimpiar={handleLimpiar}
                  loading={loading}
                  error={error}
                />
              </div>

              {/* Empresa: info empresa */}
              {resultado_busqueda?.ot_valida && resultado_busqueda.empresa && (
                <div className="flex items-center gap-2">
                  <Building2 className="text-blue-600" size={16} />
                  <span className="text-lg font-medium text-gray-700">
                    empresa:
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {resultado_busqueda.empresa.nombre}
                  </span>
                </div>
              )}

              {/* Contacto: info contacto */}
              {resultado_busqueda?.ot_valida && resultado_busqueda.contacto && (
                <div className="flex items-center gap-2">
                  <User className="text-green-600" size={16} />
                  <span className="text-lg font-medium text-gray-700">
                    contacto:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {resultado_busqueda.contacto.nombre}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({resultado_busqueda.contacto.email})
                    </span>
                  </div>
                </div>
              )}

              {/* Botón Generar Reporte */}
              {resultado_busqueda?.ot_valida &&
                resultado_busqueda.pruebas_en_curso.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-gray-600">
                      {pruebasSeleccionadas.length} prueba(s) seleccionada(s)
                    </span>
                    <button
                      onClick={generarReporte}
                      disabled={
                        generandoReporte || pruebasSeleccionadas.length === 0
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {generandoReporte ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      {generandoReporte ? "Generando..." : "Generar Reporte"}
                    </button>
                  </div>
                )}
            </div>

            {/* Error del reporte */}
            {errorReporte && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errorReporte}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Pruebas */}
        {resultado_busqueda?.ot_valida && (
          <div className="flex-1 min-h-0">
            <TablaPruebas
              pruebas={resultado_busqueda.pruebas_en_curso}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}

        {/* Estado vacío cuando no hay búsqueda */}
        {!resultado_busqueda && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Busque una Orden de Trabajo para informes
              </h3>
              <p className="text-gray-500">
                Ingrese el número de OT en el campo de búsqueda para ver las
                pruebas en curso.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Informes;
