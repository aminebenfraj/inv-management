"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createSolicitante } from "../../../apis/pedido/solicitanteApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import MainLayout from "@/components/MainLayout"

function CreateSolicitante() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          throw new Error("Por favor ingresa una dirección de email válida")
        }
      }

      await createSolicitante(formData)
      toast({
        title: "Éxito",
        description: "Solicitante creado exitosamente",
      })
      navigate("/solicitante")
    } catch (error) {
      console.error("Error al crear solicitante:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al crear solicitante",
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
            <Button variant="outline" size="icon" onClick={() => navigate("/solicitante")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Crear Solicitante</h1>
              <p className="text-muted-foreground">Agregar un nuevo solicitante al sistema</p>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles del Solicitante</CardTitle>
              <CardDescription>Crear un nuevo solicitante que puede enviar pedidos en el sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número de Teléfono</Label>
                <Input id="number" name="number" value={formData.number} onChange={handleInputChange} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => navigate("/solicitante")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Guardar Solicitante
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default CreateSolicitante
