import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save, Eye, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EfficacyTestData, MontageData } from "../tipos/index";

interface ResultsEntryFormProps {
  selectedTests: EfficacyTestData[];
  montageData: MontageData;
  onResultsSaved: () => void;
  onBack: () => void;
}

export function ResultsEntryForm({
  selectedTests,
  montageData,
  onResultsSaved,
  onBack,
}: ResultsEntryFormProps) {
  const [currentLectura, setCurrentLectura] = useState(0);
  const [results, setResults] = useState<
    Record<string, Record<string, number[]>>
  >({});
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [savedLecturas, setSavedLecturas] = useState<Set<number>>(new Set());

  // Inicializar resultados si no existen
  const initializeResults = () => {
    const newResults: Record<string, Record<string, number[]>> = {};
    selectedTests.forEach((test) => {
      newResults[test.id] = {};
      montageData.nombresLecturas.forEach((lectura) => {
        newResults[test.id][lectura] = Array(
          montageData.numeroRepeticiones
        ).fill(0);
      });
    });
    return newResults;
  };

  const getResults = () => {
    if (Object.keys(results).length === 0) {
      const initialized = initializeResults();
      setResults(initialized);
      return initialized;
    }
    return results;
  };

  const handleResultChange = (
    testId: number,
    lecturaName: string,
    repeticionIndex: number,
    value: number
  ) => {
    const currentResults = getResults();
    const newResults = { ...currentResults };
    if (!newResults[testId]) newResults[testId] = {};
    if (!newResults[testId][lecturaName])
      newResults[testId][lecturaName] = Array(
        montageData.numeroRepeticiones
      ).fill(0);

    newResults[testId][lecturaName][repeticionIndex] = value;
    setResults(newResults);
  };

  const handlePhotoUpload = (lecturaIndex: number, file: File) => {
    setPhotos((prev) => ({
      ...prev,
      [lecturaIndex]: file,
    }));
  };

  const handleSaveLectura = async () => {
    // Aquí se guardarían los datos en Supabase
    // Incluyendo la subida de la foto si existe

    const lecturaName = montageData.nombresLecturas[currentLectura];
    console.log("Guardando lectura:", lecturaName);
    console.log("Resultados:", results);
    console.log("Foto:", photos[currentLectura]);

    // Simular guardado
    setSavedLecturas((prev) => new Set([...prev, currentLectura]));

    // Mostrar mensaje de éxito
    alert(`Lectura "${lecturaName}" guardada exitosamente`);
  };

  const currentResults = getResults();
  const currentLecturaName = montageData.nombresLecturas[currentLectura];
  const isCurrentLecturaSaved = savedLecturas.has(currentLectura);

  return (
    <div className="space-y-6">
      {/* Header con información del montaje */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registro de Resultados - {montageData.nombreMontaje}
          </CardTitle>
          <CardDescription>
            Montaje: {montageData.nombreMontaje} | OT: {selectedTests[0]?.ot} |
            Objetivo: {selectedTests[0]?.objetivo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedTests.map((test) => (
              <Badge key={test.id} variant="secondary">
                {test.prueba} - {test.producto}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para cada lectura */}
      <Card>
        <CardHeader>
          <CardTitle>Lecturas del Montaje</CardTitle>
          <CardDescription>
            Seleccione la lectura para ingresar los resultados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={currentLectura.toString()}
            onValueChange={(value) => setCurrentLectura(Number.parseInt(value))}
          >
            <TabsList className="grid w-full grid-cols-auto">
              {montageData.nombresLecturas.map((lectura, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="relative"
                >
                  {lectura}
                  {savedLecturas.has(index) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {montageData.nombresLecturas.map((lectura, lecturaIndex) => (
              <TabsContent
                key={lecturaIndex}
                value={lecturaIndex.toString()}
                className="space-y-6"
              >
                {isCurrentLecturaSaved && (
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      Esta lectura ya ha sido guardada. Puede modificar los
                      valores y guardar nuevamente.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tabla de resultados */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">
                    Resultados - {lectura}
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">
                            Prueba
                          </th>
                          <th className="border border-gray-300 p-2 text-left">
                            Producto
                          </th>
                          {Array.from(
                            { length: montageData.numeroRepeticiones },
                            (_, i) => (
                              <th
                                key={i}
                                className="border border-gray-300 p-2 text-center"
                              >
                                Rep. {i + 1}
                              </th>
                            )
                          )}
                          <th className="border border-gray-300 p-2 text-center">
                            Promedio
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTests.map((test) => {
                          const testResults =
                            currentResults[test.id]?.[lectura] ||
                            Array(montageData.numeroRepeticiones).fill(0);
                          const promedio =
                            testResults.reduce((sum, val) => sum + val, 0) /
                            testResults.length;

                          return (
                            <tr key={test.id}>
                              <td className="border border-gray-300 p-2">
                                {test.prueba}
                              </td>
                              <td className="border border-gray-300 p-2">
                                {test.producto}
                              </td>
                              {testResults.map((value, repIndex) => (
                                <td
                                  key={repIndex}
                                  className="border border-gray-300 p-1"
                                >
                                  <Input
                                    type="number"
                                    value={value}
                                    onChange={(e) =>
                                      handleResultChange(
                                        test.id,
                                        lectura,
                                        repIndex,
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full text-center"
                                    step="0.01"
                                  />
                                </td>
                              ))}
                              <td className="border border-gray-300 p-2 text-center font-medium">
                                {promedio.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subida de foto */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Foto de la Lectura</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label
                          htmlFor={`photo-${lecturaIndex}`}
                          className="cursor-pointer"
                        >
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {photos[lecturaIndex]
                              ? photos[lecturaIndex]?.name
                              : "Subir foto de la lectura"}
                          </span>
                        </Label>
                        <Input
                          id={`photo-${lecturaIndex}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(lecturaIndex, file);
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG hasta 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón para guardar lectura */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveLectura}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar Lectura
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Volver a Configuración
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onResultsSaved}
            className="flex items-center gap-2 bg-transparent"
          >
            <Calculator className="h-4 w-4" />
            Ir a Cálculo de Eficacia
          </Button>
          <Button
            onClick={onResultsSaved}
            disabled={savedLecturas.size === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar y Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
