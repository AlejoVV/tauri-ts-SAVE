import { useState } from "react";
import { FileText, Building2, User, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInformes } from "@/modulos/informes/hooks/useInformes";
import { BusquedaOT, TablaPruebas } from "@/modulos/informes/componentes";
import type { PruebaEnCurso } from "@/modulos/informes/tipos";
import {
  obtenerDatosPrueba,
  obtenerInfoContacto,
  llamarEdgeFunctionDocx,
} from "@/modulos/informes/servicios";

export function Informes() {
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
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<PruebaEnCurso[]>([]);

  const handleBuscar = () => buscarOT(ot_buscada);

  const handleLimpiar = () => {
    limpiarBusqueda();
    setPruebasSeleccionadas([]);
  };

  const handleSelectionChange = (selectedTests: PruebaEnCurso[]) => {
    setPruebasSeleccionadas(selectedTests);
  };

  const generarReporte = async () => {
    if (!resultado_busqueda?.ot_valida || !resultado_busqueda.contacto || !resultado_busqueda.empresa) {
      setErrorReporte("No hay datos suficientes para generar el reporte");
      return;
    }

    if (pruebasSeleccionadas.length === 0) {
      setErrorReporte("Debe seleccionar al menos una prueba para generar el reporte");
      return;
    }

    setGenerandoReporte(true);
    setErrorReporte(null);

    try {
      const fechaHoy = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
      const fincasTexto = [...new Set(pruebasSeleccionadas.map((p) => p.finca_de_la_cepa))].join(", ");

      const { contactoNombres, encabezado, contactoCargo } = await obtenerInfoContacto(
        resultado_busqueda.contacto.nombre,
        resultado_busqueda.empresa.nombre
      );

      const filename = `reporte_eficacia_OT_${ot_buscada}_${new Date().toISOString().split("T")[0]}`;

      const pruebas = await Promise.all(
        pruebasSeleccionadas.map((prueba) => obtenerDatosPrueba(prueba, ot_buscada))
      );

      const payload = {
        data: {
          autoriza: resultado_busqueda.contacto.nombre,
          email: resultado_busqueda.contacto.email,
          nombre: contactoNombres,
          encabezado,
          cargo: contactoCargo,
          facturar_a: resultado_busqueda.empresa.nombre,
          ot: ot_buscada,
          finca_de_la_cepa: fincasTexto,
          fecha_hoy: fechaHoy,
          archivo: filename,
          total_pruebas: pruebasSeleccionadas.length,
          pruebas,
        },
        filename,
      };

      const continuar = window.confirm(
        `Esta es la petición que se enviará a fill-docx-template:\n\n${JSON.stringify(payload, null, 2)}\n\n¿Deseas enviarla ahora?`
      );
      if (!continuar) {
        setGenerandoReporte(false);
        return;
      }

      const blob = await llamarEdgeFunctionDocx(payload);
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
      setErrorReporte(error instanceof Error ? error.message : "Error desconocido al generar el reporte");
    } finally {
      setGenerandoReporte(false);
    }
  };

  return (
    <div className={cn("h-screen bg-gray-50 p-2 md:p-4 flex flex-col")}>
      <div className={cn("w-full mx-auto px-2 md:px-4 flex flex-col h-full")}>
        <div className={cn("mb-2 flex-shrink-0")}>
          <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3 overflow-hidden")}>
            <div className={cn("flex items-center gap-6 flex-wrap")}>
              <div className={cn("flex-shrink-0")}>
                <BusquedaOT
                  valor={ot_buscada}
                  onCambio={actualizarOTBuscada}
                  onBuscar={handleBuscar}
                  onLimpiar={handleLimpiar}
                  loading={loading}
                  error={error}
                />
              </div>

              {resultado_busqueda?.ot_valida && resultado_busqueda.empresa && (
                <div className={cn("flex items-center gap-2")}>
                  <Building2 className={cn("text-blue-600")} size={16} />
                  <span className={cn("text-lg font-medium text-gray-700")}>empresa:</span>
                  <span className={cn("text-lg font-semibold text-gray-900")}>{resultado_busqueda.empresa.nombre}</span>
                </div>
              )}

              {resultado_busqueda?.ot_valida && resultado_busqueda.contacto && (
                <div className={cn("flex items-center gap-2")}>
                  <User className={cn("text-green-600")} size={16} />
                  <span className={cn("text-lg font-medium text-gray-700")}>contacto:</span>
                  <div className={cn("flex items-center gap-2")}>
                    <span className={cn("text-lg font-semibold text-gray-900")}>{resultado_busqueda.contacto.nombre}</span>
                    <span className={cn("text-sm text-gray-500")}>({resultado_busqueda.contacto.email})</span>
                  </div>
                </div>
              )}

              {resultado_busqueda?.ot_valida && resultado_busqueda.pruebas_en_curso.length > 0 && (
                <div className={cn("flex items-center gap-2 ml-auto")}>
                  <span className={cn("text-sm text-gray-600")}>{pruebasSeleccionadas.length} prueba(s) seleccionada(s)</span>
                  <Button
                    onClick={generarReporte}
                    disabled={generandoReporte || pruebasSeleccionadas.length === 0}
                    className={cn("gap-2")}
                  >
                    {generandoReporte ? <Loader2 className={cn("animate-spin")} size={16} /> : <Download size={16} />}
                    {generandoReporte ? "Generando..." : "Generar Reporte"}
                  </Button>
                </div>
              )}
            </div>

            {errorReporte && (
              <div className={cn("mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm")}>
                {errorReporte}
              </div>
            )}
          </div>
        </div>

        {resultado_busqueda?.ot_valida && (
          <div className={cn("flex-1 min-h-0")}>
            <TablaPruebas
              pruebas={resultado_busqueda.pruebas_en_curso}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}

        {!resultado_busqueda && !loading && (
          <div className={cn("flex-1 flex items-center justify-center")}>
            <div className={cn("bg-white border border-gray-200 rounded-lg p-12 text-center")}>
              <FileText className={cn("mx-auto text-gray-300 mb-4")} size={64} />
              <h3 className={cn("text-lg font-medium text-gray-900 mb-2")}>Busque una Orden de Trabajo para informes</h3>
              <p className={cn("text-gray-500")}>Ingrese el número de OT en el campo de búsqueda para ver las pruebas en curso.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
