"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllMachines, deleteMachine } from "@/apis/gestionStockApi/machineApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Settings,
  Wrench,
  PowerOff,
  RefreshCw,
  Building2,
  Filter,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ShowMachines = () => {
  const [machines, setMachines] = useState([])
  const [factories, setFactories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingFactories, setLoadingFactories] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [machineToDelete, setMachineToDelete] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFactories()
  }, [])

  useEffect(() => {
    fetchMachines()
  }, [searchTerm, statusFilter, selectedFactory])

  const fetchFactories = async () => {
    try {
      setLoadingFactories(true)
      const data = await getAllFactories(1, 100) // Get all factories
      const factoriesArray = Array.isArray(data) ? data : data?.data ? data.data : []
      setFactories(factoriesArray)
    } catch (error) {
      console.error("Error al obtener las fábricas:", error)
      setFactories([])
      toast({
        variant: "destructive",
        title: "Advertencia",
        description: "Error al cargar las fábricas. El filtrado por fábrica puede no funcionar correctamente.",
      })
    } finally {
      setLoadingFactories(false)
    }
  }

  const fetchMachines = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (selectedFactory !== "all") filters.factory = selectedFactory

      const data = await getAllMachines(1, 100, searchTerm, filters)
      setMachines(data?.data || [])
    } catch (error) {
      console.error("Error al obtener las máquinas:", error)
      setError("Error al obtener las máquinas. Por favor, inténtalo de nuevo.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al obtener las máquinas. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (machine) => {
    setMachineToDelete(machine)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!machineToDelete) return

    try {
      await deleteMachine(machineToDelete._id)
      setMachines(machines.filter((machine) => machine._id !== machineToDelete._id))
      toast({
        title: "Éxito",
        description: "¡Máquina eliminada exitosamente!",
      })
    } catch (error) {
      console.error("Error al eliminar la máquina:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la máquina. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMachineToDelete(null)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3" />
            Activa
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-200 bg-red-50">
            <PowerOff className="w-3 h-3" />
            Inactiva
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Wrench className="w-3 h-3" />
            Mantenimiento
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "inactive":
        return <PowerOff className="w-5 h-5 text-red-500" />
      case "maintenance":
        return <Wrench className="w-5 h-5 text-amber-500" />
      default:
        return <Settings className="w-5 h-5 text-gray-500" />
    }
  }

  const getSelectedFactoryName = () => {
    if (selectedFactory === "all") return "Todas las Fábricas"
    const factory = factories.find((f) => f._id === selectedFactory)
    return factory ? factory.name : "Fábrica Desconocida"
  }

  const renderSkeletons = () => {
    return Array(6)
      .fill()
      .map((_, index) => (
        <Card key={index} className="bg-gray-50 dark:bg-zinc-700">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-1/4 h-8" />
            <div className="flex justify-end pt-4 space-x-2">
              <Skeleton className="w-20 h-9" />
              <Skeleton className="w-20 h-9" />
            </div>
          </CardContent>
        </Card>
      ))
  }

  const renderGridView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {loading ? (
        renderSkeletons()
      ) : (
        <AnimatePresence>
          {machines.map((machine) => (
            <motion.div
              key={machine._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="flex flex-col h-full transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {machine.name}
                    </CardTitle>
                    {getStatusIcon(machine.status)}
                  </div>
                  {machine.factory && (
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">{machine.factory.name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-grow py-2">
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {machine.description || "Sin descripción proporcionada"}
                  </p>
                  {getStatusBadge(machine.status)}
                </CardContent>
                <CardFooter className="flex justify-end pt-2 space-x-2">
                  <Link to={`/machines/edit/${machine._id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 bg-transparent hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteClick(machine)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  )

  const filteredMachines = machines.filter((machine) => {
    if (selectedFactory !== "all" && machine.factory?._id !== selectedFactory) return false
    return true
  })

  return (
    <MainLayout>
      <div className="container py-8 mx-auto">
        <Card className="bg-white shadow-lg dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Máquinas - {getSelectedFactoryName()}
              </CardTitle>
              <CardDescription>
                {selectedFactory === "all"
                  ? "Gestiona todas las máquinas en todas las fábricas"
                  : `Gestiona las máquinas en ${getSelectedFactoryName()}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchMachines} className="bg-transparent h-9">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
              <Link to="/machines/create">
                <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Nueva Máquina
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Factory Selection */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">Seleccionar Fábrica:</span>
                </div>
                <Select value={selectedFactory} onValueChange={setSelectedFactory} disabled={loadingFactories}>
                  <SelectTrigger className="w-64 bg-white dark:bg-zinc-800">
                    <SelectValue placeholder={loadingFactories ? "Cargando..." : "Seleccionar fábrica"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Todas las Fábricas
                      </div>
                    </SelectItem>
                    {factories.map((factory) => (
                      <SelectItem key={factory._id} value={factory._id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {factory.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters and search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar máquinas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Estado:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status counts */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Activas</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                      {machines.filter((m) => m.status === "active").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Mantenimiento</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {machines.filter((m) => m.status === "maintenance").length}
                    </p>
                  </div>
                  <Wrench className="w-8 h-8 text-amber-500" />
                </CardContent>
              </Card>

              <Card className="border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Inactivas</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                      {machines.filter((m) => m.status === "inactive").length}
                    </p>
                  </div>
                  <PowerOff className="w-8 h-8 text-red-500" />
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Machines list/grid */}
            {!loading && machines.length === 0 && !error ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Settings className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No se encontraron máquinas</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || selectedFactory !== "all"
                    ? "Intenta ajustar tu búsqueda o filtros"
                    : "Comienza agregando tu primera máquina"}
                </p>
                <Link to="/machines/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Nueva Máquina
                  </Button>
                </Link>
              </div>
            ) : (
              renderGridView()
            )}
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar la máquina "{machineToDelete?.name}"? Esta acción no se puede
                deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

export default ShowMachines
