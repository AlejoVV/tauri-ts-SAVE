"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface TestData {
  id: string
  ot: string
  prueba: string
  finca: string
  objetivo: string
  producto: string
  especieVegetal: string
  fechaIngreso: string
  estado: string
}

interface MontageData {
  numeroMontaje: string
  nombreMontaje: string
  numeroLecturas: number
  nombresLecturas: string[]
  numeroRepeticiones: number
  numeroInicialIndividuos: number
}

interface MontageSetupFormProps {
  selectedTests: TestData[]
  onMontageCreated: (montageData: MontageData) => void
  onBack: () => void
}

export function MontageSetupForm({ selectedTests, onMontageCreated, onBack }: MontageSetupFormProps) {
  const [formData, setFormData] = useState<MontageData>({
    numeroMontaje: `M-${Date.now()}`,
    nombreMontaje: "",
    numeroLecturas: 1,
    nombresLecturas: ["Lectura 1"],
    numeroRepeticiones: 3,
    numeroInicialIndividuos: 10,
  })

  const handleNumeroLecturasChange = (value: number) => {
    const newNombresLecturas = Array.from(
      { length: value },
      (_, i) => formData.nombresLecturas[i] || `Lectura ${i + 1}`,
    )

    setFormData({
      ...formData,
      numeroLecturas: value,
      nombresLecturas: newNombresLecturas,
    })
  }

  const handleNombreLecturaChange = (index: number, value: string) => {
    const newNombresLecturas = [...formData.nombresLecturas]
    newNombresLecturas[index] = value
    setFormData({
      ...formData,
      nombresLecturas: newNombresLecturas,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onMontageCreated(formData)
  }

  return (
    <div className="space-y-6">
      {/* Resumen de pruebas seleccionadas */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas Seleccionadas</CardTitle>
          <CardDescription>
            OT: {selectedTests[0]?.ot} | Objetivo: {selectedTests[0]?.objetivo}
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

      {/* Formulario de configuración del montaje */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Montaje</CardTitle>
          <CardDescription>Configure los parámetros para el montaje de eficacia</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-montaje">Número de Montaje</Label>
                <Input
                  id="numero-montaje"
                  value={formData.numeroMontaje}
                  onChange={(e) => setFormData({ ...formData, numeroMontaje: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre-montaje">Nombre del Montaje</Label>
                <Input
                  id="nombre-montaje"
                  value={formData.nombreMontaje}
                  onChange={(e) => setFormData({ ...formData, nombreMontaje: e.target.value })}
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
                  onChange={(e) => handleNumeroLecturasChange(Number.parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero-repeticiones">Número de Repeticiones</Label>
                <Input
                  id="numero-repeticiones"
                  type="number"
                  min="1"
                  value={formData.numeroRepeticiones}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroRepeticiones: Number.parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="numero-inicial-individuos">Número Inicial de Individuos</Label>
                <Input
                  id="numero-inicial-individuos"
                  type="number"
                  min="1"
                  value={formData.numeroInicialIndividuos}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroInicialIndividuos: Number.parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Configuración de nombres de lecturas */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Nombres de las Lecturas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.nombresLecturas.map((nombre, index) => (
                  <div key={index} className="space-y-2">
                    <Label htmlFor={`lectura-${index}`}>Lectura {index + 1}</Label>
                    <Input
                      id={`lectura-${index}`}
                      value={nombre}
                      onChange={(e) => handleNombreLecturaChange(index, e.target.value)}
                      placeholder={`Nombre de la lectura ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Volver a Selección
              </Button>
              <Button type="submit">Crear Montaje</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
