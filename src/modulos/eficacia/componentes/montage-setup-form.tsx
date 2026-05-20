import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, X } from "lucide-react";
import type {
  EfficacyTestData,
  MontageData,
  CondicionesIniciales,
  MontageInProgress,
} from "../tipos/index";
import {
  getNumeroRepeticionesPorObjetivo,
  getUnidadesPorRepeticionPorObjetivo,
  contarMontajesPorOT,
  updateMontajeSetup,
  getMontajeById,
  getCatalogoEficaciaPorObjetivo,
  getTiposEvaluacionPorObjetivos,
  getDuracionesPorObjetivos,
  getTiposInsumoPorObjetivos,
  getNombresCientificosPorObjetivos,
} from "../servicios/index";

const OPCIONES_TIEMPO = ["24h", "48h", "72h", "5 dias", "7 dias", "10 dias"];
const OPCIONES_TIPO_EVALUACION = [
  "por contacto e ingestión",
  "por contacto",
  "por ingestión",
];

interface MontageSetupFormProps {
  onMontageCreated: (montageData: MontageData) => void;
  onBack?: () => void; // Opcional - el modal se puede cerrar desde fuera
  montajeExistente: MontageInProgress; // Requerido - siempre configurando montajes existentes
}

// Componente MultiSelect personalizado para tiempo de lectura
interface MultiSelectTiempoProps {
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  options: string[];
}

