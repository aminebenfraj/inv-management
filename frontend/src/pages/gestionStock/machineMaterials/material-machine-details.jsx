"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getMaterialById } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil, Clock, Package, Settings, Building2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MainLayout from "@/components/MainLayout"

const MaterialMachineDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchAllocationDetails()
    }
  }, [id])

  const fetchAllocationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getAllAllocations()
      console.log("Respuesta de la API:", response) // Log de depuración

      // Manejar diferentes formatos de respuesta
      let allAllocations = []
      if (response && response.data && Array.isArray(response.data)) {
        allAllocations = response.data
      } else if (Array.isArray(response)) {
        allAllocations = response
      } else {
        throw new Error("Formato de respuesta inválido de la API")
      }

      const currentAllocation = allAllocations.find((a) => a._id === id)

      if (!currentAllocation) {
        setError("Asignación no encontrada")
        toast({
          title: "Error",
          description: "Asignación no encontrada",
          variant: "destructive",
        })
        return
      }

      // Ordenar historial por fecha (más reciente primero) si existe
      if (currentAllocation.history && currentAllocation.history.length > 0) {
        currentAllocation.history.sort((a, b) => new Date(b.date) - new Date(a.date))
      }

      setAllocation(currentAllocation)

      // Obtener detalles del material para obtener el stock actual si existe el ID del material
      if (currentAllocation.material?._id) {
        try {
          const materialDetails = await getMaterialById(currentAllocation.material._id)
          setAllocation((prev) => ({
            ...prev,
            material: materialDetails,
          }))
        } catch (materialError) {
          console.error("Error al obtener detalles del material:", materialError)
          // No fallar todo el componente si no se pueden obtener los detalles del material
        }
      }
    } catch (error) {
      console.error("Error al obtener detalles de la asignación:", error)
      setError(error.message || "Error al obtener los detalles de la asignación")
      toast({
        title: "Error",
        description: "Error al obtener los detalles de la asignación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (error) {
      return "Fecha Inválida"
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary border-t-transparent"></div>
          <span className="ml-2">Cargando detalles de la asignación...</span>
        </div>
      </MainLayout>
    )
  }

  // Estado de error
  if (error) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => navigate("/machinematerial")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Lista
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // No se encontró asignación
  if (!allocation) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>No Encontrado</AlertTitle>
            <AlertDescription>No se pudo encontrar la asignación solicitada.</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => navigate("/machinematerial")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Lista
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container py-8 mx-auto"
      >
        <Toaster />
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/machinematerial")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la Lista
          </Button>

          <Button asChild>
            <Link to={`/machinematerial/edit/${id}`}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar Asignación
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Detalles de Asignación Material-Máquina
                </CardTitle>
                <CardDescription>Ver detalles sobre esta asignación de material a una máquina</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="mb-4">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">Información del Material</h3>
                        <div className="p-4 space-y-2 border rounded-md">
                          <div>
                            <span className="text-sm text-muted-foreground">Referencia:</span>
                            <p className="font-medium">{allocation.material?.reference || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Descripción:</span>
                            <p className="font-medium">{allocation.material?.description || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Fabricante:</span>
                            <p className="font-medium">{allocation.material?.manufacturer || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Stock Actual:</span>
                            <p className="font-medium">{allocation.material?.currentStock ?? "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Stock Mínimo:</span>
                            <p className="font-medium">{allocation.material?.minimumStock ?? "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Categoría:</span>
                            <p className="font-medium">{allocation.material?.category?.name || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-lg font-medium">Información de la Máquina</h3>
                        <div className="p-4 space-y-2 border rounded-md">
                          <div>
                            <span className="text-sm text-muted-foreground">Nombre:</span>
                            <p className="font-medium">{allocation.machine?.name || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Descripción:</span>
                            <p className="font-medium">{allocation.machine?.description || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Estado:</span>
                            <p className="font-medium capitalize">
                              {allocation.machine?.status === "active"
                                ? "activo"
                                : allocation.machine?.status === "maintenance"
                                  ? "mantenimiento"
                                  : allocation.machine?.status === "inactive"
                                    ? "inactivo"
                                    : allocation.machine?.status || "N/A"}
                            </p>
                          </div>
                          {allocation.machine?.factory && (
                            <div>
                              <span className="text-sm text-muted-foreground">Fábrica:</span>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <p className="font-medium">{allocation.machine.factory.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-2 text-lg font-medium">Detalles de la Asignación</h3>
                      <div className="p-4 border rounded-md">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Stock Asignado:</span>
                            <p className="text-2xl font-bold">{allocation.allocatedStock ?? 0}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Última Actualización:</span>
                            <p className="font-medium">{formatDate(allocation.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="space-y-4">
                      <h3 className="flex items-center text-lg font-medium">
                        <Clock className="w-4 h-4 mr-2" />
                        Historial de Asignaciones
                      </h3>

                      {allocation.history && allocation.history.length > 0 ? (
                        <div className="overflow-hidden border rounded-md">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">Fecha</th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">
                                  Anterior
                                </th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">Nuevo</th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">
                                  Comentario
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {allocation.history.map((entry, index) => (
                                <motion.tr
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-muted/50"
                                >
                                  <td className="px-4 py-2 text-sm">{formatDate(entry.date)}</td>
                                  <td className="px-4 py-2 text-sm">{entry.previousStock ?? "N/A"}</td>
                                  <td className="px-4 py-2 text-sm">{entry.newStock ?? "N/A"}</td>
                                  <td className="px-4 py-2 text-sm">{entry.comment || "Sin comentario"}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center border rounded-md">
                          <p className="text-muted-foreground">No hay historial disponible</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Settings className="w-4 h-4 mr-2" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild className="justify-start w-full">
                    <Link to={`/machinematerial/edit/${id}`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar Asignación
                    </Link>
                  </Button>
                  {allocation.material?._id && (
                    <Button asChild variant="outline" className="justify-start w-full bg-transparent">
                      <Link to={`/materials/edit/${allocation.material._id}`}>
                        <Package className="w-4 h-4 mr-2" />
                        Ver Detalles del Material
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen de Asignación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Material:</span>
                    <p className="font-medium">{allocation.material?.reference || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Máquina:</span>
                    <p className="font-medium">{allocation.machine?.name || "N/A"}</p>
                  </div>
                  {allocation.machine?.factory && (
                    <div>
                      <span className="text-sm text-muted-foreground">Fábrica:</span>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{allocation.machine.factory.name}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Stock Asignado:</span>
                    <p className="text-xl font-bold">{allocation.allocatedStock ?? 0}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Creado:</span>
                    <p className="font-medium">{formatDate(allocation.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Última Actualización:</span>
                    <p className="font-medium">{formatDate(allocation.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineDetails
