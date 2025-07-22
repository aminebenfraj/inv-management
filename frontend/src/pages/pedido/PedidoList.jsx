"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getAllPedidos, deletePedido, getFilterOptions } from "../../apis/pedido/pedidoApi"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  MoreHorizontal,
  FileText,
  Trash2,
  Edit,
  Filter,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Box,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import MainLayout from "@/components/MainLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "../../components/ui/date-picker"

// Variantes de animación
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const PedidoList = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pedidoToDelete, setPedidoToDelete] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    tipo: [],
    fabricante: [],
    proveedor: [],
    solicitante: [],
    recepcionado: [],
    pedir: [],
    ano: [],
    table_status: [],
  })

  const [filters, setFilters] = useState({
    tipo: "",
    fabricante: "",
    proveedor: "",
    solicitante: "",
    recepcionado: "",
    pedir: "",
    anoDesde: "",
    anoHasta: "",
    fechaDesde: null,
    fechaHasta: null,
    table_status: "",
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [sortConfig, setSortConfig] = useState({
    field: "fechaSolicitud",
    order: -1,
  })

  // Debounce de búsqueda para evitar demasiadas solicitudes
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Cargar opciones de filtro al montar el componente
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = {}
      const fields = ["tipo", "fabricante", "proveedor", "solicitante", "recepcionado", "pedir", "ano", "table_status"]

      // Usar Promise.all para solicitudes paralelas
      const results = await Promise.all(fields.map((field) => getFilterOptions(field)))

      // Mapear resultados a sus respectivos campos
      fields.forEach((field, index) => {
        options[field] = results[index]
      })

      setFilterOptions(options)
    } catch (error) {
      console.error("Error al cargar opciones de filtro:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar las opciones de filtro",
      })
    }
  }, [toast])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  const handleFilterChange = (field, value) => {
    // Si el valor es "all", establecer como cadena vacía para cualquier campo
    if (value === "all") {
      setFilters((prev) => ({
        ...prev,
        [field]: "",
      }))
      return
    }

    // Para todos los demás campos
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const fetchPedidos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Crear una copia limpia de filtros para la API
      const apiFilters = {}

      // Procesar cada filtro y solo agregar valores no vacíos
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== null) {
          apiFilters[key] = value
        }
      })

      const response = await getAllPedidos(pagination.page, pagination.limit, debouncedSearch, apiFilters, sortConfig)

      if (response && response.data) {
        setPedidos(response.data)

        setPagination({
          ...pagination,
          page: response.page || 1,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        })
      } else {
        setError("Datos inválidos recibidos del servidor.")
      }
    } catch (error) {
      console.error("Error al obtener pedidos:", error)
      setError("Error al cargar los pedidos. Por favor, inténtalo de nuevo más tarde.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los pedidos. Por favor, inténtalo de nuevo más tarde.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filters, sortConfig, toast])

  // Obtener pedidos cuando cambian paginación, búsqueda, filtros
  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters, debouncedSearch])

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const handleSortChange = (field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        // Alternar orden si es el mismo campo
        return { field, order: prev.order === 1 ? -1 : 1 }
      }
      // Por defecto descendente para nuevo campo
      return { field, order: -1 }
    })
  }

  const confirmDelete = (pedido) => {
    setPedidoToDelete(pedido)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!pedidoToDelete) return

    try {
      await deletePedido(pedidoToDelete._id)
      setPedidos(pedidos.filter((pedido) => pedido._id !== pedidoToDelete._id))
      toast({
        title: "Éxito",
        description: "Pedido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error al eliminar el pedido:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el pedido. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setDeleteDialogOpen(false)
      setPedidoToDelete(null)
    }
  }

  const clearFilters = () => {
    setFilters({
      tipo: "",
      fabricante: "",
      proveedor: "",
      solicitante: "",
      recepcionado: "",
      pedir: "",
      anoDesde: "",
      anoHasta: "",
      fechaDesde: null,
      fechaHasta: null,
      table_status: "",
    })
    setSearchTerm("")
  }

  const getStatusFromPedido = (pedido) => {
    if (pedido.recepcionado === "Si") return "completed"
    if (pedido.aceptado) return "in_progress"
    if (pedido.introducidaSAP) return "pending"
    return "cancelled"
  }

  const getStatusDetails = (status) => {
    const statusMap = {
      pending: {
        label: "Pendiente",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      },
      in_progress: {
        label: "En Progreso",
        icon: Package,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      },
      completed: {
        label: "Completado",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      },
      cancelled: {
        label: "Cancelado",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      },
    }
    return statusMap[status] || statusMap.pending
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  // Función auxiliar para extraer valores de propiedades de objetos de forma segura
  const getPropertyValue = (obj, property) => {
    if (!obj) return "N/A"

    // Si el objeto ya es una cadena, devolverla
    if (typeof obj === "string") return obj

    // Si es un objeto con una propiedad name, devolver el name
    if (typeof obj === "object" && obj !== null) {
      if (obj.name) return obj.name
      if (obj.reference) return obj.reference
      if (obj._id) return obj._id
    }

    return "N/A"
  }

  // Contar filtros activos
  const activeFilterCount = Object.values(filters).filter((value) => value !== "" && value !== null).length

  return (
    <MainLayout>
      <motion.div className="container py-6 mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
            <p className="text-muted-foreground">Rastrea y gestiona tus órdenes de compra de manera eficiente</p>
          </div>
          <Button onClick={() => navigate("/pedido/create")} className="mt-4 md:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Crear Pedido
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedidos por cualquier campo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent md:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros Avanzados
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[350px]" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros</h4>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                        <X className="w-4 h-4 mr-2" />
                        Limpiar todo
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {/* Filtro de Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo-filter">Tipo</Label>
                      <Select value={filters.tipo} onValueChange={(value) => handleFilterChange("tipo", value)}>
                        <SelectTrigger id="tipo-filter">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los Tipos</SelectItem>
                          {filterOptions.tipo.map((tipo) => (
                            <SelectItem key={tipo._id} value={tipo._id}>
                              {tipo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de Solicitante */}
                    <div className="space-y-2">
                      <Label htmlFor="solicitante-filter">Solicitante</Label>
                      <Select
                        value={filters.solicitante}
                        onValueChange={(value) => handleFilterChange("solicitante", value)}
                      >
                        <SelectTrigger id="solicitante-filter">
                          <SelectValue placeholder="Seleccionar solicitante" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los Solicitantes</SelectItem>
                          {filterOptions.solicitante.map((solicitante) => (
                            <SelectItem key={solicitante._id} value={solicitante._id}>
                              {solicitante.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de Estado de Tabla */}
                    <div className="space-y-2">
                      <Label htmlFor="table-status-filter">Estado</Label>
                      <Select
                        value={filters.table_status}
                        onValueChange={(value) => handleFilterChange("table_status", value)}
                      >
                        <SelectTrigger id="table-status-filter">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los Estados</SelectItem>
                          {filterOptions.table_status.map((status) => (
                            <SelectItem key={status._id} value={status._id}>
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 mr-2 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                ></div>
                                {status.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de Rango de Fechas */}
                    <div className="space-y-2">
                      <Label>Rango de Fecha de Solicitud</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="fecha-desde" className="text-xs">
                            Desde
                          </Label>
                          <DatePicker
                            id="fecha-desde"
                            date={filters.fechaDesde}
                            setDate={(date) => handleFilterChange("fechaDesde", date)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fecha-hasta" className="text-xs">
                            Hasta
                          </Label>
                          <DatePicker
                            id="fecha-hasta"
                            date={filters.fechaHasta}
                            setDate={(date) => handleFilterChange("fechaHasta", date)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtro de Rango de Años */}
                    <div className="space-y-2">
                      <Label>Rango de Años</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="ano-desde" className="text-xs">
                            Desde
                          </Label>
                          <Select
                            value={filters.anoDesde}
                            onValueChange={(value) => handleFilterChange("anoDesde", value)}
                          >
                            <SelectTrigger id="ano-desde">
                              <SelectValue placeholder="Desde año" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Cualquiera</SelectItem>
                              {filterOptions.ano
                                .sort((a, b) => a - b)
                                .map((ano) => (
                                  <SelectItem key={`from-${ano}`} value={ano.toString()}>
                                    {ano}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ano-hasta" className="text-xs">
                            Hasta
                          </Label>
                          <Select
                            value={filters.anoHasta}
                            onValueChange={(value) => handleFilterChange("anoHasta", value)}
                          >
                            <SelectTrigger id="ano-hasta">
                              <SelectValue placeholder="Hasta año" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Cualquiera</SelectItem>
                              {filterOptions.ano
                                .sort((a, b) => a - b)
                                .map((ano) => (
                                  <SelectItem key={`to-${ano}`} value={ano.toString()}>
                                    {ano}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border-t">
                    <Button variant="ghost" onClick={() => setIsFilterOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        fetchPedidos()
                        setIsFilterOpen(false)
                      }}
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Menú desplegable de Ordenar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent md:w-auto">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={`${sortConfig.field}-${sortConfig.order}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-")
                      setSortConfig({ field, order: Number.parseInt(order) })
                    }}
                  >
                    <DropdownMenuRadioItem value="fechaSolicitud-1">Fecha (Más Antiguo Primero)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fechaSolicitud--1">
                      Fecha (Más Reciente Primero)
                    </DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem value="importePedido-1">Importe (Menor a Mayor)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="importePedido--1">Importe (Mayor a Menor)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Cargando pedidos...</span>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Box className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No se encontraron pedidos</h3>
                <p className="mt-1 mb-4 text-muted-foreground">
                  {searchTerm || activeFilterCount > 0
                    ? "Intenta ajustar tus filtros"
                    : "Crea tu primer pedido para comenzar"}
                </p>
                {!searchTerm && activeFilterCount === 0 && (
                  <Button onClick={() => navigate("/pedido/create")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Pedido
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:text-primary" onClick={() => handleSortChange("tipo")}>
                        Tipo
                        {sortConfig.field === "tipo" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("referencia")}
                      >
                        Referencia
                        {sortConfig.field === "referencia" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("solicitante")}
                      >
                        Solicitante
                        {sortConfig.field === "solicitante" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("proveedor")}
                      >
                        Proveedor
                        {sortConfig.field === "proveedor" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("importePedido")}
                      >
                        Importe
                        {sortConfig.field === "importePedido" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("fechaSolicitud")}
                      >
                        Fecha de Solicitud
                        {sortConfig.field === "fechaSolicitud" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary"
                        onClick={() => handleSortChange("table_status")}
                      >
                        Estado
                        {sortConfig.field === "table_status" && (
                          <span className="ml-1">{sortConfig.order === 1 ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence initial={false} mode="popLayout">
                      {pedidos.map((pedido) => {
                        const status = getStatusFromPedido(pedido)
                        const statusDetails = getStatusDetails(status)
                        const StatusIcon = statusDetails.icon
                        return (
                          <motion.tr
                            key={pedido._id}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="hover:bg-muted/50"
                          >
                            <TableCell>{getPropertyValue(pedido.tipo)}</TableCell>
                            <TableCell className="font-medium">{getPropertyValue(pedido.referencia)}</TableCell>
                            <TableCell>{getPropertyValue(pedido.solicitante)}</TableCell>
                            <TableCell>{getPropertyValue(pedido.proveedor)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(pedido.importePedido)}</TableCell>
                            <TableCell>{formatDate(pedido.fechaSolicitud)}</TableCell>
                            <TableCell>
                              {pedido.table_status ? (
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: pedido.table_status.color }}
                                  ></div>
                                  <span>{pedido.table_status.name}</span>
                                </div>
                              ) : (
                                <Badge variant="secondary" className={statusDetails.className}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusDetails.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span className="sr-only">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/pedido/${pedido._id}`)}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Ver Detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/pedido/edit/${pedido._id}`)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => confirmDelete(pedido)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {pedidos.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} entradas
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo de Confirmación de Eliminación */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto eliminará permanentemente el pedido
                <span className="font-semibold"> {getPropertyValue(pedidoToDelete?.referencia)}</span>. Esta acción no
                se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </MainLayout>
  )
}

export default PedidoList