function MultiSelectTiempo({
  selectedValues,
  onSelectionChange,
  options,
}: MultiSelectTiempoProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".multi-select-container")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Función para convertir tiempo a horas para ordenamiento
  const convertToHours = (timeStr: string): number => {
    const lowerStr = timeStr.toLowerCase();

    if (lowerStr.includes("h")) {
      const match = lowerStr.match(/(\d+)h/);
      return match ? parseInt(match[1]) : 0;
    }

    if (lowerStr.includes("dia")) {
      const match = lowerStr.match(/(\d+)\s*dia/);
      return match ? parseInt(match[1]) * 24 : 0;
    }

    return 0;
  };

  // Función para ordenar cronológicamente
  const sortTimeValues = (values: string[]): string[] => {
    return [...values].sort((a, b) => {
      const hoursA = convertToHours(a);
      const hoursB = convertToHours(b);
      return hoursA - hoursB;
    });
  };

  const toggleSelection = useCallback(
    (value: string) => {
      let newSelections;
      if (selectedValues.includes(value)) {
        newSelections = selectedValues.filter((item) => item !== value);
      } else {
        newSelections = [...selectedValues, value];
      }
      // Ordenar cronológicamente antes de enviar
      const sortedSelections = sortTimeValues(newSelections);
      onSelectionChange(sortedSelections);
    },
    [selectedValues, onSelectionChange]
  );

  const clearAll = useCallback(() => {
    onSelectionChange([]);
    setIsOpen(false);
  }, [onSelectionChange]);

  return (
    <div className="relative multi-select-container">
      <Button
        type="button"
        variant="outline"
        className="h-9 text-sm w-full justify-between font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedValues.length > 0
            ? selectedValues.join(" - ")
            : "Seleccione los tiempos"}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2">
            {options.map((opcion) => {
              const isSelected = selectedValues.includes(opcion);
              return (
                <div
                  key={opcion}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(opcion)}
                    className="h-4 w-4"
                  />
                  <label
                    className="text-sm cursor-pointer flex-1"
                    onClick={() => toggleSelection(opcion)}
                  >
                    {opcion}
                  </label>
                </div>
              );
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar selección
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MontageSetupForm({
  onMontageCreated,
  montajeExistente,
}: MontageSetupFormProps) {
  const [pruebasMontaje, setPruebasMontaje] = useState<EfficacyTestData[]>([]);
  const [isLoadingPruebas, setIsLoadingPruebas] = useState(true);

  // Cargar las pruebas del montaje existente y resetear estados
  useEffect(() => {
    const loadPruebasMontaje = async () => {
      try {
        // Primero resetear todos los estados
        setSobrescribirTodos(false);
        setValorSobrescribir(25);
        setValorEncontradoDB(null);

        setIsLoadingPruebas(true);
        const { pruebas } = await getMontajeById(parseInt(montajeExistente.id));

        // Mapear las pruebas al formato EfficacyTestData
        const pruebasFormateadas: EfficacyTestData[] = pruebas.map(
          (relacion) => ({
            id: relacion.prueba_id || 0,
            ot: (relacion as any).pruebas_ordenes_trabajo?.prueba_orden_id || 0,
            prueba: relacion.prueba_id || 0,
            finca:
              (relacion as any).pruebas_ordenes_trabajo?.fincas?.finca_nombre ||
              "Sin finca",
            objetivo:
              (relacion as any).pruebas_ordenes_trabajo?.objetivos
                ?.objetivo_nombre || "Sin objetivo",
            producto:
              (relacion as any).pruebas_ordenes_trabajo?.productos
                ?.producto_nombre || "Sin producto",
            especieVegetal:
              (relacion as any).pruebas_ordenes_trabajo?.especie_vegetal
                ?.especie_nombre || "Sin especie",
            fechaIngreso: "", // No disponible en esta consulta
            estado: "Montaje",
            dosis:
              (
                relacion as any
              ).pruebas_ordenes_trabajo?.prueba_dosis_producto?.toString() ||
              "0",
            unidades:
              (relacion as any).pruebas_ordenes_trabajo?.prueba_producto_unid ||
              "",
            contacto: "", // No disponible en esta consulta
          })
        );

        setPruebasMontaje(pruebasFormateadas);

        // Resetear formData con los datos del nuevo montaje
        const baseFormData = {
          nombreMontaje: montajeExistente.nombreMontaje,
          numeroLecturas: montajeExistente.nombresLecturas?.length || 0,
          nombresLecturas:
            montajeExistente.nombresLecturas.length > 0
              ? montajeExistente.nombresLecturas
              : [],
          numeroRepeticiones: montajeExistente.numeroRepeticiones || 3,
          condicionesIniciales: {
            testigo: [] as (number | null)[],
            pruebas: {},
          },
        };

        // Actualizar condiciones iniciales cuando se cargan las pruebas
        if (
          pruebasFormateadas.length > 0 &&
          baseFormData.numeroRepeticiones > 0
        ) {
          // Si el montaje tiene condiciones iniciales guardadas y válidas, usarlas
          if (
            montajeExistente.condicionesIniciales &&
            montajeExistente.condicionesIniciales.testigo &&
            Array.isArray(montajeExistente.condicionesIniciales.testigo) &&
            montajeExistente.condicionesIniciales.testigo.length > 0 &&
            montajeExistente.condicionesIniciales.testigo.some(
              (val) => val !== null && val !== undefined
            )
          ) {
            baseFormData.condicionesIniciales =
              montajeExistente.condicionesIniciales;
          } else {
            // Si no hay condiciones guardadas válidas, inicializar con valores null
            baseFormData.condicionesIniciales =
              initializeCondicionesInicialesWithPruebas(
                baseFormData.numeroRepeticiones,
                pruebasFormateadas
              );
          }
        }

        setFormData({
          ...baseFormData,
          variedad: "", // Include required variedad property
          tipoEvaluacion:
            montajeExistente.tipoEvaluacion || "por contacto e ingestión", // Cargar tipo de evaluación existente
          duracionPrueba: montajeExistente.duracionPrueba || "", // Cargar duración existente
          tipoInsumo: montajeExistente.tipoInsumo || "", // Cargar tipo de insumo existente
        });

        // Cargar tipos de evaluación dinámicos basados en los objetivos de las pruebas
        const objetivosUnicos = [
          ...new Set(pruebasFormateadas.map((prueba) => prueba.objetivo)),
        ];
        if (objetivosUnicos.length > 0) {
          const tiposEvaluacion = await getTiposEvaluacionPorObjetivos(
            objetivosUnicos
          );
          if (tiposEvaluacion.length > 0) {
            setOpcionesTipoEvaluacion(tiposEvaluacion);
          } else {
            // Si no se encuentran tipos específicos, usar las opciones por defecto
            setOpcionesTipoEvaluacion(OPCIONES_TIPO_EVALUACION);
          }

          // Cargar opciones de duración
          const duraciones = await getDuracionesPorObjetivos(objetivosUnicos);
          setOpcionesDuracion(duraciones);

          // Cargar opciones de tipo de insumo
          const tiposInsumo = await getTiposInsumoPorObjetivos(objetivosUnicos);
          setOpcionesTipoInsumo(tiposInsumo);

          // Cargar opciones de nombres científicos
          const nombresCientificos = await getNombresCientificosPorObjetivos(
            objetivosUnicos
          );
          setOpcionesNombreCientifico(nombresCientificos);
        }
      } catch (error) {
        console.error("Error al cargar pruebas del montaje:", error);
        alert("Error al cargar las pruebas del montaje");
      } finally {
        setIsLoadingPruebas(false);
      }
    };

    loadPruebasMontaje();
  }, [montajeExistente.id]);

  // Función auxiliar para inicializar condiciones con pruebas específicas
  const initializeCondicionesInicialesWithPruebas = (
    numeroRepeticiones: number,
    pruebas: EfficacyTestData[]
  ): CondicionesIniciales => {
    const testigo = Array(numeroRepeticiones).fill(null);
    const pruebasObj: { [key: string]: any } = {};

    pruebas.forEach((test) => {
      const pruebaKey = `${test.id}`;
      pruebasObj[pruebaKey] = {
        numeroIndividuos: Array(numeroRepeticiones).fill(null),
        producto: test.producto,
        dosis: test.dosis,
        unidades: test.unidades,
      };
    });

    return { testigo, pruebas: pruebasObj };
  };

  // Inicializar condiciones iniciales

  // Inicializar formData para montaje existente
  const [formData, setFormData] = useState<MontageData>(() => ({
    nombreMontaje: montajeExistente.nombreMontaje,
    variedad: "",
    numeroLecturas: montajeExistente.numeroLecturas || 1,
    nombresLecturas:
      montajeExistente.nombresLecturas.length > 0
        ? montajeExistente.nombresLecturas
        : [],
    numeroRepeticiones: montajeExistente.numeroRepeticiones || 3,
    condicionesIniciales: {
      testigo: [],
      pruebas: {},
    },
    tipoEvaluacion:
      montajeExistente.tipoEvaluacion || "por contacto e ingestión",
    duracionPrueba: montajeExistente.duracionPrueba || "",
    tipoInsumo: montajeExistente.tipoInsumo || "",
  }));

  const [sobrescribirTodos, setSobrescribirTodos] = useState(false);
  const [valorSobrescribir, setValorSobrescribir] = useState<number | null>(25);
  const [valorEncontradoDB, setValorEncontradoDB] = useState<number | null>(
    null
  );
  const [opcionesTipoEvaluacion, setOpcionesTipoEvaluacion] = useState<
    string[]
  >(OPCIONES_TIPO_EVALUACION);
  const [opcionesDuracion, setOpcionesDuracion] = useState<string[]>([]);
  const [opcionesTipoInsumo, setOpcionesTipoInsumo] = useState<string[]>([]);
  const [opcionesNombreCientifico, setOpcionesNombreCientifico] = useState<
    string[]
  >([]);

  // Función helper para cargar información del catálogo
  const loadCatalogoInfo = async (objetivo: string) => {
    try {
      const catalogoData = await getCatalogoEficaciaPorObjetivo(objetivo);

      // Si hay tipo de evaluación guardado en el catálogo, usarlo
      if (catalogoData && catalogoData.tipo_de_evaluacion) {
        const tipoEval = catalogoData.tipo_de_evaluacion;
        setFormData((prev) => ({ ...prev, tipoEvaluacion: tipoEval }));
      } else {
        // Si no hay tipo guardado, usar el primer item de las opciones disponibles
        const tipoEval =
          opcionesTipoEvaluacion.length > 0
            ? opcionesTipoEvaluacion[0]
            : "por contacto e ingestión";
        setFormData((prev) => ({ ...prev, tipoEvaluacion: tipoEval }));
      }
    } catch (error) {
      console.error("Error al cargar información del catálogo:", error);
      // En caso de error, usar el primer item disponible
      const tipoEval =
        opcionesTipoEvaluacion.length > 0
          ? opcionesTipoEvaluacion[0]
          : "por contacto e ingestión";
      setFormData((prev) => ({ ...prev, tipoEvaluacion: tipoEval }));
    }
  };

  // Función para ajustar condiciones iniciales preservando valores existentes
  const adjustCondicionesIniciales = (
    currentCondiciones: CondicionesIniciales,
    newNumeroRepeticiones: number
  ): CondicionesIniciales => {
    // Ajustar testigo preservando valores existentes
    const newTestigo = Array(newNumeroRepeticiones).fill(null);
    for (
      let i = 0;
      i < Math.min(currentCondiciones.testigo.length, newNumeroRepeticiones);
      i++
    ) {
      newTestigo[i] = currentCondiciones.testigo[i];
    }

    // Ajustar pruebas preservando valores existentes
    const newPruebas: { [key: string]: any } = {};
    pruebasMontaje.forEach((test) => {
      const pruebaKey = `${test.id}`;
      const currentPrueba = currentCondiciones.pruebas[pruebaKey];

      const newNumeroIndividuos = Array(newNumeroRepeticiones).fill(null);
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

  // Actualizar condiciones iniciales, número de repeticiones y lecturas según el objetivo
  useEffect(() => {
    const setRepeticionesPorObjetivo = async () => {
      if (pruebasMontaje.length > 0) {
        const objetivo = pruebasMontaje[0].objetivo;
        const repeticiones = await getNumeroRepeticionesPorObjetivo(objetivo);

        setFormData((prev) => ({
          ...prev,
          numeroRepeticiones: repeticiones,
          condicionesIniciales: adjustCondicionesIniciales(
            prev.condicionesIniciales,
            repeticiones
          ),
        }));

        // Verificar si es plaga y cargar información relacionada
        await loadCatalogoInfo(objetivo);
      }
    };
    setRepeticionesPorObjetivo();
  }, [pruebasMontaje.length, montajeExistente.id]);

  // Generar nombre automático del montaje (solo para montajes nuevos)
  useEffect(() => {
    const generarNombreMontaje = async () => {
      // Solo generar nombre automático si el montaje no tiene un nombre ya asignado
      // o si el nombre actual es el placeholder por defecto
      if (
        pruebasMontaje.length > 0 &&
        (!montajeExistente.nombreMontaje ||
          montajeExistente.nombreMontaje === "")
      ) {
        // Verificar si todas las pruebas tienen el mismo OT
        const primerOT = pruebasMontaje[0].ot;
        const todosIgualOT = pruebasMontaje.every(
          (prueba) => prueba.ot === primerOT
        );

        let nombreGenerado;
        if (todosIgualOT) {
          // Si todas las pruebas tienen el mismo OT
          const cantidadExistentes = await contarMontajesPorOT(primerOT);
          const secuencia = cantidadExistentes + 1;
          nombreGenerado = `OT ${primerOT} M${secuencia}`;
        } else {
          // Si hay múltiples OTs
          const otsUnicas = [
            ...new Set(pruebasMontaje.map((prueba) => prueba.ot)),
          ];
          const listaOTs = otsUnicas.join("-");
          const cantidadExistentes = await contarMontajesPorOT(primerOT);
          const secuencia = cantidadExistentes + 1;
          nombreGenerado = `OT ${listaOTs} M${secuencia}`;
        }

        setFormData((prev) => ({
          ...prev,
          nombreMontaje: nombreGenerado,
        }));
      }
    };
    generarNombreMontaje();
  }, [
    pruebasMontaje.length,
    montajeExistente.id,
    montajeExistente.nombreMontaje,
  ]);

  // Rellenar condiciones iniciales automáticamente por objetivo
  useEffect(() => {
    const rellenarCondicionesPorObjetivo = async () => {
      if (pruebasMontaje.length > 0) {
        const objetivos = pruebasMontaje.map((t) => t.objetivo);
        const unidadesPorObjetivo = await getUnidadesPorRepeticionPorObjetivo(
          objetivos
        );

        // Buscar el primer valor válido encontrado en la BD
        let valorEncontrado: number | null = null;
        let newValorEncontradoDB: number | null = null;
        let newValorSobrescribir = 25;

        const newCondiciones = { ...formData.condicionesIniciales };
        pruebasMontaje.forEach((test) => {
          const pruebaKey = `${test.id}`;
          let valor = unidadesPorObjetivo[test.objetivo];
          // Extraer número de string tipo "Cinco (5)" o "25 individuos"
          let num = 0;
          if (valor) {
            const match = valor.match(/(\d+)/);
            if (match) {
              num = parseInt(match[1], 10);
              // Guardar el primer valor válido encontrado
              if (valorEncontrado === null && num > 0) {
                valorEncontrado = num;
                newValorEncontradoDB = valorEncontrado;
                newValorSobrescribir = valorEncontrado;
              }
            }
          }
          // Si no se pudo extraer, dejar en 0
          newCondiciones.pruebas[pruebaKey] = {
            ...newCondiciones.pruebas[pruebaKey],
            numeroIndividuos: Array(formData.numeroRepeticiones).fill(num),
            producto: test.producto,
            dosis: test.dosis,
            unidades: test.unidades,
          };
        });

        // Aplicar el valor encontrado también al testigo si existe
        const valorTestigo = valorEncontrado || 0;
        newCondiciones.testigo = Array(formData.numeroRepeticiones).fill(
          valorTestigo
        );

        // Actualizar todos los estados en una sola operación
        setFormData((prev) => ({
          ...prev,
          condicionesIniciales: newCondiciones,
        }));

        // Actualizar los valores encontrados solo si cambiaron
        if (newValorEncontradoDB !== valorEncontradoDB) {
          setValorEncontradoDB(newValorEncontradoDB);
        }
        if (newValorSobrescribir !== valorSobrescribir) {
          setValorSobrescribir(newValorSobrescribir);
        }
      }
    };

    // Solo rellenar automáticamente si no hay condiciones iniciales guardadas válidas y no está activado sobrescribir todos
    if (
      !sobrescribirTodos &&
      pruebasMontaje.length > 0 &&
      (!montajeExistente.condicionesIniciales ||
        !montajeExistente.condicionesIniciales.testigo ||
        !Array.isArray(montajeExistente.condicionesIniciales.testigo) ||
        montajeExistente.condicionesIniciales.testigo.length === 0 ||
        !montajeExistente.condicionesIniciales.testigo.some(
          (val) => val !== null && val !== undefined
        ))
    ) {
      rellenarCondicionesPorObjetivo();
    }
  }, [
    pruebasMontaje.length,
    montajeExistente.id,
    formData.numeroRepeticiones,
    sobrescribirTodos,
    valorEncontradoDB,
    montajeExistente.condicionesIniciales,
  ]);

  // Si el usuario activa el checkbox, rellenar todos los inputs con el valor indicado
  useEffect(() => {
    if (
      sobrescribirTodos &&
      valorSobrescribir !== null &&
      valorSobrescribir >= 0 &&
      formData.numeroRepeticiones > 0
    ) {
      setFormData((prev) => {
        const newCondiciones = { ...prev.condicionesIniciales };
        newCondiciones.testigo = Array(prev.numeroRepeticiones).fill(
          valorSobrescribir
        );
        Object.keys(newCondiciones.pruebas).forEach((pruebaKey) => {
          newCondiciones.pruebas[pruebaKey].numeroIndividuos = Array(
            prev.numeroRepeticiones
          ).fill(valorSobrescribir);
        });
        return {
          ...prev,
          condicionesIniciales: newCondiciones,
        };
      });
    } else if (!sobrescribirTodos || valorSobrescribir === null) {
      // Cuando se desactiva el checkbox o el campo está vacío, limpiar todos los campos
      setFormData((prev) => {
        const newCondiciones = { ...prev.condicionesIniciales };
        newCondiciones.testigo = Array(prev.numeroRepeticiones).fill(null);
        Object.keys(newCondiciones.pruebas).forEach((pruebaKey) => {
          newCondiciones.pruebas[pruebaKey].numeroIndividuos = Array(
            prev.numeroRepeticiones
          ).fill(null);
        });
        return {
          ...prev,
          condicionesIniciales: newCondiciones,
        };
      });

      // Después de limpiar, aplicar configuración automática si no está activado sobrescribir
      if (!sobrescribirTodos && pruebasMontaje.length > 0) {
        // Usar setTimeout para asegurar que se ejecute después del setState anterior
        setTimeout(() => {
          const rellenarCondicionesPorObjetivo = async () => {
            const objetivos = pruebasMontaje.map((t) => t.objetivo);
            const unidadesPorObjetivo =
              await getUnidadesPorRepeticionPorObjetivo(objetivos);

            // Buscar el primer valor válido encontrado en la BD
            let valorEncontrado: number | null = null;
            let newValorEncontradoDB: number | null = null;
            let newValorSobrescribir = 25;

            const newCondiciones = { ...formData.condicionesIniciales };
            pruebasMontaje.forEach((test) => {
              const pruebaKey = `${test.id}`;
              let valor = unidadesPorObjetivo[test.objetivo];
              // Extraer número de string tipo "Cinco (5)" o "25 individuos"
              let num = 0;
              if (valor) {
                const match = valor.match(/(\d+)/);
                if (match) {
                  num = parseInt(match[1], 10);
                  // Guardar el primer valor válido encontrado
                  if (valorEncontrado === null && num > 0) {
                    valorEncontrado = num;
                    newValorEncontradoDB = valorEncontrado;
                    newValorSobrescribir = valorEncontrado;
                  }
                }
              }
              // Si no se pudo extraer, dejar en 0
              newCondiciones.pruebas[pruebaKey] = {
                ...newCondiciones.pruebas[pruebaKey],
                numeroIndividuos: Array(formData.numeroRepeticiones).fill(num),
                producto: test.producto,
              };
            });

            // Aplicar al testigo si se encontró un valor válido
            if (valorEncontrado !== null) {
              newCondiciones.testigo = Array(formData.numeroRepeticiones).fill(
                valorEncontrado
              );
            }

            setFormData((prev) => ({
              ...prev,
              condicionesIniciales: newCondiciones,
            }));
            setValorEncontradoDB(newValorEncontradoDB);
            setValorSobrescribir(newValorSobrescribir);
          };

          rellenarCondicionesPorObjetivo();
        }, 0);
      }
    }
  }, [
    sobrescribirTodos,
    valorSobrescribir,
    formData.numeroRepeticiones,
    pruebasMontaje,
  ]);

  // Nueva función para manejar cambios en el multi-select de tiempo
  const handleTiempoLecturaChange = (selectedValues: string[]) => {
    // Actualizar nombres de lecturas basado en los tiempos seleccionados
    setFormData((prev) => ({
      ...prev,
      nombresLecturas: selectedValues,
      numeroLecturas: selectedValues.length,
    }));
  };

  // Función para manejar cambios en el tipo de evaluación
  const handleTipoEvaluacionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipoEvaluacion: value,
    }));
  };

  // Función para manejar cambios en la duración de la prueba
  const handleDuracionPruebaChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      duracionPrueba: value,
    }));
  };

  // Función para manejar cambios en el tipo de insumo
  const handleTipoInsumoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipoInsumo: value,
    }));
  };

  // Función para manejar cambios en el nombre científico
  const handleNombreCientificoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      nombreCientifico: value,
    }));
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
  const handleTestigoChange = (replicaIndex: number, value: number | null) => {
    setFormData((prev) => {
      const newCondiciones = { ...prev.condicionesIniciales };
      newCondiciones.testigo[replicaIndex] = value;
      return {
        ...prev,
        condicionesIniciales: newCondiciones,
      };
    });
  };

  const handlePruebaChange = (
    pruebaId: string,
    replicaIndex: number,
    value: number | null
  ) => {
    setFormData((prev) => {
      const newCondiciones = { ...prev.condicionesIniciales };
      newCondiciones.pruebas[pruebaId].numeroIndividuos[replicaIndex] = value;
      return {
        ...prev,
        condicionesIniciales: newCondiciones,
      };
    });
  };

  // Calcular promedio
  const calculateAverage = (values: (number | null)[]) => {
    const validValues = values.filter(
      (val): val is number =>
        val !== null && val !== undefined && !isNaN(val as number)
    );
    if (validValues.length === 0) return "-";
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const average = sum / validValues.length;
    // Mostrar hasta 2 decimales, pero remover zeros innecesarios
    return Number(average.toFixed(2)).toString();
  };

  // Función para validar todos los campos requeridos
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validar al menos una lectura
    if (!formData.nombresLecturas || formData.nombresLecturas.length === 0) {
      errors.push("Debe seleccionar al menos un tiempo de lectura");
    }

    // Validar tipo de aplicación
    if (!formData.tipoEvaluacion || formData.tipoEvaluacion.trim() === "") {
      errors.push("Debe seleccionar un tipo de aplicación");
    }

    // Validar duración de prueba O tipo de insumo (al menos uno debe estar seleccionado)
    const tieneDuracion =
      formData.duracionPrueba && formData.duracionPrueba.trim() !== "";
    const tieneInsumo =
      formData.tipoInsumo && formData.tipoInsumo.trim() !== "";

    if (opcionesDuracion.length > 0 && !tieneDuracion) {
      errors.push("Debe seleccionar la duración de la prueba");
    }

    if (
      opcionesTipoInsumo.length > 0 &&
      !tieneInsumo &&
      opcionesDuracion.length === 0
    ) {
      errors.push("Debe seleccionar el tipo de insumo");
    }

    // Validar nombre científico si está disponible
    if (
      opcionesNombreCientifico.length > 0 &&
      (!formData.nombreCientifico || formData.nombreCientifico.trim() === "")
    ) {
      errors.push("Debe seleccionar el nombre científico");
    }

    // Validar número de repeticiones
    if (!formData.numeroRepeticiones || formData.numeroRepeticiones <= 0) {
      errors.push("El número de repeticiones debe ser mayor a 0");
    }

    // Validar que al menos algunas condiciones iniciales estén completas
    const tieneCondicionesValidas = () => {
      // Verificar si hay al menos algunos valores en el testigo
      const testigoValido = formData.condicionesIniciales.testigo.some(
        (val) => val !== null && val !== undefined && val >= 0
      );

      // Verificar si hay al menos algunos valores en las pruebas
      const pruebasValidas = Object.values(
        formData.condicionesIniciales.pruebas
      ).some((prueba) =>
        prueba.numeroIndividuos.some(
          (val) => val !== null && val !== undefined && val >= 0
        )
      );

      return testigoValido || pruebasValidas;
    };

    if (!tieneCondicionesValidas()) {
      errors.push("Debe completar al menos algunas condiciones iniciales");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar el formulario antes de enviar
    const validation = validateForm();
    if (!validation.isValid) {
      const errorMessage =
        "Por favor complete los siguientes campos:\n\n" +
        validation.errors
          .map((error, index) => `${index + 1}. ${error}`)
          .join("\n");
      alert(errorMessage);
      return;
    }

    try {
      const result = await updateMontajeSetup(
        parseInt(montajeExistente.id),
        formData
      );
      if (result.success) {
        alert("Montaje configurado exitosamente");
        onMontageCreated(formData); // Llamar callback para cerrar modal y refrescar
      } else {
        alert(`Error al configurar el montaje: ${result.error}`);
      }
    } catch (error) {
      console.error("Error al configurar montaje:", error);
      alert("Error inesperado al configurar el montaje");
    }
  };

  if (isLoadingPruebas) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-8">
            <p>Cargando información del montaje...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 py-1">
      {/* Columna izquierda - Información del montaje */}
      <div>
        <Card className="py-3">
          <CardContent className="space-y-3">
            {/* Información de control del montaje */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">
                    Orden de Trabajo:
                  </span>
                  <span className="font-bold text-gray-900 text-base">
                    {(() => {
                      if (pruebasMontaje.length === 0) return "";

                      // Obtener todas las OTs únicas
                      const otsUnicas = [
                        ...new Set(pruebasMontaje.map((prueba) => prueba.ot)),
                      ];

                      // Si hay solo una OT única, mostrarla sola
                      if (otsUnicas.length === 1) {
                        return otsUnicas[0];
                      }

                      // Si hay múltiples OTs, mostrarlas separadas por guiones
                      return otsUnicas.join(", ");
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">Objetivo:</span>
                  <span className="font-bold text-gray-900 text-base">
                    {pruebasMontaje[0]?.objetivo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-700">
                    Especie Vegetal:
                  </span>
                  <span className="font-bold text-gray-900 text-base">
                    {pruebasMontaje[0]?.especieVegetal}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de pruebas compacta */}
            <div>
              <span className="text-sm font-medium text-gray-700">
                {pruebasMontaje.length} prueba(s):
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {pruebasMontaje.map((test) => (
                  <Badge key={test.id} variant="secondary" className="text-xs">
                    {test.ot}-{test.prueba} - {test.producto}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha - Formulario de configuración */}
      <div>
        <Card className="py-3">
          <CardContent className="px-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Primera fila - Nombre del Montaje y Variedad */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="nombre-montaje"
                    className="text-sm font-medium"
                  >
                    Nombre del Montaje
                  </Label>
                  <Input
                    id="nombre-montaje"
                    value={formData.nombreMontaje}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed h-8 text-sm"
                    placeholder="Se genera automáticamente"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="variedad" className="text-sm font-medium">
                    Variedad
                  </Label>
                  <Input
                    id="variedad"
                    value={formData.variedad}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        variedad: e.target.value,
                      }))
                    }
                    placeholder="Ingrese la variedad"
                    className="h-8 text-sm"
                    tabIndex={1}
                  />
                </div>
              </div>

              {/* Segunda fila - Números en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="numero-lecturas"
                    className="text-sm font-medium"
                  >
                    N° Lecturas:
                  </Label>
                  <Input
                    id="numero-lecturas"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.numeroLecturas}
                    readOnly
                    onWheel={(e) => e.currentTarget.blur()}
                    className="h-8 text-sm flex-1 bg-gray-100 cursor-not-allowed"
                    tabIndex={-1}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="numero-repeticiones"
                    className="text-sm font-medium"
                  >
                    N° Repeticiones: <span className="text-red-500">*</span>
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
                    onWheel={(e) => e.currentTarget.blur()}
                    className="h-8 text-sm flex-1"
                    required
                    tabIndex={3}
                  />
                </div>
              </div>

              {/* Cuarta fila - Selects en grid */}
              {/* Tiempo de lectura y Tipo de evaluación - Alineados horizontalmente */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tiempo de lectura - Multi-select */}
                <div className="space-y-1">
                  <Label
                    htmlFor="tiempo-lectura"
                    className="text-sm font-medium"
                  >
                    Tiempo Lectura <span className="text-red-500">*</span>
                  </Label>
                  <MultiSelectTiempo
                    selectedValues={formData.nombresLecturas || []}
                    onSelectionChange={handleTiempoLecturaChange}
                    options={OPCIONES_TIEMPO}
                  />
                </div>

                {/* Tipo de evaluación */}
                <div className="space-y-1">
                  <Label
                    htmlFor="tipo-evaluacion"
                    className="text-sm font-medium"
                  >
                    Tipo Aplicación <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tipoEvaluacion}
                    onValueChange={handleTipoEvaluacionChange}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue
                        placeholder={
                          opcionesTipoEvaluacion.length > 0
                            ? opcionesTipoEvaluacion[0]
                            : "Seleccione el tipo"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {opcionesTipoEvaluacion.map((opcion) => (
                        <SelectItem
                          key={opcion}
                          value={opcion}
                          className="text-sm"
                        >
                          {opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quinta fila - Campos condicionales con layout fijo */}
              <div className="grid grid-cols-2 gap-4">
                {/* Columna izquierda - Duración Prueba o Tipo Insumo */}
                <div className="space-y-1">
                  {opcionesDuracion.length > 0 ? (
                    <>
                      <Label
                        htmlFor="duracion-prueba"
                        className="text-sm font-medium"
                      >
                        Duración Prueba <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.duracionPrueba}
                        onValueChange={handleDuracionPruebaChange}
                      >
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder="Seleccione la duración" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {opcionesDuracion.map((opcion) => (
                            <SelectItem
                              key={opcion}
                              value={opcion}
                              className="text-sm"
                            >
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : opcionesTipoInsumo.length > 0 ? (
                    <>
                      <Label
                        htmlFor="tipo-insumo"
                        className="text-sm font-medium"
                      >
                        Tipo Insumo <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.tipoInsumo}
                        onValueChange={handleTipoInsumoChange}
                      >
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder="Seleccione el tipo de insumo" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {opcionesTipoInsumo.map((opcion) => (
                            <SelectItem
                              key={opcion}
                              value={opcion}
                              className="text-sm"
                            >
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <div></div> // Espacio vacío para mantener el layout
                  )}
                </div>

                {/* Columna derecha - Nombre Científico (siempre fijo aquí) */}
                <div className="space-y-1">
                  {opcionesNombreCientifico.length > 0 ? (
                    <>
                      <Label
                        htmlFor="nombre-cientifico"
                        className="text-sm font-medium"
                      >
                        Nombre Científico{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.nombreCientifico}
                        onValueChange={handleNombreCientificoChange}
                      >
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue placeholder="Seleccione el nombre científico" />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {opcionesNombreCientifico.map((opcion) => (
                            <SelectItem
                              key={opcion}
                              value={opcion}
                              className="text-sm"
                            >
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <div></div> // Espacio vacío para mantener el layout
                  )}
                </div>
              </div>

              {/* Sexta fila - Tipo Insumo (solo si hay Duración Prueba) */}
              {opcionesDuracion.length > 0 && opcionesTipoInsumo.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="tipo-insumo"
                      className="text-sm font-medium"
                    >
                      Tipo Insumo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.tipoInsumo}
                      onValueChange={handleTipoInsumoChange}
                    >
                      <SelectTrigger className="h-9 text-sm w-full">
                        <SelectValue placeholder="Seleccione el tipo de insumo" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {opcionesTipoInsumo.map((opcion) => (
                          <SelectItem
                            key={opcion}
                            value={opcion}
                            className="text-sm"
                          >
                            {opcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div></div> {/* Espacio vacío para mantener el layout */}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Condiciones Iniciales - Card de ancho completo */}
      <div className="col-span-1 lg:col-span-2">
        <Card className="gap-1 py-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Condiciones Iniciales por Repetición
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {valorEncontradoDB !== null && valorEncontradoDB > 0 && (
              <div>
                <div className="flex items-center justify-left">
                  <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-green-600 font-semibold">✓</span>
                    <span className="text-green-800">
                      Configuración automática:{" "}
                      <strong>{valorEncontradoDB} individuos</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sobrescribir-todos"
                        checked={sobrescribirTodos}
                        onChange={(e) => setSobrescribirTodos(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label
                        htmlFor="sobrescribir-todos"
                        className="text-sm font-medium text-gray-700"
                      >
                        Mismo número para todas las pruebas
                      </Label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={
                        valorSobrescribir === null ? "" : valorSobrescribir
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setValorSobrescribir(null);
                        } else {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setValorSobrescribir(numValue);
                          }
                        }
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={!sobrescribirTodos}
                      className={`w-20 h-8 text-xs ${
                        valorEncontradoDB !== null
                          ? "border-green-500 bg-green-50"
                          : ""
                      }`}
                      placeholder="Valor"
                    />
                  </div>
                </div>
              </div>
            )}

            {!(valorEncontradoDB !== null && valorEncontradoDB > 0) && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sobrescribir-todos-fallback"
                    checked={sobrescribirTodos}
                    onChange={(e) => setSobrescribirTodos(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label
                    htmlFor="sobrescribir-todos-fallback"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mismo número para todas las pruebas
                  </Label>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={valorSobrescribir === null ? "" : valorSobrescribir}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setValorSobrescribir(null);
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setValorSobrescribir(numValue);
                      }
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={!sobrescribirTodos}
                  className="w-20 h-8 text-xs"
                  placeholder="Valor"
                />
              </div>
            )}

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
                      {pruebasMontaje.map((test) => (
                        <th
                          key={test.id}
                          className="px-3 py-2 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[150px]"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-blue-700">
                              {(() => {
                                // Obtener todas las OTs únicas
                                const otsUnicas = [
                                  ...new Set(
                                    pruebasMontaje.map((prueba) => prueba.ot)
                                  ),
                                ];

                                // Si hay solo una OT única, mostrar formato actual
                                if (otsUnicas.length === 1) {
                                  return `Prueba: ${test.prueba}`;
                                }

                                // Si hay múltiples OTs, mostrar formato OT-Prueba
                                return `Prueba: ${test.ot}-${test.prueba}`;
                              })()}
                            </div>
                            <div className="text-xs text-gray-700 font-medium">
                              {test.finca}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              {test.especieVegetal}
                            </div>
                            <div className="text-xs text-gray-800 font-semibold">
                              {test.producto}
                            </div>
                            <div className="text-xs text-purple-600 font-medium">
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
                                key={`testigo-${montajeExistente.id}-${index}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  formData.condicionesIniciales.testigo[
                                    index
                                  ] === null ||
                                  formData.condicionesIniciales.testigo[
                                    index
                                  ] === undefined
                                    ? ""
                                    : formData.condicionesIniciales.testigo[
                                        index
                                      ]
                                }
                                onChange={(e) =>
                                  handleTestigoChange(
                                    index,
                                    e.target.value === ""
                                      ? null
                                      : Number.parseFloat(e.target.value) || 0
                                  )
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder={
                                  !sobrescribirTodos ||
                                  valorSobrescribir === null ||
                                  valorSobrescribir === 0
                                    ? "0.0"
                                    : ""
                                }
                                tabIndex={10 + index}
                              />
                            </div>
                          </td>
                          {/* Columnas de pruebas */}
                          {pruebasMontaje.map((test) => (
                            <td
                              key={test.id}
                              className="px-4 py-2 border-r border-gray-200 text-center"
                            >
                              <div className="flex justify-center">
                                <Input
                                  key={`prueba-${montajeExistente.id}-${test.id}-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={String(
                                    formData.condicionesIniciales.pruebas[
                                      test.id
                                    ]?.numeroIndividuos[index] === null ||
                                      formData.condicionesIniciales.pruebas[
                                        test.id
                                      ]?.numeroIndividuos[index] === undefined
                                      ? ""
                                      : formData.condicionesIniciales.pruebas[
                                          test.id
                                        ]?.numeroIndividuos[index]
                                  )}
                                  onChange={(e) =>
                                    handlePruebaChange(
                                      test.id.toString(),
                                      index,
                                      e.target.value === ""
                                        ? null
                                        : Number.parseFloat(e.target.value) || 0
                                    )
                                  }
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder={
                                    !sobrescribirTodos ||
                                    valorSobrescribir === null ||
                                    valorSobrescribir === 0
                                      ? "0.0"
                                      : ""
                                  }
                                  tabIndex={
                                    20 +
                                    pruebasMontaje.indexOf(test) *
                                      formData.numeroRepeticiones +
                                    index
                                  }
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
                      {pruebasMontaje.map((test) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Botón de envío - Debajo de las condiciones iniciales */}
      <div className="col-span-1 lg:col-span-2 flex justify-center pt-3">
        <Button
          onClick={handleSubmit}
          disabled={isLoadingPruebas}
          className="px-6 py-2 h-9"
        >
          {isLoadingPruebas ? "Cargando..." : "Configurar Montaje"}
        </Button>
      </div>
    </div>
  );
}
