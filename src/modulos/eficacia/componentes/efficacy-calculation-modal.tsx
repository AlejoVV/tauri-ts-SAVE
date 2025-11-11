import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { TrendingUp, RotateCcw, RefreshCw } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";
import {
  getLecturaResultados,
  getMetodoCalculoPorObjetivo,
  getCatalogoEficaciaPorObjetivo,
  saveEfficacyResults,
  getEfficacyResults,
} from "../servicios/index";
import { marcarPruebasParaRepeticion } from "../servicios/repeticion";

interface EfficacyCalculationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montage: MontageInProgress;
  onCalculationComplete: () => void;
  // Propiedades opcionales para modo de revisión
  isReviewMode?: boolean;
  initialEfficacies?: { [pruebaId: string]: number };
  onEfficaciesUpdate?: (efficacies: { [pruebaId: string]: number }) => void;
  currentMontageIndex?: number;
  totalMontages?: number;
}

export function EfficacyCalculationModal({
  open,
  onOpenChange,
  montage,
  onCalculationComplete,
  isReviewMode = false,
  initialEfficacies = {},
  onEfficaciesUpdate,
  currentMontageIndex,
  totalMontages,
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
  const [saving, setSaving] = useState(false);
  const [hasSavedResults, setHasSavedResults] = useState(false);
  const [pruebasParaRepetir, setPruebasParaRepetir] = useState<Set<string>>(new Set());

  // Cargar datos reales al abrir el modal
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchData = async () => {
      // Obtener información completa del catálogo de eficacia
      const catalogoData = await getCatalogoEficaciaPorObjetivo(
        montage.objetivo
      );

      // Obtener método de cálculo recomendado
      const metodo =
        catalogoData?.metodo_calculo_de_eficacia ||
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

      // En modo de revisión, cargar eficacias existentes
      if (isReviewMode) {
        // Si se proporcionaron eficacias iniciales, usarlas
        if (Object.keys(initialEfficacies).length > 0) {
          setEfficacyResults(initialEfficacies);
          setHasSavedResults(true);
        } else {
          // Cargar eficacias guardadas desde la base de datos
          const existingResults = await getEfficacyResults(Number(montage.id));
          setEfficacyResults(existingResults);
          setHasSavedResults(Object.keys(existingResults).length > 0);
        }
      }
      // Obtener resultados de lecturas
      const { testigoResults, pruebaResults } = await getLecturaResultados(
        Number(montage.id)
      );
      // Generar lecturas con formato consistente "Lectura X (nombre)" igual que en results-entry-modal
      const lecturas = Array.from(
        { length: montage.numeroLecturas },
        (_, i) => {
          const nombrePersonalizado = montage.nombresLecturas?.[i];
          return nombrePersonalizado
            ? `Lectura ${i + 1} (${nombrePersonalizado})`
            : `Lectura ${i + 1}`;
        }
      );

      // También obtener lecturas desde resultados guardados para mantener compatibilidad
      const lecturasDeResultados = new Set<string>();
      Object.keys(testigoResults).forEach((k) =>
        lecturasDeResultados.add(k.replace(/^Testigo-/, ""))
      );
      Object.keys(pruebaResults).forEach((k) => {
        const parts = k.split("-");
        if (parts.length > 1)
          lecturasDeResultados.add(parts.slice(1).join("-").toString());
      });

      // Usar lecturas del montaje si están configuradas, sino usar las de resultados guardados
      const allLecturas =
        lecturas.length > 0 && montage.nombresLecturas?.length > 0
          ? lecturas
          : Array.from(lecturasDeResultados);
      setSelectedLecturas(allLecturas);
      // Calcular promedios por lectura y prueba
      const promedios: any = {};
      // Testigo
      promedios["testigo"] = allLecturas.map((lecturaDisplay) => {
        console.log("Buscando clave testigo:", `Testigo-${lecturaDisplay}`);
        const arr = testigoResults[`Testigo-${lecturaDisplay}`] || [];
        console.log("Array encontrado para testigo:", arr);
        if (arr.length === 0) return "-";
        const promedio = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(
          2
        );
        console.log("Promedio calculado para testigo:", promedio);
        return promedio;
      });
      // Pruebas
      montage.pruebas.forEach((pruebaId: string) => {
        promedios[pruebaId] = allLecturas.map((lecturaDisplay) => {
          console.log(
            "Buscando clave prueba:",
            `${pruebaId}-${lecturaDisplay}`
          );
          const arr = pruebaResults[`${pruebaId}-${lecturaDisplay}`] || [];
          console.log("Array encontrado para prueba:", arr);
          if (arr.length === 0) return "-";
          const promedio = (
            arr.reduce((a, b) => a + b, 0) / arr.length
          ).toFixed(2);
          console.log("Promedio calculado para prueba:", promedio);
          return promedio;
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
        let ultimaEficacia = 0;
        let ultimaLectura = "";

        // Calcular eficacia para cada lectura
        allLecturas.forEach((lecturaDisplay, lecturaIdx) => {
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
          eficaciaPorLectura[pruebaId][lecturaDisplay] = eficaciaCalculada;

          // Usar la última lectura (la más reciente)
          ultimaEficacia = eficaciaCalculada;
          ultimaLectura = lecturaDisplay;
        });

        maxEficaciaPorPrueba[pruebaId] = {
          value: ultimaEficacia,
          lectura: ultimaLectura,
        };
        eficaciaFinal[pruebaId] = ultimaEficacia;
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
      // Si el valor está vacío, establecer como 0.0
      setEfficacyResults((prev) => ({ ...prev, [pruebaId]: 0.0 }));
    } else {
      const numericValue = Number.parseFloat(value);
      setEfficacyResults((prev) => ({ 
        ...prev, 
        [pruebaId]: Number.isNaN(numericValue) ? 0.0 : numericValue 
      }));
    }
  };

  // Validar que todos los resultados de eficacia estén completos
  const isValidForSaving = () => {
    return montage.pruebas.every((pruebaId) => {
      const value = efficacyResults[pruebaId];
      return (
        value !== undefined &&
        value !== null &&
        !isNaN(value) &&
        typeof value === "number"
      );
    });
  };

  // Handler para marcar/desmarcar pruebas para repetición
  const handleToggleRepeticion = (pruebaId: string) => {
    setPruebasParaRepetir(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pruebaId)) {
        newSet.delete(pruebaId);
      } else {
        newSet.add(pruebaId);
      }
      return newSet;
    });
  };

  // Handler para guardar o actualizar (según el modo)
  const handleComplete = async () => {
    if (!isValidForSaving()) {
      alert(
        "Por favor, complete todos los valores de eficacia antes de continuar."
      );
      return;
    }

    if (isReviewMode) {
      // Modo de revisión: actualizar estado externo sin guardar en BD
      if (onEfficaciesUpdate) {
        onEfficaciesUpdate(efficacyResults);
      }
      onCalculationComplete();
      return;
    }

    // Modo normal: guardar en base de datos
    setSaving(true);
    try {
      // Primero marcar pruebas para repetición si hay alguna seleccionada
      if (pruebasParaRepetir.size > 0) {
        const pruebasParaRepetirArray = Array.from(pruebasParaRepetir);
        const repeticionResult = await marcarPruebasParaRepeticion(pruebasParaRepetirArray);
        if (!repeticionResult.success) {
          console.error("Error al marcar pruebas para repetición:", repeticionResult.error);
          alert("Error al marcar pruebas para repetición: " + repeticionResult.error);
          setSaving(false);
          return;
        }
      }

      // Luego guardar los resultados de eficacia
      const pruebasParaRepetirArray = Array.from(pruebasParaRepetir);
      const result = await saveEfficacyResults(
        Number(montage.id),
        efficacyResults,
        pruebasParaRepetirArray
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
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {isReviewMode
                    ? "Revisión de Eficacia"
                    : "Cálculo de Eficacia"}
                </h1>
                {isReviewMode &&
                  currentMontageIndex &&
                  totalMontages &&
                  totalMontages > 1 && (
                    <p className="text-base text-blue-600 font-medium mt-1">
                      Montaje {currentMontageIndex} de {totalMontages}
                    </p>
                  )}
              </div>
              {hasSavedResults && (
                <Badge
                  variant="outline"
                  className={
                    isReviewMode
                      ? "bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
                      : "bg-gray-50 text-gray-700 border-gray-200 px-3 py-1"
                  }
                >
                  {isReviewMode
                    ? "Revisando eficacias"
                    : "Resultados guardados"}
                </Badge>
              )}
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-base">
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
            <div className="mt-3 text-base text-gray-600 bg-gray-50 border border-gray-200 rounded p-3">
              <p className="font-medium text-gray-800 mb-1">Instrucciones:</p>
              <p className="mb-2">
                El sistema calcula automáticamente la eficacia para cada lectura
                de cada prueba. La eficacia de la última lectura (resaltada en verde) se
                selecciona como valor final, pero puede ajustarse manualmente.
              </p>
              <p className="text-sm text-blue-600">
                • <strong>Azul:</strong> Eficacias calculadas por lectura •{" "}
                <strong>Verde:</strong> Eficacia de la última lectura •{" "}
                <strong>Final:</strong> Valor ajustable basado en la última lectura
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
                  <h2 className="text-2xl font-bold text-gray-800">
                    Datos de Lecturas y Cálculo de Eficacia
                  </h2>
                  <p className="text-base text-gray-600 mt-1">
                    Valores promedio por lectura y porcentajes de eficacia
                    calculados
                  </p>
                </div>

                <div className="w-full">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-5 text-left text-2xl font-bold text-gray-900 border-r border-gray-300 bg-gray-100 sticky left-0 z-10">
                          Período de Lectura
                        </th>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-6 py-5 text-center text-xl font-bold text-gray-900 border-r border-gray-300 bg-gray-100 min-w-[220px] whitespace-normal break-words"
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
                                  <div className="text-sm text-gray-700 font-medium">
                                    {col.finca}
                                  </div>
                                  <div className="text-sm text-green-600 font-medium">
                                    {col.especie}
                                  </div>
                                  <div className="text-sm text-gray-800 font-semibold">
                                    {col.producto}
                                  </div>
                                  <div className="text-sm text-purple-600 font-medium">
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
                          <td className="px-8 py-2 text-xl font-semibold text-gray-900 border-r border-gray-300 bg-gray-50 sticky left-0 z-10">
                            {lectura}
                          </td>
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className="px-6 py-2 border-r border-gray-300 text-center text-xl font-medium"
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
                      {selectedLecturas.map((lectura, _) => (
                        <tr
                          key={`eficacia-${lectura}`}
                          className="border-t border-blue-200 bg-blue-50"
                        >
                          <td className="px-8 py-2 text-xl font-semibold text-blue-900 border-r border-gray-300 bg-blue-100 sticky left-0 z-10">
                            <div className="flex flex-col">
                              <span>Eficacia {lectura}</span>
                              <span className="text-base font-normal text-blue-600">
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
                                  <div className="text-lg">N/A</div>
                                  <div className="text-sm">Control</div>
                                </div>
                              </td>
                            ) : (
                              <td
                                key={col.key}
                                className="px-6 py-2 border-r border-gray-300 text-center"
                              >
                                <div
                                  className={`rounded-lg px-3 py-2 font-bold text-lg ${
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
                                    <div className="text-sm text-green-600 mt-1 font-medium">
                                      ÚLTIMA
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
                        <td className="px-8 py-3 text-2xl font-bold text-gray-900 border-r border-gray-300 bg-gray-100 sticky left-0 z-10">
                          <div className="flex flex-col">
                            <span>Eficacia Final</span>
                            <span className="text-base font-normal text-gray-600">
                              Ajustable (%)
                            </span>
                            <span className="text-sm font-normal text-green-600 mt-1">
                              Basada en última lectura
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
                                <div className="text-xl">N/A</div>
                                <div className="text-sm">Control</div>
                              </div>
                            </td>
                          ) : (
                            <td
                              key={col.key}
                              className="px-6 py-3 border-r border-gray-300 text-center"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="text-sm text-green-600 font-medium mb-1">
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
                                      handleEfficacyEdit(
                                        col.key,
                                        e.target.value
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-32 text-center text-2xl font-bold border-2 border-green-300 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-500 rounded p-3"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const maxEfficacy =
                                        maxEfficacyByPrueba[col.key]?.value;
                                      if (maxEfficacy !== undefined) {
                                        handleEfficacyEdit(
                                          col.key,
                                          maxEfficacy.toString()
                                        );
                                      }
                                    }}
                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full transition-colors duration-200"
                                    title="Restablecer a eficacia de la última lectura"
                                  >
                                    <RotateCcw size={16} />
                                  </button>
                                </div>
                                <span className="text-sm text-gray-600 font-medium">
                                  % Eficacia Final
                                </span>
                              </div>
                            </td>
                          )
                        )}
                      </tr>

                      {/* Fila de Repetición */}
                      <tr className="border-t-2 border-orange-200 bg-orange-50">
                        <td className="px-8 py-3 text-xl font-bold text-orange-900 border-r border-gray-300 bg-orange-100 sticky left-0 z-10">
                          <div className="flex flex-col">
                            <span>Marcar para Repetición</span>
                            <span className="text-sm font-normal text-orange-600">
                              Seleccionar pruebas a repetir
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
                                <div className="text-sm">N/A</div>
                                <div className="text-xs">Control</div>
                              </div>
                            </td>
                          ) : (
                            <td
                              key={col.key}
                              className="px-6 py-3 border-r border-gray-300 text-center"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`repetir-${col.key}`}
                                    checked={pruebasParaRepetir.has(col.key)}
                                    onCheckedChange={() => handleToggleRepeticion(col.key)}
                                    className="w-5 h-5"
                                  />
                                  <label
                                    htmlFor={`repetir-${col.key}`}
                                    className="text-sm font-medium text-orange-700 cursor-pointer"
                                  >
                                    Repetir
                                  </label>
                                </div>
                                {pruebasParaRepetir.has(col.key) && (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <RefreshCw size={14} />
                                    <span className="text-xs font-medium">
                                      Para repetición
                                    </span>
                                  </div>
                                )}
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
                      <code className="text-base bg-white border border-gray-300 rounded px-3 py-2 font-mono text-gray-700 block">
                        {formula}
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Esta fórmula se aplica automáticamente según el método
                        de cálculo seleccionado para el objetivo de eficacia.
                      </p>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-base text-gray-600">
                      <p>
                        Asegúrese de completar todos los valores de eficacia
                        antes de guardar
                      </p>
                    </div>
                    <Button
                      onClick={handleComplete}
                      disabled={saving || !isValidForSaving()}
                      className="flex items-center gap-3 px-10 py-4 text-xl font-semibold"
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
                          <span>
                            {isReviewMode
                              ? currentMontageIndex &&
                                totalMontages &&
                                totalMontages > 1
                                ? `Confirmar Revisión (${currentMontageIndex}/${totalMontages})`
                                : "Confirmar Revisión"
                              : "Guardar Resultados Definitivos"}
                          </span>
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
