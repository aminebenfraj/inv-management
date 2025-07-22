"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getMaterialById } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations, updateAllocation } from "@/apis/gestionStockApi/materialMachineApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  Package,
  Settings,
  TrendingUp,
  TrendingDown,
  History,
  Calculator,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MainLayout from "@/components/MainLayout"

const MaterialMachineEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [allocation, setAllocation] = useState(null)
  const [material, setMaterial] = useState(null)
  const [machine, setMachine] = useState(null)
  const [allocatedStock, setAllocatedStock] = useState(0)
  const [adjustmentAmount, setAdjustmentAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalStock, setOriginalStock] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [comment, setComment] = useState("")
  const [maxAvailableStock, setMaxAvailableStock] = useState(0)
  const [error, setError] = useState(null)

  // Calcular nuevos valores basados en el modo de ajuste
  const calculatedNewStock = allocatedStock

  // Calcular la diferencia para mostrar
  const stockDifference = calculatedNewStock - originalStock

  // Calcular stock de material disponible después del ajuste
  const availableAfterAdjustment = maxAvailableStock - calculatedNewStock

  useEffect(() => {
    if (id) {
      fetchAllocationDetails()
    }
  }, [id])

  useEffect(() => {
    if (material && material.currentStock !== undefined) {
      // Calcular stock máximo disponible (stock actual del material + lo que ya está asignado a esta máquina)
      const max = material.currentStock + originalStock
      setMaxAvailableStock(max)
    }
  }, [material, originalStock])

  // Actualizar cantidad de ajuste cuando cambie el stock asignado
  useEffect(() => {
    setAdjustmentAmount(allocatedStock - originalStock)
  }, [allocatedStock, originalStock])

  const fetchAllocationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Obteniendo asignaciones para ID:", id) // Log de depuración

      const response = await getAllAllocations()
      console.log("Respuesta cruda de la API:", response) // Log de depuración

      // Manejar diferentes formatos de respuesta
      let allAllocations = []
      if (response && response.data && Array.isArray(response.data)) {
        // Formato de respuesta paginada
        allAllocations = response.data
        console.log("Usando datos paginados:", allAllocations.length, "elementos") // Log de depuración
      } else if (Array.isArray(response)) {
        // Formato de respuesta de array directo
        allAllocations = response
        console.log("Usando datos de array directo:", allAllocations.length, "elementos") // Log de depuración
      } else {
        console.log("Formato de respuesta inesperado:", typeof response, response) // Log de depuración
        throw new Error("Formato de respuesta inválido de la API")
      }

      const currentAllocation = allAllocations.find((a) => a._id === id)
      console.log("Asignación encontrada:", currentAllocation) // Log de depuración

      if (!currentAllocation) {
        setError("Asignación no encontrada")
        toast({
          title: "Error",
          description: "Asignación no encontrada",
          variant: "destructive",
        })
        return
      }

      setAllocation(currentAllocation)
      setMaterial(currentAllocation.material)
      setMachine(currentAllocation.machine)
      setAllocatedStock(currentAllocation.allocatedStock || 0)
      setOriginalStock(currentAllocation.allocatedStock || 0)

      // Obtener detalles del material para obtener el stock actual
      if (currentAllocation.material?._id) {
        try {
          const materialDetails = await getMaterialById(currentAllocation.material._id)
          setMaterial(materialDetails)
        } catch (materialError) {
          console.error("Error al obtener detalles del material:", materialError)
          // No fallar todo el componente si no se pueden obtener los detalles del material
          toast({
            title: "Advertencia",
            description: "No se pudieron obtener los detalles completos del material",
            variant: "default",
          })
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (calculatedNewStock < 0) {
      toast({
        title: "Error",
        description: "El stock asignado no puede ser negativo",
        variant: "destructive",
      })
      return
    }

    // Verificar si hay suficiente stock disponible si estamos aumentando la asignación
    if (stockDifference > 0 && material && material.currentStock < stockDifference) {
      toast({
        title: "Error",
        description: `No hay suficiente stock disponible. Solo ${material.currentStock} unidades disponibles.`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Función auxiliar para validar formato de ObjectId de MongoDB
      const isValidObjectId = (id) => {
        return /^[0-9a-fA-F]{24}$/.test(id)
      }

      const userId = localStorage.getItem("userId")

      const updateData = {
        allocatedStock: calculatedNewStock,
        comment: comment || `Stock actualizado de ${originalStock} a ${calculatedNewStock}`,
      }

      // Solo incluir userId si es un ObjectId válido
      if (userId && isValidObjectId(userId)) {
        updateData.userId = userId
      }

      const response = await updateAllocation(id, updateData)

      // Mostrar animación de éxito
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)

      toast({
        title: "Éxito",
        description: "Asignación actualizada exitosamente",
      })

      // Actualizar material con nuevo stock si se proporciona en la respuesta
      if (response.updatedMaterialStock !== undefined) {
        setMaterial({
          ...material,
          currentStock: response.updatedMaterialStock,
        })
      }

      // Actualizar detalles de asignación para obtener historial actualizado
      await fetchAllocationDetails()

      // Reiniciar cantidad de ajuste después de actualización exitosa
      setAdjustmentAmount(0)
      setComment("")
    } catch (error) {
      console.error("Error de actualización:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Error al actualizar la asignación",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdjustment = (amount) => {
    setAllocatedStock(Math.max(0, allocatedStock + amount))
  }

  const resetToOriginal = () => {
    setAllocatedStock(originalStock)
    setAdjustmentAmount(0)
  }

  // Estado de carga
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-violet-500 border-t-transparent"></div>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/machinematerial")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Lista
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              Material: {material?.reference || "N/A"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Máquina: {machine?.name || "N/A"}
            </Badge>
            {machine?.factory && (
              <Badge variant="outline" className="px-3 py-1">
                <Building2 className="w-3 h-3 mr-1" />
                Fábrica: {machine.factory.name}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Ajuste de Stock
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial de Asignaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle>Editar Asignación de Material</CardTitle>
                <CardDescription>Actualizar la asignación de stock para esta máquina</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                          <Package className="w-4 h-4 text-violet-500" />
                          Información del Material
                        </h3>
                        <div className="p-4 border rounded-md bg-muted/50">
                          <div className="grid gap-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Referencia</Label>
                              <p className="font-medium">{material?.reference || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Descripción</Label>
                              <p className="font-medium">{material?.description || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Stock Actual</Label>
                              <p className="font-medium">{material?.currentStock ?? "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Fabricante</Label>
                              <p className="font-medium">{material?.manufacturer || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                          <Settings className="w-4 h-4 text-violet-500" />
                          Información de la Máquina
                        </h3>
                        <div className="p-4 border rounded-md bg-muted/50">
                          <div className="grid gap-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Nombre</Label>
                              <p className="font-medium">{machine?.name || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Descripción</Label>
                              <p className="font-medium">{machine?.description || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Estado</Label>
                              <p className="font-medium capitalize">
                                {machine?.status === "active"
                                  ? "activa"
                                  : machine?.status === "maintenance"
                                    ? "mantenimiento"
                                    : machine?.status === "inactive"
                                      ? "inactiva"
                                      : machine?.status || "N/A"}
                              </p>
                            </div>
                            {machine?.factory && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Fábrica</Label>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium">{machine.factory.name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Ajuste de Stock</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetToOriginal}
                            className="h-8 px-2 text-xs bg-transparent"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reiniciar
                          </Button>
                        </div>
                      </div>

                      {/* Visualización de asignación actual */}
                      <div className="p-4 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Asignación Actual</span>
                          <span className="text-lg font-medium">{originalStock}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Nueva Asignación</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{calculatedNewStock}</span>
                            {stockDifference !== 0 && (
                              <Badge
                                variant={stockDifference > 0 ? "default" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                {stockDifference > 0 ? (
                                  <>
                                    <TrendingUp className="w-3 h-3" />+{stockDifference}
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="w-3 h-3" />
                                    {stockDifference}
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controles de ajuste */}
                      <div className="space-y-2">
                        <Label htmlFor="allocatedStock">Establecer Valor Exacto de Stock</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuickAdjustment(-1)}
                            disabled={allocatedStock <= 0}
                            className="w-10 h-10"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            id="allocatedStock"
                            type="number"
                            min="0"
                            value={allocatedStock}
                            onChange={(e) => setAllocatedStock(Math.max(0, Number.parseInt(e.target.value) || 0))}
                            className="h-10 text-lg font-medium text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuickAdjustment(1)}
                            className="w-10 h-10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Visualización del impacto en el stock */}
                      {stockDifference !== 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-4 border rounded-md bg-muted/30"
                        >
                          <h4 className="mb-2 font-medium">Impacto en el Stock</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Stock Total Disponible</span>
                              <span className="font-medium">{maxAvailableStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Actualmente Asignado</span>
                              <span className="font-medium">{originalStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Nueva Asignación</span>
                              <span className="font-medium">{calculatedNewStock}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Stock Disponible Restante</span>
                              <span className={`font-medium ${availableAfterAdjustment < 0 ? "text-red-600" : ""}`}>
                                {availableAfterAdjustment}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Alertas de advertencia */}
                      <AnimatePresence>
                        {availableAfterAdjustment < 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <Alert variant="destructive">
                              <AlertCircle className="w-4 h-4" />
                              <AlertTitle>No hay suficiente stock disponible</AlertTitle>
                              <AlertDescription>
                                Estás intentando asignar {calculatedNewStock} unidades, pero solo {maxAvailableStock}{" "}
                                están disponibles en total.
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}

                        {stockDifference !== 0 && availableAfterAdjustment >= 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <Alert
                              variant={stockDifference > 0 ? "warning" : "default"}
                              className={
                                stockDifference > 0 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                              }
                            >
                              <AlertCircle
                                className={`w-4 h-4 ${stockDifference > 0 ? "text-amber-600" : "text-blue-600"}`}
                              />
                              <AlertTitle className={stockDifference > 0 ? "text-amber-800" : "text-blue-800"}>
                                {stockDifference > 0 ? "Agregando Stock" : "Removiendo Stock"}
                              </AlertTitle>
                              <AlertDescription className={stockDifference > 0 ? "text-amber-700" : "text-blue-700"}>
                                {stockDifference > 0
                                  ? `Estás agregando ${stockDifference} unidades a esta máquina. Esto reducirá el stock disponible del material en la misma cantidad.`
                                  : `Estás removiendo ${-stockDifference} unidades de esta máquina. Esto devolverá stock al inventario del material.`}
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Campo de comentario */}
                      <div className="space-y-2">
                        <Label htmlFor="comment">Comentario (Opcional)</Label>
                        <Input
                          id="comment"
                          placeholder="Razón del ajuste..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Si se deja vacío, se generará un comentario predeterminado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={saving || stockDifference === 0 || availableAfterAdjustment < 0}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                          Guardando...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Actualizar Asignación
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle>Historial de Asignaciones</CardTitle>
                <CardDescription>
                  Seguir los cambios en esta asignación de material a lo largo del tiempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Fecha</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Anterior</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Nuevo</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Cambio</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Comentario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allocation?.history?.length > 0 ? (
                        allocation.history.map((entry, index) => {
                          const change = (entry.newStock || 0) - (entry.previousStock || 0)
                          return (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-sm">
                                {entry.date ? new Date(entry.date).toLocaleString("es-ES") : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.previousStock ?? "N/A"}</td>
                              <td className="px-4 py-3 text-sm">{entry.newStock ?? "N/A"}</td>
                              <td className="px-4 py-3 text-sm">
                                <Badge
                                  variant={change > 0 ? "default" : change < 0 ? "destructive" : "outline"}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {change > 0 ? (
                                    <>
                                      <TrendingUp className="w-3 h-3" />+{change}
                                    </>
                                  ) : change < 0 ? (
                                    <>
                                      <TrendingDown className="w-3 h-3" />
                                      {change}
                                    </>
                                  ) : (
                                    "Sin cambio"
                                  )}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.comment || "Sin comentario"}</td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-sm text-center text-muted-foreground">
                            No hay historial disponible
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Superposición de animación de éxito */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex flex-col items-center p-8 bg-white rounded-lg dark:bg-gray-800"
            >
              <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
              <h2 className="text-xl font-bold">¡Stock Actualizado!</h2>
              <p className="mt-2 text-center text-muted-foreground">
                {stockDifference > 0
                  ? `Se agregaron ${stockDifference} unidades a esta máquina`
                  : `Se removieron ${-stockDifference} unidades de esta máquina`}
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineEdit
