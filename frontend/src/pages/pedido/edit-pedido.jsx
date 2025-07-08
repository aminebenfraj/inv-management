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

  // Reference data
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

  // Validate ID before fetching data
  useEffect(() => {
    // Check if ID is valid (not undefined, null, or empty)
    if (id && id !== "undefined" && id !== "null" && id.trim() !== "") {
      setIsValidId(true)
    } else {
      setIsValidId(false)
      toast({
        variant: "destructive",
        title: "Invalid Order ID",
        description: "The order ID is invalid or missing.",
      })
      // Redirect back to the orders list
      navigate("/pedido")
    }
  }, [id, navigate, toast])

  // Fetch reference data and pedido on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isValidId) return // Don't fetch if ID is invalid

      setIsLoading(true)
      try {
        // First fetch all reference data
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

        // Then fetch the pedido data
        try {
          const pedidoData = await getPedidoById(id)

          // Format dates
          const formattedPedido = {
            ...pedidoData,
            fechaSolicitud: pedidoData.fechaSolicitud ? new Date(pedidoData.fechaSolicitud) : new Date(),
            introducidaSAP: pedidoData.introducidaSAP ? new Date(pedidoData.introducidaSAP) : null,
            aceptado: pedidoData.aceptado ? new Date(pedidoData.aceptado) : null,
            date_receiving: pedidoData.date_receiving ? new Date(pedidoData.date_receiving) : null,
            // Extract IDs from populated fields
            tipo: pedidoData.tipo?._id || "",
            referencia: pedidoData.referencia?._id || "",
            solicitante: pedidoData.solicitante?._id || "",
            proveedor: pedidoData.proveedor?._id || "",
            table_status: pedidoData.table_status?._id || "",
          }

          setPedido(formattedPedido)

          // If material is selected, fetch machines with this material
          if (formattedPedido.referencia) {
            fetchMachinesWithMaterial(formattedPedido.referencia)
          }
        } catch (pedidoError) {
          console.error("Error fetching pedido:", pedidoError)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load order data. Please try again.",
          })
          // Redirect back to the orders list
          navigate("/pedido")
          return
        }
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load reference data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, isValidId, navigate, toast])

  // Filter materials when search term changes
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

    // Handle numeric fields
    if (["cantidad", "precioUnidad", "importePedido", "ano", "days"].includes(name)) {
      const numValue = name === "ano" ? Number.parseInt(value) : Number.parseFloat(value)
      setPedido((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }))
    } else {
      setPedido((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    setPedido((prev) => ({ ...prev, [name]: value }))

    // If material (referencia) is selected, fetch its details
    if (name === "referencia" && value) {
      fetchMaterialDetails(value)
    }
  }

  const fetchMaterialDetails = async (materialId) => {
    try {
      const material = await getMaterialById(materialId)
      if (material) {
        // Update pedido with material details
        setPedido((prev) => ({
          ...prev,
          fabricante: material.manufacturer || "",
          descripcionProveedor: material.description || "",
          proveedor: material.supplier?._id || "",
          precioUnidad: material.price || 0,
          cantidad: material.orderLot || 1, // Auto-fill quantity with orderLot
        }))

        // Fetch machines that have this material
        fetchMachinesWithMaterial(materialId)
      }
    } catch (error) {
      console.error("Error fetching material details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load material details. Please try again.",
      })
    }
  }

  const fetchMachinesWithMaterial = async (materialId) => {
    // This is a placeholder - implement the actual API call to get machines with this material
    try {
      // Example API call - replace with your actual implementation
      // const machines = await getMachinesWithMaterial(materialId)
      // setMachinesWithMaterial(machines)

      // For now, we'll just set an empty array
      setMachinesWithMaterial([])
    } catch (error) {
      console.error("Error fetching machines with material:", error)
      setMachinesWithMaterial([])
    }
  }

  const handleDateChange = (name, date) => {
    setPedido((prev) => {
      const updatedPedido = { ...prev, [name]: date }

      // If acceptance date changes, calculate receiving date based on days
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

  // Calculate total amount when quantity or unit price changes
  useEffect(() => {
    calculateImporte()
  }, [pedido.cantidad, pedido.precioUnidad])

  // Recalculate receiving date when days change
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
        title: "Invalid Order ID",
        description: "Cannot update order with invalid ID.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Validate required fields
      if (!pedido.tipo) throw new Error("Type is required")
      if (!pedido.referencia) throw new Error("Material reference is required")
      if (!pedido.solicitante) throw new Error("Requester is required")
      if (!pedido.cantidad || pedido.cantidad <= 0) throw new Error("Quantity must be greater than 0")

      await updatePedido(id, pedido)
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      navigate("/pedido")
    } catch (error) {
      console.error("Error saving pedido:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update order. Please try again.",
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
              <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
              <p className="text-muted-foreground">
                Editing order reference:{" "}
                {pedido.referencia ? materials.find((m) => m._id === pedido.referencia)?.reference : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" type="button" onClick={() => navigate("/pedido")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} onClick={handleSubmit} className="px-6">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="justify-start w-full mb-6">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="product">Product Details</TabsTrigger>
              <TabsTrigger value="order">Order Details</TabsTrigger>
              <TabsTrigger value="status">Status Information</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="pb-10 space-y-6">
                <TabsContent value="basic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Enter the basic details of the order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Type</Label>
                          <Select
                            value={pedido.tipo}
                            onValueChange={(value) => handleSelectChange("tipo", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
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
                          <Label htmlFor="solicitante">Requester</Label>
                          <Select
                            value={pedido.solicitante}
                            onValueChange={(value) => handleSelectChange("solicitante", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a requester" />
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
                          <Label htmlFor="ano">Year</Label>
                          <Select
                            value={pedido.ano.toString()}
                            onValueChange={(value) => handleSelectChange("ano", Number.parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
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
                          <Label htmlFor="descripcionInterna">Internal Description</Label>
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
                      <CardTitle>Product Details</CardTitle>
                      <CardDescription>Enter the details about the product being ordered</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="referencia">Material (Reference) *</Label>
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search materials..."
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
                            <SelectValue placeholder="Select a material" />
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
                          <h4 className="mb-2 font-medium">Material Details</h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Manufacturer</Label>
                              <p className="font-medium">{pedido.fabricante || "N/A"}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Provider</Label>
                              <p className="font-medium">
                                {pedido.proveedor
                                  ? materials.find((m) => m.supplier?._id === pedido.proveedor)?.supplier?.name || "N/A"
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-sm text-muted-foreground">Description</Label>
                              <p className="font-medium">{pedido.descripcionProveedor || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {machinesWithMaterial.length > 0 && (
                        <div className="p-4 mt-2 border rounded-md bg-muted/50">
                          <h4 className="mb-2 font-medium">Machines with this Material</h4>
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
                          <Label htmlFor="fabricante">Manufacturer</Label>
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
                        <Label htmlFor="descripcionProveedor">Provider Description</Label>
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
                      <CardTitle>Order Details</CardTitle>
                      <CardDescription>Enter the quantity, price, and other order details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="cantidad">Quantity</Label>
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
                          <Label htmlFor="precioUnidad">Unit Price (€)</Label>
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
                          <Label htmlFor="importePedido">Total Amount (€)</Label>
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
                        <Label htmlFor="fechaSolicitud">Request Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start w-full font-normal text-left">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {pedido.fechaSolicitud ? format(pedido.fechaSolicitud, "PPP") : <span>Pick a date</span>}
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
                        <Label htmlFor="comentario">Comments</Label>
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
                      <CardTitle>Status Information</CardTitle>
                      <CardDescription>Enter the status details of the order</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="table_status">Table Status</Label>
                          <Select
                            value={pedido.table_status}
                            onValueChange={(value) => handleSelectChange("table_status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
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
                          <Label htmlFor="introducidaSAP">SAP Entry Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start w-full font-normal text-left">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {pedido.introducidaSAP ? (
                                  format(pedido.introducidaSAP, "PPP")
                                ) : (
                                  <span>Pick a date</span>
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
                          <Label htmlFor="aceptado">Acceptance Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="justify-start w-full font-normal text-left">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {pedido.aceptado ? format(pedido.aceptado, "PPP") : <span>Pick a date</span>}
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
                          <Label htmlFor="days">Days</Label>
                          <Input
                            id="days"
                            name="days"
                            type="number"
                            value={pedido.days || ""}
                            onChange={handleInputChange}
                            min="1"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Number of days for delivery after acceptance
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="direccion">Delivery Address</Label>
                          <Input
                            id="direccion"
                            name="direccion"
                            value={pedido.direccion}
                            onChange={handleInputChange}
                            placeholder="Enter delivery address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_receiving">Receiving Date (Auto-calculated)</Label>
                          <Input
                            id="date_receiving"
                            name="date_receiving"
                            value={
                              pedido.date_receiving
                                ? format(new Date(pedido.date_receiving), "PPP")
                                : "Will be calculated after acceptance"
                            }
                            readOnly
                            className="bg-muted"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            This date is calculated as acceptance date + delivery days
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="recepcionado">Received</Label>
                          <Select
                            value={pedido.recepcionado}
                            onValueChange={(value) => handleSelectChange("recepcionado", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select reception status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Si">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Parcial">Partial</SelectItem>
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
