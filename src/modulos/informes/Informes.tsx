import { useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
    otBuscada,
    resultadoBusqueda,
    loading,
    error,
    buscarOT,
    limpiarBusqueda,
    actualizarOTBuscada,
  } = useInformes();

  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const [pruebasSeleccionadas, setPruebasSeleccionadas] = useState<PruebaEnCurso[]>([]);

  const handleBuscar = useCallback(() => buscarOT(otBuscada), [buscarOT, otBuscada]);

  const handleLimpiar = useCallback(() => {
    limpiarBusqueda();
    setPruebasSeleccionadas([]);
  }, [limpiarBusqueda]);

  const handleSelectionChange = useCallback((selectedTests: PruebaEnCurso[]) => {
    setPruebasSeleccionadas(selectedTests);
  }, []);

  const generarReporte = async () => {
    if (!resultadoBusqueda?.otValida || !resultadoBusqueda.contacto || !resultadoBusqueda.empresa) {
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
      const fechaHoy = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
      const fincasTexto = [...new Set(pruebasSeleccionadas.map(p => p.fincaDeLaCepa))].join(", ");

      const { contactoNombres, encabezado, contactoCargo } = await obtenerInfoContacto(
        resultadoBusqueda.contacto.nombre,
        resultadoBusqueda.empresa.nombre,
      );

      const filename = `reporte_eficacia_OT_${otBuscada}_${new Date().toISOString().split("T")[0]}`;
      const pruebas = await Promise.all(
        pruebasSeleccionadas.map(prueba => obtenerDatosPrueba(prueba, otBuscada))
      );

      const payload = {
        data: {
          autoriza: resultadoBusqueda.contacto.nombre,
          email: resultadoBusqueda.contacto.email,
          nombre: contactoNombres,
          encabezado,
          cargo: contactoCargo,
          facturar_a: resultadoBusqueda.empresa.nombre,
          ot: otBuscada,
          finca_de_la_cepa: fincasTexto,
          fecha_hoy: fechaHoy,
          archivo: filename,
          total_pruebas: pruebasSeleccionadas.length,
          pruebas,
        },
        filename,
      };

      const blob = await llamarEdgeFunctionDocx(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (catchError) {
      console.error("Error al generar reporte:", catchError);
      setErrorReporte(catchError instanceof Error ? catchError.message : "Error desconocido al generar el reporte");
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
                  valor={otBuscada}
                  onCambio={actualizarOTBuscada}
                  onBuscar={handleBuscar}
                  onLimpiar={handleLimpiar}
                  loading={loading}
                  error={error}
                />
              </div>

              {resultadoBusqueda?.otValida && resultadoBusqueda.empresa && (
                <div className={cn("flex items-center gap-2")}>
                  <Building2 className={cn("text-blue-600")} size={16} />
                  <span className={cn("text-lg font-medium text-gray-700")}>empresa:</span>
                  <span className={cn("text-lg font-semibold text-gray-900")}>{resultadoBusqueda.empresa.nombre}</span>
                </div>
              )}

              {resultadoBusqueda?.otValida && resultadoBusqueda.contacto && (
                <div className={cn("flex items-center gap-2")}>
                  <User className={cn("text-green-600")} size={16} />
                  <span className={cn("text-lg font-medium text-gray-700")}>contacto:</span>
                  <div className={cn("flex items-center gap-2")}>
                    <span className={cn("text-lg font-semibold text-gray-900")}>{resultadoBusqueda.contacto.nombre}</span>
                    <span className={cn("text-sm text-gray-500")}>({resultadoBusqueda.contacto.email})</span>
                  </div>
                </div>
              )}

              {resultadoBusqueda?.otValida && resultadoBusqueda.pruebasEnCurso.length > 0 && (
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

        {resultadoBusqueda?.otValida && (
          <div className={cn("flex-1 min-h-0")}>
            <TablaPruebas
              pruebas={resultadoBusqueda.pruebasEnCurso}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}

        {!resultadoBusqueda && !loading && (
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
