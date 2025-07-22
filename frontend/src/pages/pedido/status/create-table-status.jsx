"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createTableStatus } from "../../../apis/pedido/tableStatusApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import MainLayout from "@/components/MainLayout"

function CreateTableStatus() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    color: "#808080",
    order: 0,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? (value === "" ? 0 : Number.parseInt(value, 10)) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar campos requeridos
      if (!formData.name) {
        throw new Error("El nombre es requerido")
      }

      await createTableStatus(formData)
      toast({
        title: "Éxito",
        description: "Estado de tabla creado exitosamente",
      })
      navigate("/table-status")
    } catch (error) {
      console.error("Error al crear el estado de tabla:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al crear el estado de tabla",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="container py-8 mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/table-status")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Crear Estado de Tabla</h1>
              <p className="text-muted-foreground">Agregar un nuevo estado para la tabla de pedidos</p>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles del Estado de Tabla</CardTitle>
              <CardDescription>
                Crear un nuevo estado que se utilizará para rastrear pedidos en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-4">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-16 h-10"
                  />
                  <Input name="color" value={formData.color} onChange={handleInputChange} className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Orden de Visualización</Label>
                <Input id="order" name="order" type="number" value={formData.order} onChange={handleInputChange} />
                <p className="text-sm text-muted-foreground">Los números más bajos aparecerán primero en la lista</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => navigate("/table-status")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Guardar Estado
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default CreateTableStatus
