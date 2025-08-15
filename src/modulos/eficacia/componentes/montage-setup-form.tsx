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
  MontageInProgress,
} from "../tipos/index";
import {
  getNumeroRepeticionesPorObjetivo,
  getUnidadesPorRepeticionPorObjetivo,
  contarMontajesPorOT,
  updateMontajeSetup,
  getMontajeById,
} from "../servicios/index";

interface MontageSetupFormProps {
  onMontageCreated: (montageData: MontageData) => void;
  onBack?: () => void; // Opcional - el modal se puede cerrar desde fuera
  montajeExistente: MontageInProgress; // Requerido - siempre configurando montajes existentes
}

export function MontageSetupForm({
  onMontageCreated,
  onBack,
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
            ot: relacion.pruebas_ordenes_trabajo?.prueba_orden_id || 0,
            prueba: relacion.prueba_id || 0,
            finca:
              relacion.pruebas_ordenes_trabajo?.fincas?.finca_nombre ||
              "Sin finca",
            objetivo:
              relacion.pruebas_ordenes_trabajo?.objetivos?.objetivo_nombre ||
              "Sin objetivo",
            producto:
              relacion.pruebas_ordenes_trabajo?.productos?.producto_nombre ||
              "Sin producto",
            especieVegetal:
              relacion.pruebas_ordenes_trabajo?.especie_vegetal
                ?.especie_nombre || "Sin especie",
            fechaIngreso: "", // No disponible en esta consulta
            estado: "Montaje",
            dosis:
              relacion.pruebas_ordenes_trabajo?.prueba_dosis_producto?.toString() ||
              "0",
            unidades:
              relacion.pruebas_ordenes_trabajo?.prueba_producto_unid || "",
            contacto: "", // No disponible en esta consulta
          })
        );

        setPruebasMontaje(pruebasFormateadas);

        // Resetear formData con los datos del nuevo montaje
        const baseFormData = {
          nombreMontaje: montajeExistente.nombreMontaje,
          numeroLecturas: montajeExistente.numeroLecturas || 1,
          nombresLecturas:
            montajeExistente.nombresLecturas.length > 0
              ? montajeExistente.nombresLecturas
              : ["Lectura 1"],
          numeroRepeticiones: montajeExistente.numeroRepeticiones || 3,
          condicionesIniciales: {
            testigo: [],
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

        setFormData(baseFormData);
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
  const initializeCondicionesIniciales = (
    numeroRepeticiones: number
  ): CondicionesIniciales => {
    const testigo = Array(numeroRepeticiones).fill(null);
    const pruebas: { [key: string]: any } = {};

    pruebasMontaje.forEach((test) => {
      const pruebaKey = `${test.id}`;
      pruebas[pruebaKey] = {
        numeroIndividuos: Array(numeroRepeticiones).fill(null),
        producto: test.producto,
        dosis: test.dosis,
        unidades: test.unidades,
      };
    });

    return { testigo, pruebas };
  };

  // Inicializar formData para montaje existente
  const [formData, setFormData] = useState<MontageData>(() => ({
    nombreMontaje: montajeExistente.nombreMontaje,
    variedad: "",
    numeroLecturas: montajeExistente.numeroLecturas || 1,
    nombresLecturas:
      montajeExistente.nombresLecturas.length > 0
        ? montajeExistente.nombresLecturas
        : ["Lectura 1"],
    numeroRepeticiones: montajeExistente.numeroRepeticiones || 3,
    condicionesIniciales: {
      testigo: [],
      pruebas: {},
    },
  }));

  const [sobrescribirTodos, setSobrescribirTodos] = useState(false);
  const [valorSobrescribir, setValorSobrescribir] = useState(25);
  const [valorEncontradoDB, setValorEncontradoDB] = useState<number | null>(
    null
  );

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

  // Actualizar condiciones iniciales y número de repeticiones según el objetivo de la primera prueba seleccionada
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
      }
    };
    setRepeticionesPorObjetivo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruebasMontaje]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruebasMontaje, montajeExistente.nombreMontaje]);

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

        setFormData((prev) => {
          const newCondiciones = { ...prev.condicionesIniciales };
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
                  // Establecer valorEncontradoDB aquí donde tenemos acceso al valor
                  setValorEncontradoDB(valorEncontrado);
                  setValorSobrescribir(valorEncontrado);
                }
              }
            }
            // Si no se pudo extraer, dejar en 0
            newCondiciones.pruebas[pruebaKey] = {
              ...newCondiciones.pruebas[pruebaKey],
              numeroIndividuos: Array(prev.numeroRepeticiones).fill(num),
              producto: test.producto,
              dosis: test.dosis,
              unidades: test.unidades,
            };
          });

          // Aplicar el valor encontrado también al testigo si existe
          const valorTestigo = valorEncontrado || 0;
          newCondiciones.testigo = Array(prev.numeroRepeticiones).fill(
            valorTestigo
          );

          return {
            ...prev,
            condicionesIniciales: newCondiciones,
          };
        });

        // Si no se encontró ningún valor, establecer valores por defecto
        if (valorEncontrado === null) {
          setValorEncontradoDB(null);
          setValorSobrescribir(25); // Valor por defecto
        }
      }
    };
    // Solo rellenar automáticamente si no hay condiciones iniciales guardadas válidas y no está activado sobrescribir todos
    if (
      !sobrescribirTodos &&
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruebasMontaje, sobrescribirTodos]);

  // Si el usuario activa el checkbox, rellenar todos los inputs con el valor indicado
  useEffect(() => {
    if (sobrescribirTodos && valorSobrescribir > 0) {
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
    } else if (
      !sobrescribirTodos ||
      valorSobrescribir === 0 ||
      valorSobrescribir === ""
    ) {
      // Cuando se desactiva o el valor es 0/vacío, limpiar todos los campos
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sobrescribirTodos, valorSobrescribir, formData.numeroRepeticiones]);

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
  const handleTestigoChange = (replicaIndex: number, value: number | null) => {
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
    value: number | null
  ) => {
    const newCondiciones = { ...formData.condicionesIniciales };
    newCondiciones.pruebas[pruebaId].numeroIndividuos[replicaIndex] = value;
    setFormData({
      ...formData,
      condicionesIniciales: newCondiciones,
    });
  };

  // Calcular promedio
  const calculateAverage = (values: (number | null)[]) => {
    const validValues = values.filter(
      (val) => val !== null && val !== undefined && !isNaN(val)
    );
    if (validValues.length === 0) return "-";
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const average = sum / validValues.length;
    // Mostrar hasta 2 decimales, pero remover zeros innecesarios
    return Number(average.toFixed(2)).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="space-y-6">
      {/* Pruebas del montaje */}
      <Card>
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900">Pruebas del Montaje</CardTitle>
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
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Objetivo:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {pruebasMontaje[0]?.objetivo}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
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
            <div className="flex flex-wrap gap-2 mt-2">
              {pruebasMontaje.map((test) => (
                <Badge key={test.id} variant="secondary" className="text-xs">
                  {test.ot}-{test.prueba} - {test.producto}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-montaje">Nombre del Montaje</Label>
                <Input
                  id="nombre-montaje"
                  value={formData.nombreMontaje}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  placeholder="Se genera automáticamente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variedad">Variedad</Label>
                <Input
                  id="variedad"
                  value={formData.variedad}
                  onChange={(e) => setFormData({ ...formData, variedad: e.target.value })}
                  placeholder="Ingrese la variedad"
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
                  onWheel={(e) => e.currentTarget.blur()}
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
                  onWheel={(e) => e.currentTarget.blur()}
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

                {valorEncontradoDB !== null && valorEncontradoDB > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-semibold">✓</span>
                      <span className="text-sm text-green-800">
                        Se encontró configuración automática en la base de
                        datos:
                        <strong> {valorEncontradoDB} individuos</strong>{" "}
                        aplicados a todas las pruebas y testigo
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-2">
                <input
                  type="checkbox"
                  id="sobrescribir-todos"
                  checked={sobrescribirTodos}
                  onChange={(e) => setSobrescribirTodos(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="sobrescribir-todos" className="mr-2">
                  Numero de individuos igual para todas las pruebas
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={valorSobrescribir === 0 ? "" : valorSobrescribir}
                    onChange={(e) =>
                      setValorSobrescribir(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    disabled={!sobrescribirTodos}
                    className={`w-32 ${
                      valorEncontradoDB !== null
                        ? "border-green-500 bg-green-50"
                        : ""
                    }`}
                    placeholder="Valor para todos"
                  />
                </div>
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
                                    valorSobrescribir === 0 ||
                                    valorSobrescribir === ""
                                      ? "0.0"
                                      : ""
                                  }
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
                                    value={
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
                                    }
                                    onChange={(e) =>
                                      handlePruebaChange(
                                        test.id.toString(),
                                        index,
                                        e.target.value === ""
                                          ? null
                                          : Number.parseFloat(e.target.value) ||
                                              0
                                      )
                                    }
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-16 h-8 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={
                                      !sobrescribirTodos ||
                                      valorSobrescribir === 0 ||
                                      valorSobrescribir === ""
                                        ? "0.0"
                                        : ""
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
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoadingPruebas}>
                {isLoadingPruebas ? "Cargando..." : "Configurar Montaje"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
