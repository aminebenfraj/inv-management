"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getTableStatusById, updateTableStatus, deleteTableStatus } from "../../../apis/pedido/tableStatusApi.jsx"
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

function EditTableStatus() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    color: "#808080",
    order: 0,
  })

  useEffect(() => {
    const fetchTableStatus = async () => {
      try {
        const data = await getTableStatusById(id)
        setFormData({
          name: data.name || "",
          color: data.color || "#808080",
          order: data.order || 0,
        })
      } catch (error) {
        console.error("Error al obtener el estado de tabla:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del estado de tabla",
        })
        navigate("/table-status")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTableStatus()
  }, [id, navigate, toast])

  const handleDelete = async () => {
    try {
      setIsSaving(true)
      await deleteTableStatus(id)
      toast({
        title: "Éxito",
        description: "Estado de tabla eliminado exitosamente",
      })
      navigate("/table-status")
    } catch (error) {
      console.error("Error al eliminar el estado de tabla:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || error.message || "Error al eliminar el estado de tabla",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? (value === "" ? 0 : Number.parseInt(value, 10)) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validar campos requeridos
      if (!formData.name) {
        throw new Error("El nombre es requerido")
      }

      await updateTableStatus(id, formData)
      toast({
        title: "Éxito",
        description: "Estado de tabla actualizado exitosamente",
      })
      navigate("/table-status")
    } catch (error) {
      console.error("Error al actualizar el estado de tabla:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar el estado de tabla",
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
            <Button variant="outline" size="icon" onClick={() => navigate("/table-status")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Estado de Tabla</h1>
              <p className="text-muted-foreground">Modificar un estado de tabla existente</p>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Detalles del Estado de Tabla</CardTitle>
              <CardDescription>Actualizar la información de este estado de tabla</CardDescription>
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
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => navigate("/table-status")}>
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
                        Esta acción no se puede deshacer. Esto eliminará permanentemente este estado de tabla y puede
                        afectar cualquier pedido que lo esté utilizando.
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

export default EditTableStatus
