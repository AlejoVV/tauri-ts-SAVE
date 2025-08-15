import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, RotateCcw } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";
import {
  getLecturaResultados,
  getMetodoCalculoPorObjetivo,
  getCatalogoEficaciaPorObjetivo,
  saveEfficacyResults,
  getEfficacyResults,
} from "../servicios/index";

interface EfficacyCalculationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montage: MontageInProgress;
  onCalculationComplete: () => void;
}

const mockLecturas = [
  "Lectura Inicial",
  "Lectura 7 días",
  "Lectura 14 días",
  "Lectura Final",
];
const mockResults = {
  "1206": {
    "Lectura Inicial": [20, 18, 19, 21],
    "Lectura 7 días": [18, 17, 16, 19],
    "Lectura 14 días": [15, 14, 16, 17],
    "Lectura Final": [12, 11, 13, 14],
  },
};

export function EfficacyCalculationModal({
  open,
  onOpenChange,
  montage,
  onCalculationComplete,
}: EfficacyCalculationModalProps) {
  const [selectedLecturas, setSelectedLecturas] = useState<string[]>([]);
  const [calculationMethod, setCalculationMethod] = useState<string>("");
  const [efficacyResults, setEfficacyResults] = useState<{
    [pruebaId: string]: number;
  }>({});
  const [efficacyByLectura, setEfficacyByLectura] = useState<{
    [pruebaId: string]: { [lectura: string]: number };
  }>({});
  const [maxEfficacyByPrueba, setMaxEfficacyByPrueba] = useState<{
    [pruebaId: string]: { value: number; lectura: string };
  }>({});
  const [lecturaPromedios, setLecturaPromedios] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [formula, setFormula] = useState("");
  const [catalogoInfo, setCatalogoInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [hasSavedResults, setHasSavedResults] = useState(false);

  // Cargar datos reales al abrir el modal
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchData = async () => {
      // Obtener información completa del catálogo de eficacia
      const catalogoData = await getCatalogoEficaciaPorObjetivo(
        montage.objetivo
      );
      setCatalogoInfo(catalogoData);

      // Obtener método de cálculo recomendado
      const metodo =
        catalogoData?.calculo_de_eficacia ||
        (await getMetodoCalculoPorObjetivo(montage.objetivo));
      setCalculationMethod(metodo);

      // Mostrar la fórmula
      if (metodo.toLowerCase().includes("abbott")) {
        setFormula("Eficacia = ((Testigo - Tratado) / Testigo) * 100");
      } else if (metodo.toLowerCase().includes("henderson")) {
        setFormula(
          "Eficacia = [1 - (Testigo Final * Tratado Inicial) / (Testigo Inicial * Tratado Final)] * 100"
        );
      } else {
        setFormula(metodo);
      }
      // Obtener resultados de lecturas
      const { testigoResults, pruebaResults } = await getLecturaResultados(
        Number(montage.id)
      );
      // Determinar lecturas únicas
      const allLecturas = new Set<string>();
      Object.keys(testigoResults).forEach((k) =>
        allLecturas.add(k.replace(/^Testigo-/, ""))
      );
      Object.keys(pruebaResults).forEach((k) => {
        const parts = k.split("-");
        if (parts.length > 1)
          allLecturas.add(parts.slice(1).join("-").toString());
      });
      const lecturasArr = Array.from(allLecturas);
      setSelectedLecturas(lecturasArr);
      // Calcular promedios por lectura y prueba
      const promedios: any = {};
      // Testigo
      promedios["testigo"] = lecturasArr.map((nombreLectura) => {
        const arr = testigoResults[`Testigo-${nombreLectura}`] || [];
        if (arr.length === 0) return "-";
        return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
      });
      // Pruebas
      montage.pruebas.forEach((pruebaId: string) => {
        promedios[pruebaId] = lecturasArr.map((nombreLectura) => {
          const arr = pruebaResults[`${pruebaId}-${nombreLectura}`] || [];
          if (arr.length === 0) return "-";
          return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
        });
      });
      setLecturaPromedios(promedios);

      // Calcular eficacia para cada lectura de cada prueba
      const eficaciaPorLectura: {
        [pruebaId: string]: { [lectura: string]: number };
      } = {};
      const maxEficaciaPorPrueba: {
        [pruebaId: string]: { value: number; lectura: string };
      } = {};
      const eficaciaFinal: { [pruebaId: string]: number } = {};

      montage.pruebas.forEach((pruebaId: string) => {
        eficaciaPorLectura[pruebaId] = {};
        let maxEficacia = -Infinity;
        let lecturaMaxEficacia = "";

        // Calcular eficacia para cada lectura
        lecturasArr.forEach((lectura, lecturaIdx) => {
          const tratado = Number(promedios[pruebaId][lecturaIdx]);
          const testigo = Number(promedios["testigo"][lecturaIdx]);
          const inicial = Number(promedios[pruebaId][0]);
          const testigoInicial = Number(promedios["testigo"][0]);

          let valor = 0;
          if (metodo.toLowerCase().includes("abbott")) {
            valor = testigo !== 0 ? ((testigo - tratado) / testigo) * 100 : 0;
          } else if (metodo.toLowerCase().includes("henderson")) {
            valor =
              (1 - (testigo * inicial) / (testigoInicial * tratado)) * 100;
          } else {
            valor = inicial - tratado;
          }

          const eficaciaCalculada = Number.isFinite(valor)
            ? Number(valor.toFixed(2))
            : 0;
          eficaciaPorLectura[pruebaId][lectura] = eficaciaCalculada;

          // Encontrar la eficacia máxima
          if (eficaciaCalculada > maxEficacia) {
            maxEficacia = eficaciaCalculada;
            lecturaMaxEficacia = lectura;
          }
        });

        maxEficaciaPorPrueba[pruebaId] = {
          value: maxEficacia,
          lectura: lecturaMaxEficacia,
        };
        eficaciaFinal[pruebaId] = maxEficacia;
      });

      setEfficacyByLectura(eficaciaPorLectura);
      setMaxEfficacyByPrueba(maxEficaciaPorPrueba);
      setEfficacyResults(eficaciaFinal);

      // Cargar resultados de eficacia guardados previamente
      const savedResults = await getEfficacyResults(Number(montage.id));
      if (Object.keys(savedResults).length > 0) {
        setEfficacyResults(savedResults);
        setHasSavedResults(true);
      } else {
        setHasSavedResults(false);
      }

      setLoading(false);
    };
    fetchData();
  }, [open, montage]);

  // Handler para editar eficacia manualmente
  const handleEfficacyEdit = (pruebaId: string, value: string) => {
    if (value === "") {
      // Si el valor está vacío, eliminar la entrada del objeto
      setEfficacyResults((prev) => {
        const newResults = { ...prev };
        delete newResults[pruebaId];
        return newResults;
      });
    } else {
      setEfficacyResults((prev) => ({ ...prev, [pruebaId]: Number(value) }));
    }
  };

  // Validar que todos los resultados de eficacia estén completos
  const isValidForSaving = () => {
    return montage.pruebas.every((pruebaId) => {
      const value = efficacyResults[pruebaId];
      return (
        value !== undefined && value !== null && !isNaN(value) && value !== ""
      );
    });
  };

  // Handler para guardar
  const handleComplete = async () => {
    if (!isValidForSaving()) {
      alert(
        "Por favor, complete todos los valores de eficacia antes de guardar."
      );
      return;
    }

    setSaving(true);
    try {
      const result = await saveEfficacyResults(
        Number(montage.id),
        efficacyResults
      );
      if (result.success) {
        setHasSavedResults(true);
        onCalculationComplete();
      } else {
        console.error("Error al guardar:", result.error);
        alert("Error al guardar los resultados: " + result.error);
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      alert("Error inesperado al guardar los resultados");
    } finally {
      setSaving(false);
    }
  };

  // Encabezados de columnas
  const columns = [
    {
      key: "testigo",
      label: "Testigo",
      producto: "",
      dosis: "",
      unidades: "",
      finca: "",
      especie: "",
    },
    ...montage.pruebas.map((pruebaId: string, idx: number) => {
      // Intentar obtener dosis y unidades desde condicionesIniciales
      let dosis = "";
      let unidades = "";
      if (
        montage.condicionesIniciales &&
        montage.condicionesIniciales.pruebas &&
        montage.condicionesIniciales.pruebas[pruebaId]
      ) {
        dosis = montage.condicionesIniciales.pruebas[pruebaId].dosis || "";
        unidades =
          montage.condicionesIniciales.pruebas[pruebaId].unidades || "";
      }

      // Determinar el formato del label de la prueba
      let pruebaLabel;
      if (montage.ot && montage.pruebaToOT) {
        // Obtener todas las OTs únicas del montaje
        const otsUnicas = montage.ot.includes(", ")
          ? montage.ot.split(", ")
          : [montage.ot];

        // Si hay solo una OT única, mostrar formato actual
        if (otsUnicas.length === 1) {
          pruebaLabel = `Prueba: ${pruebaId}`;
        } else {
          // Si hay múltiples OTs, mostrar formato "numeroOT-numeroPrueba"
          const otDePrueba = montage.pruebaToOT[pruebaId] || "Sin OT";
          pruebaLabel = `Prueba: ${otDePrueba}-${pruebaId}`;
        }
      } else {
        pruebaLabel = `Prueba: ${pruebaId}`;
      }

      return {
        key: pruebaId,
        label: pruebaLabel,
        producto: montage.productos[idx] || "",
        dosis,
        unidades,
        finca: montage.finca || "",
        especie: montage.especie || "",
      };
    }),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !h-[95vh] !max-h-[95vh] sm:!max-w-[95vw] md:!max-w-[95vw] lg:!max-w-[95vw] xl:!max-w-[95vw] overflow-y-auto p-0">
        <div className="bg-white h-full w-full flex flex-col">
          {/* Header mejorado */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Cálculo de Eficacia
              </h1>
              {hasSavedResults && (
                <Badge
                  variant="outline"
                  className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1"
                >
                  Resultados guardados
                </Badge>
              )}
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">Montaje:</span>
                  <span className="text-gray-900 font-medium">
                    {montage.nombreMontaje}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">
                    Objetivo de Eficacia:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {montage.objetivo}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-700">
                    Método de Cálculo:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {calculationMethod}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              <p className="font-medium text-gray-800 mb-1">Instrucciones:</p>
              <p className="mb-2">
                El sistema calcula automáticamente la eficacia para cada lectura
                de cada prueba. La eficacia máxima (resaltada en verde) se
                selecciona como valor final, pero puede ajustarse manualmente.
              </p>
              <p className="text-xs text-blue-600">
                • <strong>Azul:</strong> Eficacias calculadas por lectura •{" "}
                <strong>Verde:</strong> Eficacia máxima encontrada •{" "}
                <strong>Final:</strong> Valor ajustable basado en la máxima
              </p>
            </div>
          </div>

          <div className="flex-1 p-6">
            {loading ? (
              <div className="text-center py-8">Cargando datos...</div>
            ) : (
              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                {/* Título de la sección */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800">
                    Datos de Lecturas y Cálculo de Eficacia
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Valores promedio por lectura y porcentajes de eficacia
                    calculados
                  </p>
                </div>

                <div className="w-full">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-5 text-left text-xl font-bold text-gray-900 border-r border-gray-300 bg-gray-100 sticky left-0 z-10">
                          Período de Lectura
                        </th>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-6 py-5 text-center text-lg font-bold text-gray-900 border-r border-gray-300 bg-gray-100 min-w-[220px] whitespace-normal break-words"
                            style={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-700">
                                {col.label}
                              </div>
                              {col.key !== "testigo" && (
                                <>
                                  <div className="text-xs text-gray-700 font-medium">
                                    {col.finca}
                                  </div>
                                  <div className="text-xs text-green-600 font-medium">
                                    {col.especie}
                                  </div>
                                  <div className="text-xs text-gray-800 font-semibold">
                                    {col.producto}
                                  </div>
                                  <div className="text-xs text-purple-600 font-medium">
                                    {col.dosis}{" "}
                                    {col.unidades
                                      ? col.unidades.toLowerCase()
                                      : ""}
                                  </div>
                                </>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {selectedLecturas.map((lectura, idx) => (
                        <tr
                          key={lectura}
                          className={`border-t border-gray-200 hover:bg-gray-50 ${
                            idx % 2 === 0 ? "bg-gray-25" : "bg-white"
                          }`}
                        >
                          <td className="px-8 py-2 text-lg font-semibold text-gray-900 border-r border-gray-300 bg-gray-50 sticky left-0 z-10">
                            {lectura}
                          </td>
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className="px-6 py-2 border-r border-gray-300 text-center text-lg font-medium"
                            >
                              <div className="bg-gray-50 rounded-lg px-3 py-2 inline-block min-w-[60px]">
                                {lecturaPromedios[col.key] &&
                                lecturaPromedios[col.key][idx] !== undefined &&
                                lecturaPromedios[col.key][idx] !== null &&
                                lecturaPromedios[col.key][idx] !== "" ? (
                                  <span className="font-semibold text-gray-800">
                                    {lecturaPromedios[col.key][idx]}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* Filas de Eficacia por Lectura */}
                      {selectedLecturas.map((lectura, idx) => (
                        <tr
                          key={`eficacia-${lectura}`}
                          className="border-t border-blue-200 bg-blue-50"
                        >
                          <td className="px-8 py-2 text-lg font-semibold text-blue-900 border-r border-gray-300 bg-blue-100 sticky left-0 z-10">
                            <div className="flex flex-col">
                              <span>Eficacia {lectura}</span>
                              <span className="text-sm font-normal text-blue-600">
                                Calculada (%)
                              </span>
                            </div>
                          </td>
                          {columns.map((col) =>
                            col.key === "testigo" ? (
                              <td
                                key={col.key}
                                className="px-6 py-2 border-r border-gray-300 text-center"
                              >
                                <div className="bg-gray-100 rounded-lg px-3 py-2 text-gray-500 font-medium">
                                  <div className="text-base">N/A</div>
                                  <div className="text-xs">Control</div>
                                </div>
                              </td>
                            ) : (
                              <td
                                key={col.key}
                                className="px-6 py-2 border-r border-gray-300 text-center"
                              >
                                <div
                                  className={`rounded-lg px-3 py-2 font-bold text-base ${
                                    maxEfficacyByPrueba[col.key]?.lectura ===
                                    lectura
                                      ? "bg-green-100 text-green-800 border-2 border-green-300"
                                      : "bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {efficacyByLectura[col.key]?.[
                                    lectura
                                  ]?.toFixed(2) || "0.00"}
                                  %
                                  {maxEfficacyByPrueba[col.key]?.lectura ===
                                    lectura && (
                                    <div className="text-xs text-green-600 mt-1 font-medium">
                                      MÁXIMA
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          )}
                        </tr>
                      ))}

                      {/* Fila de Eficacia Final - Destacada */}
                      <tr className="border-t-4 border-gray-300 bg-gray-50">
                        <td className="px-8 py-3 text-xl font-bold text-gray-900 border-r border-gray-300 bg-gray-100 sticky left-0 z-10">
                          <div className="flex flex-col">
                            <span>Eficacia Final</span>
                            <span className="text-sm font-normal text-gray-600">
                              Ajustable (%)
                            </span>
                            <span className="text-xs font-normal text-green-600 mt-1">
                              Basada en máxima
                            </span>
                          </div>
                        </td>
                        {columns.map((col) =>
                          col.key === "testigo" ? (
                            <td
                              key={col.key}
                              className="px-6 py-3 border-r border-gray-300 text-center"
                            >
                              <div className="bg-gray-100 rounded-lg px-4 py-3 text-gray-500 font-medium">
                                <div className="text-lg">N/A</div>
                                <div className="text-xs">Control</div>
                              </div>
                            </td>
                          ) : (
                            <td
                              key={col.key}
                              className="px-6 py-3 border-r border-gray-300 text-center"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="text-xs text-green-600 font-medium mb-1">
                                  Máx:{" "}
                                  {maxEfficacyByPrueba[col.key]?.lectura ||
                                    "N/A"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={
                                      efficacyResults[col.key] !== undefined
                                        ? efficacyResults[col.key]
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleEfficacyEdit(col.key, e.target.value)
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-32 text-center text-xl font-bold border-2 border-green-300 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 rounded p-3"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const maxEfficacy = maxEfficacyByPrueba[col.key]?.value;
                                      if (maxEfficacy !== undefined) {
                                        handleEfficacyEdit(col.key, maxEfficacy.toString());
                                      }
                                    }}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors duration-200"
                                    title="Restablecer a eficacia máxima"
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                  % Eficacia Final
                                </span>
                              </div>
                            </td>
                          )
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Información adicional y acciones */}
                <div className="mt-6 space-y-4">
                  {/* Fórmula aplicada */}
                  <div className="bg-gray-50 border border-gray-200 rounded p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Fórmula de Cálculo:
                      </h3>
                      <code className="text-sm bg-white border border-gray-300 rounded px-3 py-2 font-mono text-gray-700 block">
                        {formula}
                      </code>
                      <p className="text-xs text-gray-600 mt-2">
                        Esta fórmula se aplica automáticamente según el método
                        de cálculo seleccionado para el objetivo de eficacia.
                      </p>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <p>
                        Asegúrese de completar todos los valores de eficacia
                        antes de guardar
                      </p>
                    </div>
                    <Button
                      onClick={handleComplete}
                      disabled={saving || !isValidForSaving()}
                      className="flex items-center gap-3 px-10 py-4 text-lg font-semibold"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Guardando resultados...</span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-6 w-6" />
                          <span>Guardar Resultados Definitivos</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
