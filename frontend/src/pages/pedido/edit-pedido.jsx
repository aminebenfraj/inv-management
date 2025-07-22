"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getPedidoById, updatePedido } from "../../apis/pedido/pedidoApi"
import { getAllTipos } from "../../apis/pedido/tipoApi"
import { getAllSolicitantes } from "../../apis/pedido/solicitanteApi"
import { getAllTableStatuses } from "../../apis/pedido/tableStatusApi"
import { getAllMaterials, getMaterialById } from "../../apis/gestionStockApi/materialApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Save, ArrowLeft, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import MainLayout from "@/components/MainLayout"

function EditPedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidId, setIsValidId] = useState(false)

  // Datos de referencia
  const [tipos, setTipos] = useState([])
  const [solicitantes, setSolicitantes] = useState([])
  const [tableStatuses, setTableStatuses] = useState([])
  const [materials, setMaterials] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [materialSearch, setMaterialSearch] = useState("")
  const [machinesWithMaterial, setMachinesWithMaterial] = useState([])

  const [pedido, setPedido] = useState({
    tipo: "",
    descripcionInterna: "",
    fabricante: "",
    referencia: "",
    descripcionProveedor: "",
    solicitante: "",
    cantidad: 0,
    precioUnidad: 0,
    importePedido: 0,
    fechaSolicitud: new Date(),
    proveedor: "",
    comentario: "",
    pedir: "",
    introducidaSAP: null,
    aceptado: null,
    date_receiving: null,
    direccion: "",
    table_status: "",
    days: 0,
    recepcionado: "",
    ano: new Date().getFullYear(),
  })

  // Validar ID antes de obtener datos
  useEffect(() => {
    // Verificar si el ID es válido (no undefined, null, o vacío)
    if (id && id !== "undefined" && id !== "null" && id.trim() !== "") {
      setIsValidId(true)
    } else {
      setIsValidId(false)
      toast({
        variant: "destructive",
        title: "ID de Pedido Inválido",
        description: "El ID del pedido es inválido o falta.",
      })
      // Redirigir de vuelta a la lista de pedidos
      navigate("/pedido")
    }
  }, [id, navigate, toast])

  // Obtener datos de referencia y pedido al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      if (!isValidId) return // No obtener si el ID es inválido

      setIsLoading(true)
      try {
        // Primero obtener todos los datos de referencia
        const [tiposData, solicitantesData, tableStatusesData, materialsData] = await Promise.all([
          getAllTipos(),
          getAllSolicitantes(),
          getAllTableStatuses(),
          getAllMaterials(),
        ])

        setTipos(tiposData)
        setSolicitantes(solicitantesData)
        setTableStatuses(tableStatusesData)
        setMaterials(materialsData.data || [])
        setFilteredMaterials(materialsData.data || [])

        // Luego obtener los datos del pedido
        try {
          const pedidoData = await getPedidoById(id)

          // Formatear fechas
          const formattedPedido = {
            ...pedidoData,
            fechaSolicitud: pedidoData.fechaSolicitud ? new Date(pedidoData.fechaSolicitud) : new Date(),
            introducidaSAP: pedidoData.introducidaSAP ? new Date(pedidoData.introducidaSAP) : null,
            aceptado: pedidoData.aceptado ? new Date(pedidoData.aceptado) : null,
            date_receiving: pedidoData.date_receiving ? new Date(pedidoData.date_receiving) : null,
            // Extraer IDs de campos poblados
            tipo: pedidoData.tipo?._id || "",
            referencia: pedidoData.referencia?._id || "",
            solicitante: pedidoData.solicitante?._id || "",
            proveedor: pedidoData.proveedor?._id || "",
            table_status: pedidoData.table_status?._id || "",
          }

          setPedido(formattedPedido)

          // Si hay material seleccionado, obtener máquinas con este material
          if (formattedPedido.referencia) {
            fetchMachinesWithMaterial(formattedPedido.referencia)
          }
        } catch (pedidoError) {
          console.error("Error al obtener el pedido:", pedidoError)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al cargar los datos del pedido. Por favor, inténtalo de nuevo.",
          })
          // Redirigir de vuelta a la lista de pedidos
          navigate("/pedido")
          return
        }
      } catch (error) {
        console.error("Error al obtener datos de referencia:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos de referencia. Por favor, inténtalo de nuevo.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, isValidId, navigate, toast])

  // Filtrar materiales cuando cambia el término de búsqueda
  useEffect(() => {
    if (materialSearch.trim() === "") {
      setFilteredMaterials(materials)
    } else {
      const filtered = materials.filter(
        (material) =>
          material.reference?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          material.description?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          material.manufacturer?.toLowerCase().includes(materialSearch.toLowerCase()),
      )
      setFilteredMaterials(filtered)
    }
  }, [materialSearch, materials])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Manejar campos numéricos
    if (["cantidad", "precioUnidad", "importePedido", "ano", "days"].includes(name)) {
      const numValue = name === "ano" ? Number.parseInt(value) : Number.parseFloat(value)
      setPedido((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }))
    } else {
      setPedido((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    setPedido((prev) => ({ ...prev, [name]: value }))

    // Si se selecciona material (referencia), obtener sus detalles
    if (name === "referencia" && value) {
      fetchMaterialDetails(value)
    }
  }

  const fetchMaterialDetails = async (materialId) => {
    try {
      const material = await getMaterialById(materialId)
      if (material) {
        // Actualizar pedido con detalles del material
        setPedido((prev) => ({
          ...prev,
          fabricante: material.manufacturer || "",
          descripcionProveedor: material.description || "",
          proveedor: material.supplier?._id || "",
          precioUnidad: material.price || 0,
          cantidad: material.orderLot || 1, // Auto-llenar cantidad con orderLot
        }))

        // Obtener máquinas que tienen este material
        fetchMachinesWithMaterial(materialId)
      }
    } catch (error) {
      console.error("Error al obtener detalles del material:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los detalles del material. Por favor, inténtalo de nuevo.",
      })
    }
  }

  const fetchMachinesWithMaterial = async (materialId) => {
    // Esto es un placeholder - implementar la llamada API real para obtener máquinas con este material
    try {
      // Ejemplo de llamada API - reemplazar con tu implementación real
      // const machines = await getMachinesWithMaterial(materialId)
      // setMachinesWithMaterial(machines)

      // Por ahora, solo estableceremos un array vacío
      setMachinesWithMaterial([])
    } catch (error) {
      console.error("Error al obtener máquinas con material:", error)
      setMachinesWithMaterial([])
    }
  }

  const handleDateChange = (name, date) => {
    setPedido((prev) => {
      const updatedPedido = { ...prev, [name]: date }

      // Si cambia la fecha de aceptación, calcular fecha de recepción basada en días
      if (name === "aceptado" && date && prev.days) {
        const receivingDate = new Date(date)
        receivingDate.setDate(receivingDate.getDate() + prev.days)
        updatedPedido.date_receiving = receivingDate
      }

      return updatedPedido
    })
  }

  const calculateImporte = () => {
    const importe = pedido.cantidad * pedido.precioUnidad
    setPedido((prev) => ({ ...prev, importePedido: importe }))
  }

  // Calcular importe total cuando cambia cantidad o precio unitario
  useEffect(() => {
    calculateImporte()
  }, [pedido.cantidad, pedido.precioUnidad])

  // Recalcular fecha de recepción cuando cambian los días
  useEffect(() => {
    if (pedido.aceptado && pedido.days) {
      const receivingDate = new Date(pedido.aceptado)
      receivingDate.setDate(receivingDate.getDate() + pedido.days)
      setPedido((prev) => ({ ...prev, date_receiving: receivingDate }))
    }
  }, [pedido.days, pedido.aceptado])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isValidId) {
      toast({
        variant: "destructive",
        title: "ID de Pedido Inválido",
        description: "No se puede actualizar el pedido con ID inválido.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Validar campos requeridos
      if (!pedido.tipo) throw new Error("El tipo es requerido")
      if (!pedido.referencia) throw new Error("La referencia del material es requerida")
      if (!pedido.solicitante) throw new Error("El solicitante es requerido")
      if (!pedido.cantidad || pedido.cantidad <= 0) throw new Error("La cantidad debe ser mayor que 0")

      await updatePedido(id, pedido)
      toast({
        title: "Éxito",
        description: "Pedido actualizado exitosamente",
      })
      navigate("/pedido")
    } catch (error) {
      console.error("Error al guardar el pedido:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al actualizar el pedido. Por favor, inténtalo de nuevo.",
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
      <div className="container py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/pedido")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Pedido</h1>
              <p className="text-muted-foreground">
                Editando pedido referencia:{" "}
                {pedido.referencia ? materials.find((m) => m._id === pedido.referencia)?.reference : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" type="button" onClick={() => navigate("/pedido")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} onClick={handleSubmit} className="px-6">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="justify-start w-full mb-6">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="product">Detalles del Producto</TabsTrigger>
              <TabsTrigger value="order">Detalles del Pedido</TabsTrigger>
              <TabsTrigger value="status">Información de Estado</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="pb-10 space-y-6">
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información Básica</CardTitle>
                      <CardDescription>Ingresa los detalles básicos del pedido</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo</Label>
                          <Select
                            value={pedido.tipo}
                            onValueChange={(value) => handleSelectChange("tipo", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {tipos.map((tipo) => (
                                <SelectItem key={tipo._id} value={tipo._id}>
                                  {tipo.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="solicitante">Solicitante</Label>
                          <Select
                            value={pedido.solicitante}
                            onValueChange={(value) => handleSelectChange("solicitante", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar un solicitante" />
                            </SelectTrigger>
                            <SelectContent>
                              {solicitantes.map((solicitante) => (
                                <SelectItem key={solicitante._id} value={solicitante._id}>
                                  {solicitante.name} {solicitante.email ? `(${solicitante.email})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ano">Año</Label>
                          <Select
                            value={pedido.ano.toString()}
                            onValueChange={(value) => handleSelectChange("ano", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar año" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descripcionInterna">Descripción Interna</Label>
                          <Textarea
                            id="descripcionInterna"
                            name="descripcionInterna"
                            value={pedido.descripcionInterna}
                            onChange={handleInputChange}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="product" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles del Producto</CardTitle>
                      <CardDescription>Ingresa los detalles sobre el producto que se está pidiendo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="referencia">Material (Referencia) *</Label>
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar materiales..."
                            value={materialSearch}
                            onChange={(e) => setMaterialSearch(e.target.value)}
                          />
                        </div>
                        <Select
                          value={pedido.referencia}
                          onValueChange={(value) => handleSelectChange("referencia", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar un material" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredMaterials.map((material) => (
                              <SelectItem key={material._id} value={material._id}>
                                {material.reference} - {material.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {pedido.referencia && (
                        <div className="p-4 mt-2 border rounded-md bg-muted/50">
                          <h4 className="mb-2 font-medium">Detalles del Material</h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Fabricante</Label>
                              <p className="font-medium">{pedido.fabricante || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Proveedor</Label>
                              <p className="font-medium">
                                {pedido.proveedor
                                  ? materials.find((m) => m.supplier?._id === pedido.proveedor)?.supplier?.name || "N/A"
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-sm text-muted-foreground">Descripción</Label>
                              <p className="font-medium">{pedido.descripcionProveedor || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {machinesWithMaterial.length > 0 && (
                        <div className="p-4 mt-2 border rounded-md bg-muted/50">
                          <h4 className="mb-2 font-medium">Máquinas con este Material</h4>
                          <div className="flex flex-wrap gap-2">
                            {machinesWithMaterial.map((machine) => (
                              <Badge key={machine._id} variant="secondary">
                                {machine.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="fabricante">Fabricante</Label>
                          <Input
                            id="fabricante"
                            name="fabricante"
                            value={pedido.fabricante}
                            onChange={handleInputChange}
                            readOnly={!!pedido.referencia}
                            className={pedido.referencia ? "bg-muted" : ""}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descripcionProveedor">Descripción del Proveedor</Label>
                        <Textarea
                          id="descripcionProveedor"
                          name="descripcionProveedor"
                          value={pedido.descripcionProveedor}
                          onChange={handleInputChange}
                          rows={3}
                          readOnly={!!pedido.referencia}
                          className={pedido.referencia ? "bg-muted" : ""}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="order" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalles del Pedido</CardTitle>
                      <CardDescription>Ingresa la cantidad, precio y otros detalles del pedido</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="cantidad">Cantidad</Label>
                          <Input
                            id="cantidad"
                            name="cantidad"
                            type="number"
                            value={pedido.cantidad}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="precioUnidad">Precio Unitario (€)</Label>
                          <Input
                            id="precioUnidad"
                            name="precioUnidad"
                            type="number"
                            step="0.01"
                            value={pedido.precioUnidad}
                            onChange={handleInputChange}
                            required
                            readOnly={!!pedido.referencia}
                            className={pedido.referencia ? "bg-muted" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="importePedido">Importe Total (€)</Label>
                          <Input
                            id="importePedido"
                            name="importePedido"
                            type="number"
                            step="0.01"
                            value={pedido.importePedido}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fechaSolicitud">Fecha de Solicitud</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="justify-start w-full font-normal text-left bg-transparent"
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {pedido.fechaSolicitud ? (
                                format(pedido.fechaSolicitud, "PPP")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={pedido.fechaSolicitud}
                              onSelect={(date) => handleDateChange("fechaSolicitud", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comentario">Comentarios</Label>
                        <Textarea
                          id="comentario"
                          name="comentario"
                          value={pedido.comentario}
                          onChange={handleInputChange}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="status" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información de Estado</CardTitle>
                      <CardDescription>Ingresa los detalles de estado del pedido</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="table_status">Estado de Tabla</Label>
                          <Select
                            value={pedido.table_status}
                            onValueChange={(value) => handleSelectChange("table_status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              {tableStatuses.map((status) => (
                                <SelectItem key={status._id} value={status._id}>
                                  {status.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="introducidaSAP">Fecha de Entrada SAP</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start w-full font-normal text-left bg-transparent"
                              >
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {pedido.introducidaSAP ? (
                                  format(pedido.introducidaSAP, "PPP")
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={pedido.introducidaSAP}
                                onSelect={(date) => handleDateChange("introducidaSAP", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aceptado">Fecha de Aceptación</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start w-full font-normal text-left bg-transparent"
                              >
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {pedido.aceptado ? format(pedido.aceptado, "PPP") : <span>Seleccionar fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={pedido.aceptado}
                                onSelect={(date) => handleDateChange("aceptado", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="days">Días</Label>
                          <Input
                            id="days"
                            name="days"
                            type="number"
                            value={pedido.days || ""}
                            onChange={handleInputChange}
                            min="1"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Número de días para entrega después de la aceptación
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="direccion">Dirección de Entrega</Label>
                          <Input
                            id="direccion"
                            name="direccion"
                            value={pedido.direccion}
                            onChange={handleInputChange}
                            placeholder="Ingresa la dirección de entrega"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_receiving">Fecha de Recepción (Auto-calculada)</Label>
                          <Input
                            id="date_receiving"
                            name="date_receiving"
                            value={
                              pedido.date_receiving
                                ? format(new Date(pedido.date_receiving), "PPP")
                                : "Se calculará después de la aceptación"
                            }
                            readOnly
                            className="bg-muted"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Esta fecha se calcula como fecha de aceptación + días de entrega
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recepcionado">Recibido</Label>
                          <Select
                            value={pedido.recepcionado}
                            onValueChange={(value) => handleSelectChange("recepcionado", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado de recepción" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Si">Sí</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Parcial">Parcial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </form>
      </div>
    </MainLayout>
  )
}

export default EditPedido
