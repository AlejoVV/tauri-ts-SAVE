import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Calculator, TrendingUp } from "lucide-react";
import type { EfficacyTestData, MontageData } from "../tipos/index";

interface EfficacyData {
  montageData: MontageData;
  selectedTests: EfficacyTestData[];
  selectedLecturas: string[];
  calculationMethod: string;
  results: Array<{
    test: EfficacyTestData;
    averages: number[];
    efficacy: number;
    reduction: number;
  }>;
}

interface EfficacyCalculationProps {
  selectedTests: EfficacyTestData[];
  montageData: MontageData;
  onCalculationComplete: (efficacyData: EfficacyData) => void;
  onBack: () => void;
}

// Datos simulados de resultados guardados
const mockResults = {
  "1": {
    "Lectura 1": [10, 12, 11],
    "Lectura 2": [8, 9, 7],
    "Lectura 3": [5, 6, 4],
  },
  "2": {
    "Lectura 1": [15, 14, 16],
    "Lectura 2": [12, 11, 13],
    "Lectura 3": [8, 9, 7],
  },
  "4": {
    "Lectura 1": [20, 18, 19],
    "Lectura 2": [18, 17, 16],
    "Lectura 3": [15, 14, 16],
  },
};

export function EfficacyCalculation({
  selectedTests,
  montageData,
  onCalculationComplete,
  onBack,
}: EfficacyCalculationProps) {
  const [selectedLecturas, setSelectedLecturas] = useState<string[]>([]);
  const [calculationMethod, setCalculationMethod] = useState<string>("");
  const [efficacyResults, setEfficacyResults] = useState<any>(null);

  const handleLecturaToggle = (lectura: string, checked: boolean) => {
    if (checked) {
      setSelectedLecturas((prev) => [...prev, lectura]);
    } else {
      setSelectedLecturas((prev) => prev.filter((l) => l !== lectura));
    }
  };

  const calculateEfficacy = () => {
    if (selectedLecturas.length === 0 || !calculationMethod) {
      alert("Seleccione al menos una lectura y un método de cálculo");
      return;
    }

    // Cálculo de eficacia simulado
    const results = selectedTests.map((test) => {
      const testResults =
        mockResults[test.id.toString() as keyof typeof mockResults];

      // Calcular promedios para las lecturas seleccionadas
      const averages = selectedLecturas.map((lectura) => {
        const values = testResults?.[lectura as keyof typeof testResults] || [];
        return (
          values.reduce((sum: number, val: number) => sum + val, 0) /
          values.length
        );
      });

      // Cálculo de eficacia (fórmula simplificada)
      const initialValue = averages[0] || 0;
      const finalValue = averages[averages.length - 1] || 0;
      const efficacy = ((initialValue - finalValue) / initialValue) * 100;

      return {
        test,
        averages,
        efficacy: Math.max(0, efficacy), // No permitir eficacia negativa
        reduction: initialValue - finalValue,
      };
    });

    setEfficacyResults(results);
  };

  const handleContinue = () => {
    if (efficacyResults) {
      onCalculationComplete({
        montageData,
        selectedTests,
        selectedLecturas,
        calculationMethod,
        results: efficacyResults,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            Cálculo de Eficacia - {montageData.nombreMontaje}
          </CardTitle>
          <CardDescription>
            Montaje: {montageData.nombreMontaje} | Seleccione las lecturas y
            método para calcular la eficacia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedTests.map((test) => (
              <Badge key={test.id} variant="secondary">
                {test.ot}-{test.prueba} - {test.producto}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selección de lecturas */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Lecturas</CardTitle>
          <CardDescription>
            Seleccione las lecturas que desea incluir en el cálculo de eficacia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {montageData.nombresLecturas.map((lectura, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`lectura-${index}`}
                  checked={selectedLecturas.includes(lectura)}
                  onCheckedChange={(checked) =>
                    handleLecturaToggle(lectura, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`lectura-${index}`}
                  className="text-sm font-medium"
                >
                  {lectura}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Método de cálculo */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Cálculo</CardTitle>
          <CardDescription>
            Seleccione el método para calcular la eficacia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Método de Cálculo</Label>
            <Select
              value={calculationMethod}
              onValueChange={setCalculationMethod}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abbott">Fórmula de Abbott</SelectItem>
                <SelectItem value="henderson-tilton">
                  Henderson-Tilton
                </SelectItem>
                <SelectItem value="porcentaje-reduccion">
                  Porcentaje de Reducción
                </SelectItem>
                <SelectItem value="mortalidad-corregida">
                  Mortalidad Corregida
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Botón de cálculo */}
      <div className="flex justify-center">
        <Button
          onClick={calculateEfficacy}
          disabled={selectedLecturas.length === 0 || !calculationMethod}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Calcular Eficacia
        </Button>
      </div>

      {/* Resultados de eficacia */}
      {efficacyResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultados de Eficacia
            </CardTitle>
            <CardDescription>
              Método utilizado: {calculationMethod} | Lecturas:{" "}
              {selectedLecturas.join(", ")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left">
                      Prueba
                    </th>
                    <th className="border border-gray-300 p-3 text-left">
                      Producto
                    </th>
                    {selectedLecturas.map((lectura, index) => (
                      <th
                        key={index}
                        className="border border-gray-300 p-3 text-center"
                      >
                        {lectura}
                      </th>
                    ))}
                    <th className="border border-gray-300 p-3 text-center">
                      Reducción
                    </th>
                    <th className="border border-gray-300 p-3 text-center">
                      Eficacia (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {efficacyResults.map((result: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-3">
                        {result.test.prueba}
                      </td>
                      <td className="border border-gray-300 p-3">
                        {result.test.producto}
                      </td>
                      {result.averages.map((avg: number, avgIndex: number) => (
                        <td
                          key={avgIndex}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {avg.toFixed(2)}
                        </td>
                      ))}
                      <td className="border border-gray-300 p-3 text-center">
                        {result.reduction.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center font-bold">
                        <span
                          className={
                            result.efficacy >= 80
                              ? "text-green-600"
                              : result.efficacy >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {result.efficacy.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Volver a Resultados
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver a Configuración
          </Button>
        </div>
        <Button onClick={handleContinue} disabled={!efficacyResults}>
          Continuar a Informe
        </Button>
      </div>
    </div>
  );
}
