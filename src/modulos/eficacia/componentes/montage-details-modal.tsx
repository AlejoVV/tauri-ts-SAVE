import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, X, Plus, Trash2, Edit3 } from "lucide-react";
import type { MontageInProgress } from "../tipos/index";
import { updateMontajeDetails } from "../servicios/index";

interface MontageDetailsModalProps {
  montage: MontageInProgress;
  onDetailsUpdated?: () => void;
  onClose?: () => void;
}

export function MontageDetailsModal({
  montage,
  onDetailsUpdated,
  onClose,
}: MontageDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para los campos editables
  const [nombreMontaje, setNombreMontaje] = useState("");
  const [variedad, setVariedad] = useState("");
  const [nombresLecturas, setNombresLecturas] = useState<string[]>([]);

  // Inicializar estados al montar el componente
  useEffect(() => {
    if (montage) {
      setNombreMontaje(montage.nombreMontaje || "");
      setVariedad(montage.variedad || "");
      setNombresLecturas(montage.nombresLecturas || []);
      setIsEditing(false);
      setError(null);
      setSuccess(false);
    }
  }, [montage]);

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    if (!montage) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await updateMontajeDetails(parseInt(montage.id), {
        nombre: nombreMontaje.trim(),
        variedad: variedad.trim(),
        nombres_lecturas: nombresLecturas.filter(
          (nombre) => nombre.trim() !== ""
        ),
      });

      if (result.success) {
        setSuccess(true);
        setIsEditing(false);
        onDetailsUpdated?.();
      } else {
        setError(result.error || "Error al actualizar el montaje");
      }
    } catch (err) {
      console.error("Error al guardar detalles:", err);
      setError("Error inesperado al actualizar el montaje");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Revertir cambios
    setNombreMontaje(montage.nombreMontaje || "");
    setVariedad(montage.variedad || "");
    setNombresLecturas(montage.nombresLecturas || []);
    setIsEditing(false);
    setError(null);
  };

  const addLectura = () => {
    setNombresLecturas([
      ...nombresLecturas,
      `Lectura ${nombresLecturas.length + 1}`,
    ]);
  };

  const removeLectura = (index: number) => {
    setNombresLecturas(nombresLecturas.filter((_, i) => i !== index));
  };

  const updateLectura = (index: number, value: string) => {
    const newNombres = [...nombresLecturas];
    newNombres[index] = value;
    setNombresLecturas(newNombres);
  };

  if (!montage) return null;

  return (
    <div className="space-y-6">
      {/* Información del montaje */}
      <Card>
        <CardHeader className="bg-white">
          <CardTitle className="text-gray-900 flex items-center justify-between">
            <span>Detalles del Montaje</span>
            {!isEditing && (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                size="sm"
                className="ml-4"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Detalles
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mensajes de estado */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
              ✓ Detalles actualizados exitosamente
            </div>
          )}

          {/* Información de control del montaje */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Orden de Trabajo:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.ot}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">
                  Objetivo:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.objetivo}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">Finca:</span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.finca}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-blue-700 mb-1">Especie:</span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.especie}
                </span>
              </div>
            </div>
          </div>

          {/* Estado y progreso */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-green-700 mb-1">Estado:</span>
                <div>
                  <Badge
                    variant={
                      montage.estado === "Listo para Cálculo"
                        ? "default"
                        : montage.estado === "Sin Configurar"
                        ? "destructive"
                        : montage.estado === "Eficacia guardada"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      montage.estado === "Listo para Cálculo"
                        ? "bg-green-100 text-green-800"
                        : montage.estado === "Sin Configurar"
                        ? "bg-orange-100 text-orange-800"
                        : montage.estado === "Eficacia guardada"
                        ? "bg-blue-100 text-blue-800"
                        : ""
                    }
                  >
                    {montage.estado}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-green-700 mb-1">
                  Progreso:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.lecturasCompletadas} / {montage.numeroLecturas}{" "}
                  lecturas
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-green-700 mb-1">
                  Asignado a:
                </span>
                <span className="font-bold text-gray-900 text-base">
                  {montage.asignadoA || "Sin asignar"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración del montaje */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración del Montaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre-montaje">
                  Nombre del Montaje{" "}
                  {isEditing && <span className="text-red-500">*</span>}
                </Label>
                {isEditing ? (
                  <Input
                    id="nombre-montaje"
                    value={nombreMontaje}
                    onChange={(e) => setNombreMontaje(e.target.value)}
                    placeholder="Ingrese el nombre del montaje"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-gray-50 text-sm">
                    {montage.nombreMontaje}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variedad">Variedad</Label>
                {isEditing ? (
                  <Input
                    id="variedad"
                    value={variedad}
                    onChange={(e) => setVariedad(e.target.value)}
                    placeholder="Ingrese la variedad"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-gray-50 text-sm">
                    {variedad || "No especificada"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Número de Lecturas</Label>
                <div className="p-2 border rounded-md bg-gray-50 text-sm">
                  {isEditing ? nombresLecturas.length : montage.numeroLecturas}
                  {isEditing &&
                    nombresLecturas.length !== montage.numeroLecturas && (
                      <span className="text-orange-600 text-xs ml-2">
                        (actualizado)
                      </span>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Número de Repeticiones</Label>
                <div className="p-2 border rounded-md bg-gray-50 text-sm">
                  {montage.numeroRepeticiones}
                </div>
              </div>
            </div>

            <Separator />

            {/* Configuración de lecturas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Configuración de Lecturas (
                  {isEditing ? nombresLecturas.length : montage.numeroLecturas}{" "}
                  total
                  {isEditing &&
                    nombresLecturas.length !== montage.numeroLecturas && (
                      <span className="text-orange-600 ml-1">
                        - será actualizado de {montage.numeroLecturas} a{" "}
                        {nombresLecturas.length}
                      </span>
                    )}
                  ){isEditing && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLectura}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Lectura
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nombresLecturas.map((nombre, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-gray-600">
                          Lectura {index + 1}
                        </Label>
                        <Input
                          value={nombre}
                          onChange={(e) => updateLectura(index, e.target.value)}
                          placeholder={`Nombre de la lectura ${index + 1}`}
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLectura(index)}
                        className="mt-5 h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {nombresLecturas.length === 0 && (
                    <div className="col-span-full text-muted-foreground text-sm italic bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                      No hay lecturas configuradas. Haga clic en "Agregar
                      Lectura" para crear una.
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {montage.nombresLecturas &&
                  montage.nombresLecturas.length > 0 ? (
                    montage.nombresLecturas.map((nombre, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-white shadow-sm"
                      >
                        <div className="text-xs font-medium text-blue-600 mb-1">
                          Lectura {index + 1}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {nombre}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-muted-foreground text-sm italic bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                      No hay lecturas configuradas
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Información adicional */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Información Adicional
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Productos Asociados</Label>
                  <div className="flex flex-wrap gap-2">
                    {montage.productos.map((producto, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {producto}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fechas</Label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Creación:</strong> {montage.fechaCreacion}
                    </div>
                    <div>
                      <strong>Última lectura:</strong>{" "}
                      {montage.ultimaLectura || "Sin lecturas"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción para modo edición */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !nombreMontaje.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
