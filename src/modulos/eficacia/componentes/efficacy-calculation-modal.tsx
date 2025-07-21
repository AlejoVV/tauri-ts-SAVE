import { useState } from "react";
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
import { Calculator, TrendingUp } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";

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
  const [efficacyResults, setEfficacyResults] = useState<any>(null);

  const lecturas = mockLecturas.slice(0, montage.numeroLecturas);

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
    const results = montage.pruebas.map((prueba, index) => {
      const testResults = mockResults[prueba as keyof typeof mockResults] || {};

      // Calcular promedios para las lecturas seleccionadas
      const averages = selectedLecturas.map((lectura) => {
        const values = testResults[lectura] || [];
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      });

      // Cálculo de eficacia (fórmula simplificada)
      const initialValue = averages[0] || 0;
      const finalValue = averages[averages.length - 1] || 0;
      const efficacy = ((initialValue - finalValue) / initialValue) * 100;

      return {
        prueba,
        producto: montage.productos[index],
        averages,
        efficacy: Math.max(0, efficacy),
        reduction: initialValue - finalValue,
      };
    });

    setEfficacyResults(results);
  };

  const handleComplete = () => {
    if (efficacyResults) {
      // Aquí se guardaría el cálculo en la base de datos
      console.log("Cálculo completado:", efficacyResults);
      alert("Cálculo de eficacia completado y guardado");
      onCalculationComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Cálculo de Eficacia - {montage.nombreMontaje}
          </DialogTitle>
          <DialogDescription>
            Montaje: {montage.numeroMontaje} | Seleccione las lecturas y método
            para calcular la eficacia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del montaje */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Pruebas del Montaje:</h4>
            <div className="flex flex-wrap gap-2">
              {montage.pruebas.map((prueba, index) => (
                <Badge key={prueba} variant="secondary">
                  {prueba} - {montage.productos[index]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Selección de lecturas */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Selección de Lecturas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lecturas.map((lectura, index) => (
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
          </div>

          {/* Método de cálculo */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Método de Cálculo</h4>
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
          </div>

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
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultados de Eficacia
              </h4>
              <p className="text-sm text-muted-foreground">
                Método utilizado: {calculationMethod} | Lecturas:{" "}
                {selectedLecturas.join(", ")}
              </p>

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
                          {result.prueba}
                        </td>
                        <td className="border border-gray-300 p-3">
                          {result.producto}
                        </td>
                        {result.averages.map(
                          (avg: number, avgIndex: number) => (
                            <td
                              key={avgIndex}
                              className="border border-gray-300 p-3 text-center"
                            >
                              {avg.toFixed(2)}
                            </td>
                          )
                        )}
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

              <div className="flex justify-end">
                <Button
                  onClick={handleComplete}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Completar Cálculo
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
