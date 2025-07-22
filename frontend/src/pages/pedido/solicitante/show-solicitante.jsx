"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAllSolicitantes } from "../../../apis/pedido/solicitanteApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Loader2, Plus, Mail, Phone } from "lucide-react"
import MainLayout from "@/components/MainLayout"

function ShowSolicitante() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [solicitantes, setSolicitantes] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSolicitantes = async () => {
      try {
        console.log("Obteniendo todos los solicitantes")
        const data = await getAllSolicitantes()

        if (!data || !Array.isArray(data)) {
          setError("No se encontraron solicitantes o formato de datos inválido")
        } else {
          console.log("Datos de solicitantes:", data)
          setSolicitantes(data)
        }
      } catch (error) {
        console.error("Error al obtener solicitantes:", error)
        setError(error.message || "Error al cargar los datos de solicitantes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSolicitantes()
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
              <p>No se pudieron cargar los solicitantes. Por favor, inténtalo de nuevo.</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Solicitantes</h1>
              <p className="text-muted-foreground">Ver y gestionar todos los solicitantes</p>
            </div>
          </div>
          <Button onClick={() => navigate("/solicitante/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Nuevo Solicitante
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Solicitantes</CardTitle>
            <CardDescription>Lista de todos los solicitantes disponibles en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {solicitantes.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">No se encontraron solicitantes. ¡Crea el primero!</p>
                <Button className="mt-4" onClick={() => navigate("/solicitante/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Solicitante
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {solicitantes.map((solicitante) => (
                  <div
                    key={solicitante._id}
                    className="flex items-center justify-between p-4 transition-colors border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex flex-col space-y-1">
                      <h3 className="font-medium">{solicitante.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 mr-1" />
                        <span>{solicitante.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="w-3 h-3 mr-1" />
                        <span>{solicitante.number}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/solicitante/edit/${solicitante._id}`)}>
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

export default ShowSolicitante
