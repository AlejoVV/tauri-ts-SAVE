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
import { Calculator, TrendingUp } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";
import {
  getLecturaResultados,
  getMetodoCalculoPorObjetivo,
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
  const [lecturaPromedios, setLecturaPromedios] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [formula, setFormula] = useState("");

  // Cargar datos reales al abrir el modal
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fetchData = async () => {
      // Obtener método de cálculo recomendado
      const metodo = await getMetodoCalculoPorObjetivo(montage.objetivo);
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
      // Calcular reducción y eficacia por prueba
      const eficacia: { [pruebaId: string]: number } = {};
      montage.pruebas.forEach((pruebaId: string) => {
        const inicial = Number(promedios[pruebaId][0]);
        const final = Number(
          promedios[pruebaId][promedios[pruebaId].length - 1]
        );
        const testigoInicial = Number(promedios["testigo"][0]);
        const testigoFinal = Number(
          promedios["testigo"][promedios["testigo"].length - 1]
        );
        let valor = 0;
        if (metodo.toLowerCase().includes("abbott")) {
          valor =
            testigoFinal !== 0
              ? ((testigoFinal - final) / testigoFinal) * 100
              : 0;
        } else if (metodo.toLowerCase().includes("henderson")) {
          valor =
            (1 - (testigoFinal * inicial) / (testigoInicial * final)) * 100;
        } else {
          valor = inicial - final;
        }
        eficacia[pruebaId] = Number.isFinite(valor)
          ? Number(valor.toFixed(2))
          : 0;
      });
      setEfficacyResults(eficacia);
      setLoading(false);
    };
    fetchData();
  }, [open, montage]);

  // Handler para editar eficacia manualmente
  const handleEfficacyEdit = (pruebaId: string, value: string) => {
    setEfficacyResults((prev) => ({ ...prev, [pruebaId]: Number(value) }));
  };

  // Handler para guardar
  const handleComplete = () => {
    // Aquí guardarías efficacyResults
    onCalculationComplete();
  };

  // Encabezados de columnas
  const columns = [
    {
      key: "testigo",
      label: "Testigo",
      producto: "",
      dosis: "",
      unidades: "",
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
      return {
        key: pruebaId,
        label: `Prueba ${pruebaId}`,
        producto: montage.productos[idx] || "",
        dosis,
        unidades,
      };
    }),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Cálculo de Eficacia - {montage.nombreMontaje}
          </DialogTitle>
          <DialogDescription>
            Montaje: {montage.nombreMontaje} | Objetivo: {montage.objetivo} |
            Método: {calculationMethod}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Cargando datos...</div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-100">
                      Lectura
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-100 min-w-[180px] whitespace-normal break-words"
                        style={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                        }}
                      >
                        <div className="font-semibold">{col.label}</div>
                        {col.key !== "testigo" && (
                          <>
                            <div className="text-xs font-bold text-gray-800">
                              {col.producto}
                            </div>
                            {(col.dosis || col.unidades) && (
                              <div className="text-xs text-gray-600">
                                {col.dosis} {col.unidades}
                              </div>
                            )}
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {selectedLecturas.map((lectura, idx) => (
                    <tr key={lectura} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 bg-green-50">
                        {lectura}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-2 border-r border-gray-200 text-center"
                        >
                          {lecturaPromedios[col.key] &&
                          lecturaPromedios[col.key][idx] !== undefined &&
                          lecturaPromedios[col.key][idx] !== null &&
                          lecturaPromedios[col.key][idx] !== ""
                            ? lecturaPromedios[col.key][idx]
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Fila de Eficacia */}
                  <tr className="border-t-2 border-gray-300 bg-yellow-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900 border-r border-gray-200">
                      Eficacia (%)
                    </td>
                    {columns.map((col) =>
                      col.key === "testigo" ? (
                        <td
                          key={col.key}
                          className="px-4 py-2 border-r border-gray-200 text-center text-gray-400"
                        >
                          -
                        </td>
                      ) : (
                        <td
                          key={col.key}
                          className="px-4 py-2 border-r border-gray-200 text-center"
                        >
                          <input
                            type="number"
                            value={efficacyResults[col.key] ?? ""}
                            onChange={(e) =>
                              handleEfficacyEdit(col.key, e.target.value)
                            }
                            className="w-20 text-center border border-gray-300 rounded"
                          />
                        </td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Fórmula aplicada: <span className="font-mono">{formula}</span>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleComplete}
                className="flex items-center gap-2"
              >
                Guardar resultado definitivo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
