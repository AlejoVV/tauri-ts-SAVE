import type React from "react";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type {
  EfficacyTestData,
  MontageData,
  CondicionesIniciales,
} from "../tipos/index";
import { getNumeroRepeticionesPorObjetivo } from "../servicios/index";

interface MontageSetupFormProps {
  selectedTests: EfficacyTestData[];
  onMontageCreated: (montageData: MontageData) => void;
  onBack: () => void;
  isCreatingMontage?: boolean;
}

export function MontageSetupForm({
  selectedTests,
  onMontageCreated,
  onBack,
  isCreatingMontage = false,
}: MontageSetupFormProps) {
  // Inicializar condiciones iniciales
  const initializeCondicionesIniciales = (
    numeroRepeticiones: number
  ): CondicionesIniciales => {
    const testigo = Array(numeroRepeticiones).fill(0);
    const pruebas: { [key: string]: any } = {};

    selectedTests.forEach((test) => {
      const pruebaKey = `${test.id}`;
      pruebas[pruebaKey] = {
        numeroIndividuos: Array(numeroRepeticiones).fill(0),
        producto: test.producto,
        dosis: test.dosis,
        unidades: test.unidades,
      };
    });

    return { testigo, pruebas };
  };

  const [formData, setFormData] = useState<MontageData>({
    numeroMontaje: `M-${Date.now()}`,
    nombreMontaje: "",
    numeroLecturas: 1,
    nombresLecturas: ["Lectura 1"],
    numeroRepeticiones: 3,
    condicionesIniciales: initializeCondicionesIniciales(3),
  });

  // Función para ajustar condiciones iniciales preservando valores existentes
  const adjustCondicionesIniciales = (
    currentCondiciones: CondicionesIniciales,
    newNumeroRepeticiones: number
  ): CondicionesIniciales => {
    // Ajustar testigo preservando valores existentes
    const newTestigo = Array(newNumeroRepeticiones).fill(0);
    for (
      let i = 0;
      i < Math.min(currentCondiciones.testigo.length, newNumeroRepeticiones);
      i++
    ) {
      newTestigo[i] = currentCondiciones.testigo[i];
    }

    // Ajustar pruebas preservando valores existentes
    const newPruebas: { [key: string]: any } = {};
    selectedTests.forEach((test) => {
      const pruebaKey = `${test.id}`;
      const currentPrueba = currentCondiciones.pruebas[pruebaKey];

      const newNumeroIndividuos = Array(newNumeroRepeticiones).fill(0);
      if (currentPrueba && currentPrueba.numeroIndividuos) {
        for (
          let i = 0;
          i <
          Math.min(
            currentPrueba.numeroIndividuos.length,
            newNumeroRepeticiones
          );
          i++
        ) {
          newNumeroIndividuos[i] = currentPrueba.numeroIndividuos[i];
        }
      }

      newPruebas[pruebaKey] = {
        numeroIndividuos: newNumeroIndividuos,
        producto: test.producto,
        dosis: test.dosis,
        unidades: test.unidades,
      };
    });

    return { testigo: newTestigo, pruebas: newPruebas };
  };

  // Actualizar condiciones iniciales y número de repeticiones según el objetivo de la primera prueba seleccionada
  useEffect(() => {
    const setRepeticionesPorObjetivo = async () => {
      if (selectedTests.length > 0) {
        const objetivo = selectedTests[0].objetivo;
        const repeticiones = await getNumeroRepeticionesPorObjetivo(objetivo);
        setFormData((prev) => ({
          ...prev,
          numeroRepeticiones: repeticiones,
          condicionesIniciales: adjustCondicionesIniciales(
            prev.condicionesIniciales,
            repeticiones
          ),
        }));
      }
    };
    setRepeticionesPorObjetivo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTests]);

  const handleNumeroLecturasChange = (value: number) => {
    const newNombresLecturas = Array.from(
      { length: value },
      (_, i) => formData.nombresLecturas[i] || `Lectura ${i + 1}`
    );

    setFormData({
      ...formData,
      numeroLecturas: value,
      nombresLecturas: newNombresLecturas,
    });
  };

  const handleNombreLecturaChange = (index: number, value: string) => {
    const newNombresLecturas = [...formData.nombresLecturas];
    newNombresLecturas[index] = value;
    setFormData({
      ...formData,
      nombresLecturas: newNombresLecturas,
    });
  };

  const handleNumeroRepeticionesChange = (value: string) => {
    const numValue = Number.parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      numeroRepeticiones: numValue,
      condicionesIniciales:
        numValue > 0
          ? adjustCondicionesIniciales(prev.condicionesIniciales, numValue)
          : { testigo: [], pruebas: {} },
    }));
  };

  // Manejar cambios en la matriz de condiciones iniciales
  const handleTestigoChange = (replicaIndex: number, value: number) => {
    const newCondiciones = { ...formData.condicionesIniciales };
    newCondiciones.testigo[replicaIndex] = value;
    setFormData({
      ...formData,
      condicionesIniciales: newCondiciones,
    });
  };

  const handlePruebaChange = (
    pruebaId: string,
    replicaIndex: number,
    value: number
  ) => {
    const newCondiciones = { ...formData.condicionesIniciales };
    newCondiciones.pruebas[pruebaId].numeroIndividuos[replicaIndex] = value;
    setFormData({
      ...formData,
      condicionesIniciales: newCondiciones,
    });
  };

  // Calcular promedio
  const calculateAverage = (values: number[]) => {
    const validValues = values.filter((val) => val > 0);
    if (validValues.length === 0) return "-";
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const average = sum / validValues.length;
    // Mostrar hasta 2 decimales, pero remover zeros innecesarios
    return Number(average.toFixed(2)).toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMontageCreated(formData);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de pruebas seleccionadas */}
      <Card>
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">Pruebas Seleccionadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información de control del montaje */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Orden de Trabajo:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {selectedTests[0]?.ot}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Objetivo:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {selectedTests[0]?.objetivo}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Especie Vegetal:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {selectedTests[0]?.especieVegetal}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de pruebas compacta */}
          <div>
            <span className="text-sm font-medium text-gray-700">
              {selectedTests.length} prueba(s):
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTests.map((test) => (
                <Badge key={test.id} variant="secondary" className="text-xs">
                  {test.prueba} - {test.producto}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de configuración del montaje */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-montaje">Número de Montaje</Label>
                <Input
                  id="numero-montaje"
                  value={formData.numeroMontaje}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroMontaje: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre-montaje">Nombre del Montaje</Label>
                <Input
                  id="nombre-montaje"
                  value={formData.nombreMontaje}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreMontaje: e.target.value })
                  }
                  placeholder="Ej: Montaje Control Plagas Tomate"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-lecturas">Número de Lecturas</Label>
                <Input
                  id="numero-lecturas"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numeroLecturas}
                  onChange={(e) =>
                    handleNumeroLecturasChange(Number.parseInt(e.target.value))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-repeticiones">
                  Número de Repeticiones
                </Label>
                <Input
                  id="numero-repeticiones"
                  type="number"
                  min="0"
                  value={
                    formData.numeroRepeticiones === 0
                      ? ""
                      : formData.numeroRepeticiones
                  }
                  onChange={(e) =>
                    handleNumeroRepeticionesChange(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Configuración de nombres de lecturas */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Nombres de las Lecturas
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.nombresLecturas.map((nombre, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`lectura-${index}`}>
                      Lectura {index + 1}
                    </Label>
                    <Input
                      id={`lectura-${index}`}
                      value={nombre}
                      onChange={(e) =>
                        handleNombreLecturaChange(index, e.target.value)
                      }
                      placeholder={`Nombre de la lectura ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Condiciones Iniciales - Matriz */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Condiciones Iniciales por Repetición
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Ingrese el número inicial de individuos para cada réplica
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full border border-gray-200 rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                          Réplica
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-100">
                          Testigo
                        </th>
                        {selectedTests.map((test) => (
                          <th
                            key={test.id}
                            className="px-4 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[120px]"
                          >
                            <div className="space-y-1">
                              <div className="font-semibold">{test.prueba}</div>
                              <div className="text-xs text-gray-600">
                                {test.producto}
                              </div>
                              <div className="text-xs text-blue-600">
                                {test.dosis} {test.unidades}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {/* Filas de réplicas */}
                      {Array.from(
                        { length: formData.numeroRepeticiones },
                        (_, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 bg-green-50">
                              Réplica {index + 1}
                            </td>
                            {/* Columna Testigo */}
                            <td className="px-4 py-2 border-r border-gray-200 bg-gray-50 text-center">
                              <div className="flex justify-center">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={
                                    formData.condicionesIniciales.testigo[
                                      index
                                    ] === 0
                                      ? ""
                                      : formData.condicionesIniciales.testigo[
                                          index
                                        ] || ""
                                  }
                                  onChange={(e) =>
                                    handleTestigoChange(
                                      index,
                                      Number.parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </td>
                            {/* Columnas de pruebas */}
                            {selectedTests.map((test) => (
                              <td
                                key={test.id}
                                className="px-4 py-2 border-r border-gray-200 text-center"
                              >
                                <div className="flex justify-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={
                                      formData.condicionesIniciales.pruebas[
                                        test.id
                                      ]?.numeroIndividuos[index] === 0
                                        ? ""
                                        : formData.condicionesIniciales.pruebas[
                                            test.id
                                          ]?.numeroIndividuos[index] || ""
                                    }
                                    onChange={(e) =>
                                      handlePruebaChange(
                                        test.id.toString(),
                                        index,
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        )
                      )}

                      {/* Fila de promedios */}
                      <tr className="border-t-2 border-gray-300 bg-blue-50">
                        <td className="px-4 py-2 text-sm font-bold text-gray-900 border-r border-gray-200">
                          Promedio
                        </td>
                        <td className="px-4 py-2 border-r border-gray-200 bg-gray-100">
                          <div className="text-center font-semibold text-gray-700">
                            {calculateAverage(
                              formData.condicionesIniciales.testigo
                            )}
                          </div>
                        </td>
                        {selectedTests.map((test) => (
                          <td
                            key={test.id}
                            className="px-4 py-2 border-r border-gray-200"
                          >
                            <div className="text-center font-semibold text-gray-700">
                              {calculateAverage(
                                formData.condicionesIniciales.pruebas[test.id]
                                  ?.numeroIndividuos || []
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Volver a Selección
              </Button>
              <Button type="submit" disabled={isCreatingMontage}>
                {isCreatingMontage ? "Creando Montaje..." : "Crear Montaje"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
