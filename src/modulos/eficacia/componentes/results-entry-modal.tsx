import { useState } from "react";
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

interface ResultsEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  montage: MontageInProgress;
  onResultsSaved: () => void;
}

// Datos simulados
const mockLecturas = [
  "Lectura 1",
  "Lectura 2",
  "Lectura 3",
  "Lectura 4",
  "Lectura 5",
];
const mockProductInfo = {
  "1204": { dosis: "2.0", unidades: "cc/lt", nombre: "Fungicida A" },
  "1205": { dosis: "1.9", unidades: "g/lt", nombre: "Insecticida B" },
  "1206": { dosis: "2.5", unidades: "g/lt", nombre: "Herbicida C" },
  "1207": { dosis: "3.1", unidades: "cc/lt", nombre: "Pesticida D" },
};

const mockFarmInfo = {
  "OT-2024-001": { finca: "La Carmen", especie: "Rosa" },
  "OT-2024-002": { finca: "El Paraíso", especie: "Tomate" },
  "OT-2024-003": { finca: "San José", especie: "Papa" },
};

export function ResultsEntryModal({
  open,
  onOpenChange,
  montage,
  onResultsSaved,
}: ResultsEntryModalProps) {
  const [currentLectura, setCurrentLectura] = useState(0);
  const [results, setResults] = useState<Record<string, number[]>>({});
  const [testigoResults, setTestigoResults] = useState<number[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const lecturas = mockLecturas.slice(0, montage.numeroLecturas);
  const currentLecturaName = lecturas[currentLectura];
  const farmInfo = mockFarmInfo[montage.ot as keyof typeof mockFarmInfo] || {
    finca: "N/A",
    especie: "N/A",
  };

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
    const newTestigoResults = [...testigoResults];
    while (newTestigoResults.length < montage.numeroRepeticiones) {
      newTestigoResults.push(0);
    }
    newTestigoResults[repeticionIndex] = value;
    setTestigoResults(newTestigoResults);
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (files) {
      const newPhotos = Array.from(files);
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleSaveLectura = async () => {
    console.log("Guardando lectura:", currentLecturaName);
    console.log("Resultados:", results);
    console.log("Testigo:", testigoResults);
    console.log("Fotos:", photos);
    alert(`Lectura "${currentLecturaName}" guardada exitosamente`);
    onResultsSaved();
  };

  const getResultsForPrueba = (pruebaId: string) => {
    const key = `${pruebaId}-${currentLecturaName}`;
    return results[key] || Array(montage.numeroRepeticiones).fill(0);
  };

  const getTestigoResults = () => {
    return testigoResults.length > 0
      ? testigoResults
      : Array(montage.numeroRepeticiones).fill(0);
  };

  const calculateAverage = (values: number[]) => {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return values.length > 0 ? (sum / values.length).toFixed(1) : "0";
  };

  const calculateTestigoAverage = () => {
    const testigo = getTestigoResults();
    return calculateAverage(testigo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
        <div className="bg-white rounded-lg border-2 border-gray-200 p-8 space-y-8 shadow-lg">
          {/* Header con información del montaje */}
          <div className="space-y-1 pb-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">
              Registro de Resultados - {montage.nombreMontaje}
            </h1>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Montaje:</span>{" "}
              {montage.numeroMontaje} |{" "}
              <span className="font-semibold">OT:</span> {montage.ot} |{" "}
              <span className="font-semibold">Objetivo:</span>{" "}
              {montage.objetivo}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Especie vegetal:</span>{" "}
              {farmInfo.especie} | <span className="font-semibold">Finca:</span>{" "}
              {farmInfo.finca}
            </p>
          </div>

          {/* Botones de lecturas */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-300 shadow-sm">
            <div className="flex gap-3 flex-wrap">
              {lecturas.map((lectura, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => setCurrentLectura(index)}
                  className={`px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
                    currentLectura === index
                      ? "bg-amber-300 border-amber-400 text-amber-900 shadow-md"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {lectura}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de resultados */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-300 shadow-sm">
            <div className="flex gap-4">
              {/* Columna de réplicas */}
              <div className="flex flex-col gap-3 w-[120px]">
                {/* Header vacío para alineación */}
                <div className="h-[96px]"></div>{" "}
                {/* Adjusted height for alignment */}
                {/* Réplicas */}
                {Array.from(
                  { length: montage.numeroRepeticiones },
                  (_, index) => (
                    <div
                      key={index}
                      className="bg-emerald-500 text-white px-4 py-3 rounded-lg text-center font-semibold shadow-sm h-12 flex items-center justify-center w-24"
                    >
                      Replica {index + 1}
                    </div>
                  )
                )}
                {/* Promedio */}
                <div className="bg-blue-500 text-white px-4 py-3 rounded-lg text-center font-semibold shadow-sm h-12 flex items-center justify-center w-24">
                  Promedio
                </div>
              </div>

              {/* Columna Testigo */}
              <div className="flex flex-col gap-3">
                {/* Header del testigo */}
                <div className="bg-gray-200 border border-gray-300 rounded-lg p-4 text-center h-[96px] flex items-center justify-center shadow-sm w-24">
                  <div className="font-bold text-lg text-gray-800">Testigo</div>
                </div>
                {/* Inputs para cada réplica del testigo */}
                {Array.from(
                  { length: montage.numeroRepeticiones },
                  (_, repIndex) => {
                    const testigoValues = getTestigoResults();
                    return (
                      <Input
                        key={repIndex} // Moved key here
                        type="number"
                        value={testigoValues[repIndex] || ""}
                        onChange={(e) =>
                          handleTestigoChange(
                            repIndex,
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        className="text-center text-lg font-medium h-12 w-24 border border-gray-300 rounded-lg bg-white focus:border-emerald-400 focus:ring-emerald-200 shadow-sm"
                        step="0.1"
                        placeholder="0"
                      />
                    );
                  }
                )}
                {/* Campo de promedio del testigo */}
                <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center h-12 flex items-center justify-center shadow-sm w-24">
                  <div className="text-lg font-bold text-emerald-800">
                    {calculateTestigoAverage()}
                  </div>
                </div>
              </div>

              {/* Columnas de productos */}
              {montage.pruebas.slice(0, 3).map((prueba, pruebaIndex) => {
                const productInfo = mockProductInfo[
                  prueba as keyof typeof mockProductInfo
                ] || {
                  dosis: "N/A",
                  unidades: "N/A",
                  nombre: `producto ${pruebaIndex + 1}`,
                };
                const pruebaResults = getResultsForPrueba(prueba);

                return (
                  <div key={prueba} className="flex flex-col gap-3">
                    {/* Header del producto */}
                    <div className="bg-gray-200 border border-gray-300 rounded-lg p-3 text-center h-[96px] flex flex-col justify-center shadow-sm w-24">
                      <div className="font-bold text-base text-gray-900">
                        {prueba}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {productInfo.nombre}
                      </div>{" "}
                      {/* Changed text-sm to text-xs */}
                      <div className="text-sm font-semibold text-gray-800">
                        {productInfo.dosis}
                      </div>
                      <div className="text-[0.6rem] text-gray-600 leading-none">
                        {productInfo.unidades}
                      </div>{" "}
                      {/* Changed text-[0.65rem] to text-[0.6rem] */}
                    </div>
                    {/* Inputs para cada réplica */}
                    {Array.from(
                      { length: montage.numeroRepeticiones },
                      (_, repIndex) => (
                        <Input
                          key={repIndex} // Moved key here
                          type="number"
                          value={pruebaResults[repIndex] || ""}
                          onChange={(e) =>
                            handleResultChange(
                              prueba,
                              repIndex,
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          className="text-center text-lg font-medium h-12 w-24 border border-gray-300 rounded-lg bg-white focus:border-blue-400 focus:ring-blue-200 shadow-sm"
                          step="0.1"
                          placeholder="0"
                        />
                      )
                    )}
                    {/* Campo de promedio */}
                    <div className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-center h-12 flex items-center justify-center shadow-sm w-24">
                      <div className="text-lg font-bold text-emerald-800">
                        {calculateAverage(pruebaResults)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección de fotos y guardar */}
          <div className="grid grid-cols-4 gap-6">
            {/* Subir fotos */}
            <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
              <div className="text-center space-y-4">
                <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 hover:border-gray-500 transition-colors cursor-pointer">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Plus className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                    <div className="text-base font-semibold text-gray-700">
                      Subir fotos de la
                    </div>
                    <div className="text-base font-semibold text-gray-700">
                      lectura
                    </div>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                </div>
              </div>
            </div>

            {/* Fotos subidas */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {photos.slice(0, 2).map((photo, index) => (
                <div
                  key={index}
                  className="bg-gray-200 rounded-xl overflow-hidden border border-gray-300 shadow-sm"
                >
                  <div className="aspect-video flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(photo) || "/placeholder.svg"}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
              {photos.length === 0 && (
                <>
                  <div className="bg-gray-200 rounded-xl border border-gray-300 shadow-sm">
                    <div className="aspect-video flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-gray-200 rounded-xl border border-gray-300 shadow-sm">
                    <div className="aspect-video flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botón guardar */}
            <div className="flex items-center justify-center">
              <Button
                onClick={handleSaveLectura}
                className="bg-amber-400 hover:bg-amber-500 text-amber-900 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-amber-500 shadow-lg transition-all hover:shadow-xl"
              >
                <Save className="mr-2 h-5 w-5" />
                Guardar lectura
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
