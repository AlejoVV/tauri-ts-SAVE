"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"

interface RegisterTestsTableProps {
  mode?: "existing-ot" | "all-tests"
}

// Datos de ejemplo para la tabla
const mockTests = [
  {
    id: "OT-001",
    fecha: "2024-01-15",
    empresa: "Agropecuaria Los Andes",
    contacto: "Juan Pérez",
    finca: "La Esperanza",
    especie: "Bovino",
    objetivo: "Análisis Nutricional",
    producto: "Forraje Verde",
    estado: "Completado",
  },
  {
    id: "OT-002",
    fecha: "2024-01-16",
    empresa: "Ganadería San José",
    contacto: "María García",
    finca: "El Paraíso",
    especie: "Porcino",
    objetivo: "Control de Calidad",
    producto: "Concentrado",
    estado: "En Proceso",
  },
  {
    id: "OT-003",
    fecha: "2024-01-17",
    empresa: "Avícola del Valle",
    contacto: "Carlos López",
    finca: "Las Palmas",
    especie: "Aviar",
    objetivo: "Análisis Microbiológico",
    producto: "Alimento Balanceado",
    estado: "Pendiente",
  },
]

export function RegisterTestsTable({ mode = "all-tests" }: RegisterTestsTableProps) {
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return <Badge variant="default" className="bg-green-500">Completado</Badge>
      case "En Proceso":
        return <Badge variant="default" className="bg-yellow-500">En Proceso</Badge>
      case "Pendiente":
        return <Badge variant="secondary">Pendiente</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Finca</TableHead>
              <TableHead>Especie</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {mode === "existing-ot" 
                    ? "No hay pruebas registradas para esta OT" 
                    : "No se encontraron pruebas registradas"}
                </TableCell>
              </TableRow>
            ) : (
              mockTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.id}</TableCell>
                  <TableCell>{test.fecha}</TableCell>
                  <TableCell>{test.empresa}</TableCell>
                  <TableCell>{test.contacto}</TableCell>
                  <TableCell>{test.finca}</TableCell>
                  <TableCell>{test.especie}</TableCell>
                  <TableCell>{test.objetivo}</TableCell>
                  <TableCell>{test.producto}</TableCell>
                  <TableCell>{getStatusBadge(test.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Información adicional */}
      <div className="text-sm text-muted-foreground">
        {mode === "existing-ot" 
          ? `Mostrando ${mockTests.length} pruebas de la OT seleccionada`
          : `Mostrando ${mockTests.length} pruebas registradas`}
      </div>
    </div>
  )
}