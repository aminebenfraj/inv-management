"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAllTableStatuses } from "../../../apis/pedido/tableStatusApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Loader2, Plus } from "lucide-react"
import MainLayout from "@/components/MainLayout"

function ShowTableStatus() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [tableStatuses, setTableStatuses] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTableStatuses = async () => {
      try {
        console.log("Obteniendo todos los estados de tabla")
        const data = await getAllTableStatuses()

        if (!data || !Array.isArray(data)) {
          setError("No se encontraron estados de tabla o formato de datos inválido")
        } else {
          console.log("Datos de estados de tabla:", data)
          setTableStatuses(data)
        }
      } catch (error) {
        console.error("Error al obtener estados de tabla:", error)
        setError(error.message || "Error al cargar los datos de estados de tabla")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTableStatuses()
  }, [toast])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <div className="flex items-center mb-6 space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Error</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <p>No se pueden cargar los estados de tabla. Por favor, inténtalo de nuevo.</p>
            </CardContent>
          </Card>
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
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Estados de Tabla</h1>
              <p className="text-muted-foreground">Ver y gestionar todos los estados de tabla</p>
            </div>
          </div>
          <Button onClick={() => navigate("/tablestatus/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Nuevo Estado
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Estados de Tabla</CardTitle>
            <CardDescription>
              Lista de todos los estados de tabla disponibles ordenados por orden de visualización
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tableStatuses.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">No se encontraron estados de tabla. ¡Crea el primero!</p>
                <Button className="mt-4" onClick={() => navigate("/table-status/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Estado de Tabla
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {tableStatuses.map((status) => (
                  <div
                    key={status._id}
                    className="flex items-center justify-between p-4 transition-colors border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }}></div>
                      <div>
                        <h3 className="font-medium">{status.name}</h3>
                        <p className="text-sm text-muted-foreground">Orden: {status.order}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/tablestatus/edit/${status._id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default ShowTableStatus
