import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, Plus, Save } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";
import {
  saveLecturaResultados,
  getLecturaResultados,
} from "../servicios/index";
import { supabase } from "../../nucleo/lib/supabaseClient";

interface ResultsEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montage: MontageInProgress;
  onResultsSaved: () => void;
}

export function ResultsEntryModal({
  open,
  onOpenChange,
  montage,
  onResultsSaved,
}: ResultsEntryModalProps) {
  const [currentLectura, setCurrentLectura] = useState(0);
  const [showInitial, setShowInitial] = useState(false);
  const [results, setResults] = useState<Record<string, number[]>>({});
  const [testigoResults, setTestigoResults] = useState<
    Record<string, number[]>
  >({});
  const [photos, setPhotos] = useState<
    Record<string, Record<string, File | null>>
  >({});
  const [loading, setLoading] = useState(false);
  const [lecturasGuardadas, setLecturasGuardadas] = useState<
    Record<string, string>
  >({}); // lectura -> fecha
  const [selectedPhoto, setSelectedPhoto] = useState<{
    file: File;
    title: string;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Cargar datos guardados cuando se abra el modal
  useEffect(() => {
    if (open && montage.id) {
      loadSavedResults();
    }
  }, [open, montage.id]);

  const loadSavedResults = async () => {
    try {
      setLoading(true);

      // Obtener también las fechas de las lecturas guardadas
      const { data: fechasLecturas } = await supabase
        .from("resultados_lecturas")
        .select("nombre_lectura, fecha_lectura")
        .eq("montaje_id", parseInt(montage.id));

      // Crear mapa de lecturas guardadas con sus fechas
      const lecturasConFechas: Record<string, string> = {};
      fechasLecturas?.forEach((item) => {
        if (item.nombre_lectura && item.fecha_lectura) {
          lecturasConFechas[item.nombre_lectura] = item.fecha_lectura;
        }
      });
      setLecturasGuardadas(lecturasConFechas);

      const {
        testigoResults: savedTestigo,
        pruebaResults: savedPruebas,
        success,
        error,
      } = await getLecturaResultados(parseInt(montage.id));

      if (success) {
        setTestigoResults(savedTestigo);
        setResults(savedPruebas);
      } else if (error) {
        console.error("Error al cargar resultados:", error);
      }
    } catch (error) {
      console.error("Error al cargar resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Usar nombres de lecturas reales de la base de datos o generar por defecto
  const lecturas = Array.from({ length: montage.numeroLecturas }, (_, i) => {
    const nombrePersonalizado = montage.nombresLecturas?.[i];
    return nombrePersonalizado
      ? `Lectura ${i + 1} (${nombrePersonalizado})`
      : `Lectura ${i + 1}`;
  });
  const currentLecturaName = showInitial ? "Inicial" : lecturas[currentLectura];

  const handleResultChange = (
    pruebaId: string,
    repeticionIndex: number,
    value: number
  ) => {
    const key = `${pruebaId}-${currentLecturaName}`;
    const newResults = { ...results };
    if (!newResults[key]) {
      newResults[key] = Array(montage.numeroRepeticiones).fill(0);
    }
    newResults[key][repeticionIndex] = value;
    setResults(newResults);
  };

  const handleTestigoChange = (repeticionIndex: number, value: number) => {
    const key = `Testigo-${currentLecturaName}`;
    const newTestigoResults = { ...testigoResults };
    if (!newTestigoResults[key]) {
      newTestigoResults[key] = Array(montage.numeroRepeticiones).fill(0);
    }
    newTestigoResults[key][repeticionIndex] = value;
    setTestigoResults(newTestigoResults);
  };

  const handlePhotoUpload = (
    lectura: string,
    pruebaId: string,
    file: File | null
  ) => {
    if (file) {
      setPhotos((prev) => ({
        ...prev,
        [lectura]: {
          ...prev[lectura],
          [pruebaId]: file,
        },
      }));
    }
  };

  const getPhotoForPrueba = (
    lectura: string,
    pruebaId: string
  ): File | null => {
    return photos[lectura]?.[pruebaId] || null;
  };

  const openPhotoModal = (
    file: File,
    pruebaId: string,
    productInfo?: { nombre: string; dosis: string; unidades: string }
  ) => {
    let title = pruebaId === "testigo" ? "Testigo" : `Prueba ${pruebaId}`;

    if (productInfo && pruebaId !== "testigo") {
      title = `${title} - ${productInfo.nombre} (${productInfo.dosis} ${productInfo.unidades})`;
    }

    setSelectedPhoto({ file, title: `${title} - ${currentLecturaName}` });
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  const handleSaveLectura = async () => {
    try {
      setLoading(true);

      const { success, error } = await saveLecturaResultados(
        parseInt(montage.id),
        currentLecturaName,
        testigoResults,
        results,
        montage.numeroRepeticiones
      );

      if (success) {
        // Actualizar el estado de lecturas guardadas
        setLecturasGuardadas((prev) => ({
          ...prev,
          [currentLecturaName]: new Date().toISOString(),
        }));

        alert(`Lectura "${currentLecturaName}" guardada exitosamente`);
        // QUITAR esta línea que cierra el modal:
        // onResultsSaved();
      } else {
        alert(`Error al guardar: ${error}`);
      }
    } catch (error) {
      console.error("Error al guardar lectura:", error);
      alert("Error inesperado al guardar la lectura");
    } finally {
      setLoading(false);
    }
  };

  const getResultsForPrueba = (pruebaId: string) => {
    const key = `${pruebaId}-${currentLecturaName}`;
    return results[key] || Array(montage.numeroRepeticiones).fill(0);
  };

  const getTestigoResults = () => {
    const key = `Testigo-${currentLecturaName}`;
    return testigoResults[key] || Array(montage.numeroRepeticiones).fill(0);
  };

  const calculateAverage = (values: number[]) => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? (sum / values.length).toFixed(1) : "0";
  };

  const calculateTestigoAverage = () => {
    const testigo = getTestigoResults();
    return calculateAverage(testigo);
  };

  // Función para verificar si una lectura está guardada
  const isLecturaGuardada = (lectura: string) => {
    return lecturasGuardadas.hasOwnProperty(lectura);
  };

  // Función para obtener la fecha de una lectura guardada
  const getFechaLectura = (lectura: string) => {
    const fecha = lecturasGuardadas[lectura];
    if (fecha) {
      return new Date(fecha).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] !h-[96vh] !max-h-[96vh] sm:!max-w-[96vw] md:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[96vw] overflow-hidden p-0">
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 h-full w-full overflow-y-auto">
          {/* Header simplificado y elegante */}
          <div className="bg-white border-b border-gray-200 px-8 py-3">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Registro de Resultados - {montage.nombreMontaje}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <span>
                <strong>Montaje:</strong> {montage.nombreMontaje}
              </span>
              <span>
                <strong>OT:</strong> {montage.ot}
              </span>
              <span>
                <strong>Objetivo:</strong> {montage.objetivo}
              </span>
              <span>
                <strong>Especie:</strong> {montage.especie}
              </span>
              <span>
                <strong>Finca:</strong> {montage.finca}
              </span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Selector de lecturas */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex gap-2 flex-wrap">
                {/* Botón Inicial */}
                <Button
                  variant={showInitial ? "default" : "outline"}
                  onClick={() => {
                    setShowInitial(true);
                    setCurrentLectura(0);
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    showInitial
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Inicial
                </Button>

                {/* Botones de lecturas */}
                {lecturas.map((lectura, index) => {
                  const isGuardada = isLecturaGuardada(lectura);
                  const isSelected = !showInitial && currentLectura === index;

                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => {
                        setShowInitial(false);
                        setCurrentLectura(index);
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-all relative ${
                        isSelected
                          ? isGuardada
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                          : isGuardada
                          ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {lectura}
                      {isGuardada && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {showInitial
                        ? "Condiciones Iniciales"
                        : `Resultados - ${currentLecturaName}`}
                    </h3>
                    {showInitial && (
                      <p className="text-sm text-gray-600 mt-1">
                        Número inicial de individuos por réplica establecido al
                        crear el montaje
                      </p>
                    )}
                  </div>

                  {/* Mostrar fecha de lectura si está guardada */}
                  {!showInitial && isLecturaGuardada(currentLecturaName) && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-700">
                        ✓ Lectura guardada
                      </div>
                      <div className="text-xs text-gray-500">
                        {getFechaLectura(currentLecturaName)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Réplica
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Testigo
                      </th>
                      {montage.pruebas.map((prueba, index) => {
                        // Obtener datos reales desde condicionesIniciales
                        const pruebaInfo =
                          montage.condicionesIniciales?.pruebas?.[prueba];
                        const productInfo = {
                          nombre:
                            pruebaInfo?.producto ||
                            montage.productos?.[index] ||
                            "Sin producto",
                          dosis: pruebaInfo?.dosis || "Sin dosis",
                          unidades: pruebaInfo?.unidades || "Sin unidades",
                        };
                        return (
                          <th
                            key={prueba}
                            className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[150px]"
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-700">
                                {(() => {
                                  // Obtener todas las OTs únicas del montaje
                                  const otsUnicas = montage.ot.includes(", ")
                                    ? montage.ot.split(", ")
                                    : [montage.ot];

                                  // Si hay solo una OT única, mostrar formato actual
                                  if (otsUnicas.length === 1) {
                                    return `Prueba: ${prueba}`;
                                  }

                                  // Si hay múltiples OTs, mostrar formato "numeroOT-numeroPrueba"
                                  const otDePrueba =
                                    montage.pruebaToOT[prueba] || "Sin OT";
                                  return `Prueba: ${otDePrueba}-${prueba}`;
                                })()}
                              </div>
                              <div className="text-xs text-gray-700 font-medium">
                                {montage.finca}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                {montage.especie}
                              </div>
                              <div className="text-xs text-gray-800 font-semibold">
                                {productInfo.nombre}
                              </div>
                              <div className="text-xs text-purple-600 font-medium">
                                {productInfo.dosis}{" "}
                                {productInfo.unidades
                                  ? productInfo.unidades.toLowerCase()
                                  : ""}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(
                      { length: montage.numeroRepeticiones },
                      (_, index) => {
                        const testigoValues = showInitial
                          ? montage.condicionesIniciales?.testigo || []
                          : getTestigoResults();

                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                              <div className="text-sm font-medium text-gray-900">
                                Réplica {index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap border-r border-gray-200">
                              {showInitial ? (
                                <div className="flex justify-center">
                                  <div className="w-16 text-center bg-green-50 border border-green-200 rounded px-3 py-1 text-sm font-medium text-green-800">
                                    {testigoValues[index] || 0}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Input
                                    type="number"
                                    value={testigoValues[index] || ""}
                                    onChange={(e) =>
                                      handleTestigoChange(
                                        index,
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    step="0.1"
                                    placeholder="0.0"
                                  />
                                </div>
                              )}
                            </td>
                            {montage.pruebas.map((prueba) => {
                              const pruebaResults = showInitial
                                ? montage.condicionesIniciales?.pruebas?.[
                                    prueba
                                  ]?.numeroIndividuos || []
                                : getResultsForPrueba(prueba);

                              return (
                                <td
                                  key={prueba}
                                  className="px-4 py-1 whitespace-nowrap border-r border-gray-200 last:border-r-0"
                                >
                                  {showInitial ? (
                                    <div className="flex justify-center items-center">
                                      <div className="w-16 h-8 text-center bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm font-medium text-blue-800 flex items-center justify-center ">
                                        {pruebaResults[index] || 0}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <Input
                                        type="number"
                                        value={pruebaResults[index] || ""}
                                        onChange={(e) =>
                                          handleResultChange(
                                            prueba,
                                            index,
                                            Number.parseFloat(e.target.value) ||
                                              0
                                          )
                                        }
                                        onWheel={(e) => e.currentTarget.blur()}
                                        className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        step="0.1"
                                        placeholder="0.0"
                                      />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      }
                    )}
                    {/* Fila de promedios */}
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                        <div className="text-sm font-semibold text-blue-900">
                          Promedio
                        </div>
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 bg-gray-100">
                        <div className="text-center font-semibold text-gray-700">
                          {showInitial
                            ? calculateAverage(
                                montage.condicionesIniciales?.testigo || []
                              )
                            : calculateTestigoAverage()}
                        </div>
                      </td>
                      {montage.pruebas.map((prueba) => {
                        const pruebaResults = showInitial
                          ? montage.condicionesIniciales?.pruebas?.[prueba]
                              ?.numeroIndividuos || []
                          : getResultsForPrueba(prueba);

                        return (
                          <td
                            key={prueba}
                            className="px-4 py-2 border-r border-gray-200"
                          >
                            <div className="text-center font-semibold text-gray-700">
                              {calculateAverage(pruebaResults)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila de fotos - Solo para lecturas, no para condiciones iniciales */}
                    {!showInitial && (
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                          <div className="text-sm font-semibold text-green-900">
                            Fotos
                          </div>
                        </td>
                        {/* Foto para testigo */}
                        <td className="px-4 py-2 border-r border-gray-200 bg-gray-100">
                          <div className="flex flex-col items-center gap-2">
                            {getPhotoForPrueba(
                              currentLecturaName,
                              "testigo"
                            ) ? (
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(
                                    getPhotoForPrueba(
                                      currentLecturaName,
                                      "testigo"
                                    )!
                                  )}
                                  alt="Foto testigo"
                                  className="w-32 h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    openPhotoModal(
                                      getPhotoForPrueba(
                                        currentLecturaName,
                                        "testigo"
                                      )!,
                                      "testigo"
                                    )
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePhotoUpload(
                                      currentLecturaName,
                                      "testigo",
                                      null
                                    );
                                  }}
                                  className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white border-0"
                                >
                                  ×
                                </Button>
                              </div>
                            ) : (
                              <Label
                                htmlFor={`photo-testigo-${currentLecturaName}`}
                                className="cursor-pointer"
                              >
                                <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400 transition-colors">
                                  <Camera className="h-5 w-5 text-gray-400" />
                                </div>
                              </Label>
                            )}
                            <Input
                              id={`photo-testigo-${currentLecturaName}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                handlePhotoUpload(
                                  currentLecturaName,
                                  "testigo",
                                  file
                                );
                              }}
                            />
                          </div>
                        </td>
                        {/* Fotos para cada prueba */}
                        {montage.pruebas.map((prueba, index) => {
                          // Obtener información del producto para cada prueba
                          const pruebaInfo =
                            montage.condicionesIniciales?.pruebas?.[prueba];
                          const productInfo = {
                            nombre:
                              pruebaInfo?.producto ||
                              montage.productos?.[index] ||
                              "Sin producto",
                            dosis: pruebaInfo?.dosis || "Sin dosis",
                            unidades: pruebaInfo?.unidades || "Sin unidades",
                          };

                          return (
                            <td
                              key={prueba}
                              className="px-4 py-2 border-r border-gray-200"
                            >
                              <div className="flex flex-col items-center gap-2">
                                {getPhotoForPrueba(
                                  currentLecturaName,
                                  prueba
                                ) ? (
                                  <div className="relative">
                                    <img
                                      src={URL.createObjectURL(
                                        getPhotoForPrueba(
                                          currentLecturaName,
                                          prueba
                                        )!
                                      )}
                                      alt={`Foto prueba ${prueba}`}
                                      className="w-32 h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() =>
                                        openPhotoModal(
                                          getPhotoForPrueba(
                                            currentLecturaName,
                                            prueba
                                          )!,
                                          prueba,
                                          productInfo
                                        )
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePhotoUpload(
                                          currentLecturaName,
                                          prueba,
                                          null
                                        );
                                      }}
                                      className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white border-0"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ) : (
                                  <Label
                                    htmlFor={`photo-${prueba}-${currentLecturaName}`}
                                    className="cursor-pointer"
                                  >
                                    <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400 transition-colors">
                                      <Camera className="h-5 w-5 text-gray-400" />
                                    </div>
                                  </Label>
                                )}
                                <Input
                                  id={`photo-${prueba}-${currentLecturaName}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handlePhotoUpload(
                                      currentLecturaName,
                                      prueba,
                                      file
                                    );
                                  }}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón para guardar lectura - Solo para lecturas, no para condiciones iniciales */}
            {!showInitial && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-center">
                  <Button
                    onClick={handleSaveLectura}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3"
                  >
                    <Save className="h-5 w-5" />
                    {loading ? "Guardando..." : "Guardar Lectura"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de foto ampliada con zoom */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={closePhotoModal}
          >
            <div className="relative w-full h-full flex flex-col">
              {/* Header del modal de foto */}
              <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{selectedPhoto.title}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomOut();
                        }}
                        className="bg-white bg-opacity-20 text-white border-white border-opacity-50 hover:bg-opacity-30"
                      >
                        -
                      </Button>
                      <span className="text-sm min-w-[4rem] text-center">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleZoomIn();
                        }}
                        className="bg-white bg-opacity-20 text-white border-white border-opacity-50 hover:bg-opacity-30"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={closePhotoModal}
                      className="bg-white bg-opacity-20 text-white border-white border-opacity-50 hover:bg-opacity-30"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenedor de la imagen */}
              <div
                className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  src={URL.createObjectURL(selectedPhoto.file)}
                  alt={selectedPhoto.title}
                  className="max-w-none select-none"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${
                      panOffset.x / zoomLevel
                    }px, ${panOffset.y / zoomLevel}px)`,
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                    cursor:
                      zoomLevel > 1
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                  draggable={false}
                />
              </div>

              {/* Footer con instrucciones */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center">
                <div className="text-sm opacity-75">
                  Scroll para zoom • Arrastra para desplazar • Click fuera para
                  cerrar
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
