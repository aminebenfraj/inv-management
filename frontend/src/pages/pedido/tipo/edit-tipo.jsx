"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getTipoById, updateTipo, deleteTipo } from "../../../apis/pedido/tipoApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import MainLayout from "@/components/MainLayout"

function EditTipo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
  })

  useEffect(() => {
    const fetchTipo = async () => {
      try {
        const data = await getTipoById(id)
        setFormData({
          name: data.name || "",
        })
      } catch (error) {
        console.error("Error al obtener el tipo:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del tipo",
        })
        navigate("/tipo")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTipo()
  }, [id, navigate, toast])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDelete = async () => {
    try {
      setIsSaving(true)
      await deleteTipo(id)
      toast({
        title: "Éxito",
        description: "Tipo eliminado exitosamente",
      })
      navigate("/tipo")
    } catch (error) {
      console.error("Error al eliminar el tipo:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al eliminar el tipo",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validar campos requeridos
      if (!formData.name) {
        throw new Error("El nombre es requerido")
      }

      await updateTipo(id, formData)
      toast({
        title: "Éxito",
        description: "Tipo actualizado exitosamente",
      })
      navigate("/tipo")
    } catch (error) {
      console.error("Error al actualizar el tipo:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar el tipo",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    )
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
            <Button variant="outline" size="icon" onClick={() => navigate("/tipo")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Tipo</h1>
              <p className="text-muted-foreground">Modificar un tipo de pedido existente</p>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles del Tipo</CardTitle>
              <CardDescription>Actualizar la información de este tipo de pedido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                <p className="text-sm text-muted-foreground">El nombre debe ser único y descriptivo</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => navigate("/tipo")}>
                  Cancelar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente este tipo y puede afectar
                        cualquier pedido que lo esté utilizando.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default EditTipo
