"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getAllMaterials, getMaterialById } from "@/apis/gestionStockApi/materialApi"
import { getAllMachines } from "@/apis/gestionStockApi/machineApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { allocateStock } from "@/apis/gestionStockApi/materialMachineApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trash2,
  Plus,
  Save,
  AlertCircle,
  Building2,
  Search,
  Package,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Factory,
  Cog,
  Box,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MainLayout from "@/components/MainLayout"

const MaterialMachineCreate = () => {
  const { toast } = useToast()

  // Data states
  const [materials, setMaterials] = useState([])
  const [machines, setMachines] = useState([])
  const [factories, setFactories] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [filteredMachines, setFilteredMachines] = useState([])

  // Selection states
  const [selectedFactory, setSelectedFactory] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [materialDetails, setMaterialDetails] = useState(null)

  // Filter states
  const [materialSearch, setMaterialSearch] = useState("")
  const [machineSearch, setMachineSearch] = useState("")
  const [materialStockFilter, setMaterialStockFilter] = useState("all")
  const [machineStatusFilter, setMachineStatusFilter] = useState("all")
  const [criticalFilter, setCriticalFilter] = useState(false)

  // Allocation states
  const [allocations, setAllocations] = useState([{ machineId: "", allocatedStock: 0 }])
  const [totalAllocated, setTotalAllocated] = useState(0)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingData(true)
      try {
        await Promise.all([fetchFactories(), fetchAllMaterials(), fetchAllMachines()])
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchInitialData()
  }, [])

  // Filter materials when factory or filters change
  useEffect(() => {
    filterMaterials()
  }, [materials, selectedFactory, materialSearch, materialStockFilter, criticalFilter])

  // Filter machines when factory or filters change
  useEffect(() => {
    filterMachines()
  }, [machines, selectedFactory, machineSearch, machineStatusFilter])

  // Fetch material details when selected
  useEffect(() => {
    if (selectedMaterial) {
      fetchMaterialDetails(selectedMaterial)
    } else {
      setMaterialDetails(null)
    }
  }, [selectedMaterial])

  // Calculate total allocated
  useEffect(() => {
    const total = allocations.reduce((sum, allocation) => {
      return sum + (Number.parseInt(allocation.allocatedStock, 10) || 0)
    }, 0)
    setTotalAllocated(total)
  }, [allocations])

  // Reset allocations when material or factory changes
  useEffect(() => {
    setAllocations([{ machineId: "", allocatedStock: 0 }])
  }, [selectedMaterial, selectedFactory])

  const fetchFactories = async () => {
    try {
      const response = await getAllFactories(1, 100)
      const factoriesData = Array.isArray(response) ? response : response?.data || []
      setFactories(factoriesData)
    } catch (error) {
      console.error("Error fetching factories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch factories",
        variant: "destructive",
      })
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await getAllMaterials(1, 100) // Changed from 1000 to 100
      const materialsData = response?.data || response || []
      setMaterials(Array.isArray(materialsData) ? materialsData : [])
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      })
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await getAllMachines(1, 100) // Changed from 1000 to 100
      const machinesData = response?.data || response || []
      setMachines(Array.isArray(machinesData) ? machinesData : [])
    } catch (error) {
      console.error("Error fetching machines:", error)
      toast({
        title: "Error",
        description: "Failed to fetch machines",
        variant: "destructive",
      })
    }
  }

  const fetchAllMaterials = async () => {
    try {
      let allMaterials = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await getAllMaterials(page, 100)
        const materialsData = response?.data || response || []

        if (Array.isArray(materialsData) && materialsData.length > 0) {
          allMaterials = [...allMaterials, ...materialsData]
          page++

          // Check if we got less than 100 records (last page)
          if (materialsData.length < 100) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      setMaterials(allMaterials)
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      })
    }
  }

  const fetchAllMachines = async () => {
    try {
      let allMachines = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await getAllMachines(page, 100)
        const machinesData = response?.data || response || []

        if (Array.isArray(machinesData) && machinesData.length > 0) {
          allMachines = [...allMachines, ...machinesData]
          page++

          // Check if we got less than 100 records (last page)
          if (machinesData.length < 100) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      setMachines(allMachines)
    } catch (error) {
      console.error("Error fetching machines:", error)
      toast({
        title: "Error",
        description: "Failed to fetch machines",
        variant: "destructive",
      })
    }
  }

  const fetchMaterialDetails = async (materialId) => {
    try {
      const data = await getMaterialById(materialId)
      setMaterialDetails(data)
    } catch (error) {
      console.error("Error fetching material details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch material details",
        variant: "destructive",
      })
    }
  }

  const filterMaterials = () => {
    let filtered = materials

    // Filter by factory
    if (selectedFactory && selectedFactory !== "all") {
      filtered = filtered.filter((material) => material.factory?._id === selectedFactory)
    }

    // Filter by search
    if (materialSearch) {
      filtered = filtered.filter(
        (material) =>
          material.reference?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          material.description?.toLowerCase().includes(materialSearch.toLowerCase()) ||
          material.manufacturer?.toLowerCase().includes(materialSearch.toLowerCase()),
      )
    }

    // Filter by stock status
    if (materialStockFilter !== "all") {
      filtered = filtered.filter((material) => {
        switch (materialStockFilter) {
          case "in_stock":
            return material.currentStock > material.minimumStock
          case "low_stock":
            return material.currentStock <= material.minimumStock && material.currentStock > 0
          case "out_of_stock":
            return material.currentStock <= 0
          default:
            return true
        }
      })
    }

    // Filter by critical
    if (criticalFilter) {
      filtered = filtered.filter((material) => material.critical)
    }

    setFilteredMaterials(filtered)
  }

  const filterMachines = () => {
    let filtered = machines

    // Filter by factory
    if (selectedFactory && selectedFactory !== "all") {
      filtered = filtered.filter((machine) => machine.factory?._id === selectedFactory)
    }

    // Filter by search
    if (machineSearch) {
      filtered = filtered.filter(
        (machine) =>
          machine.name?.toLowerCase().includes(machineSearch.toLowerCase()) ||
          machine.description?.toLowerCase().includes(machineSearch.toLowerCase()),
      )
    }

    // Filter by status
    if (machineStatusFilter !== "all") {
      filtered = filtered.filter((machine) => machine.status === machineStatusFilter)
    }

    setFilteredMachines(filtered)
  }

  const getStockStatusBadge = (material) => {
    if (material.currentStock <= 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Out of Stock
        </Badge>
      )
    }
    if (material.currentStock <= material.minimumStock) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
        <CheckCircle className="w-3 h-3" />
        In Stock
      </Badge>
    )
  }

  const getMachineStatusBadge = (machine) => {
    switch (machine.status) {
      case "active":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-amber-100 text-amber-800">
            <Settings className="w-3 h-3" />
            Maintenance
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{machine.status}</Badge>
    }
  }

  const handleFactoryChange = (value) => {
    setSelectedFactory(value)
    setSelectedMaterial("")
    setMaterialDetails(null)
  }

  const handleMaterialSelect = (materialId) => {
    setSelectedMaterial(materialId)
  }

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...allocations]

    if (field === "allocatedStock") {
      value = Number.parseInt(value, 10) || 0
      if (value < 0) value = 0
    }

    newAllocations[index][field] = value
    setAllocations(newAllocations)
  }

  const addAllocation = () => {
    setAllocations([...allocations, { machineId: "", allocatedStock: 0 }])
  }

  const removeAllocation = (index) => {
    if (allocations.length > 1) {
      const newAllocations = allocations.filter((_, i) => i !== index)
      setAllocations(newAllocations)
    }
  }

  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedFactory) {
      toast({
        title: "Error",
        description: "Please select a factory",
        variant: "destructive",
      })
      return
    }

    if (!selectedMaterial) {
      toast({
        title: "Error",
        description: "Please select a material",
        variant: "destructive",
      })
      return
    }

    const invalidAllocation = allocations.find(
      (alloc) => !alloc.machineId || Number.parseInt(alloc.allocatedStock, 10) <= 0,
    )

    if (invalidAllocation) {
      toast({
        title: "Error",
        description: "All allocations must have a machine selected and quantity greater than 0",
        variant: "destructive",
      })
      return
    }

    const machineIds = allocations.map((a) => a.machineId)
    const hasDuplicates = machineIds.length !== new Set(machineIds).size
    if (hasDuplicates) {
      toast({
        title: "Error",
        description: "Each machine can only appear once in allocations",
        variant: "destructive",
      })
      return
    }

    if (materialDetails && totalAllocated > materialDetails.currentStock) {
      toast({
        title: "Error",
        description: `Total allocation (${totalAllocated}) exceeds available stock (${materialDetails.currentStock})`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const userId = localStorage.getItem("userId")

      const formattedAllocations = allocations.map((alloc) => ({
        ...alloc,
        allocatedStock: Number.parseInt(alloc.allocatedStock, 10),
      }))

      const requestPayload = {
        materialId: selectedMaterial,
        allocations: formattedAllocations,
      }

      if (userId && isValidObjectId(userId)) {
        requestPayload.userId = userId
      }

      const response = await allocateStock(requestPayload)

      toast({
        title: "Success",
        description: "Stock allocated successfully",
      })

      if (response && response.updatedStock !== undefined) {
        setMaterialDetails({
          ...materialDetails,
          currentStock: response.updatedStock,
        })
      } else {
        fetchMaterialDetails(selectedMaterial)
      }

      setAllocations([{ machineId: "", allocatedStock: 0 }])
    } catch (error) {
      console.error("Error allocating stock:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to allocate stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getSelectedFactoryName = () => {
    if (!selectedFactory || selectedFactory === "all") return "All Factories"
    const factory = factories.find((f) => f._id === selectedFactory)
    return factory ? factory.name : "Unknown Factory"
  }

  if (loadingData) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading data...</span>
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Material Allocation System</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Allocate materials to machines within your selected factory
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Factory & Material Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Factory Selection */}
            <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Factory className="w-5 h-5" />
                  Step 1: Select Factory
                </CardTitle>
                <CardDescription>Choose the factory where you want to allocate materials</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedFactory} onValueChange={handleFactoryChange}>
                  <SelectTrigger className="w-full bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Select a factory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        All Factories
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

                {selectedFactory && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Selected Factory: <span className="text-blue-600">{getSelectedFactoryName()}</span>
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-300">
                      <span>Materials: {filteredMaterials.length}</span>
                      <span>Machines: {filteredMachines.length}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Material Selection */}
            {selectedFactory && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                      <Package className="w-5 h-5" />
                      Step 2: Select Material
                    </CardTitle>
                    <CardDescription>Choose the material you want to allocate to machines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="materials" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="materials">Materials</TabsTrigger>
                        <TabsTrigger value="filters">Filters</TabsTrigger>
                      </TabsList>

                      <TabsContent value="materials" className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search materials by reference, description, or manufacturer..."
                            className="pl-10"
                            value={materialSearch}
                            onChange={(e) => setMaterialSearch(e.target.value)}
                          />
                        </div>

                        <ScrollArea className="h-64 w-full rounded-md border p-4">
                          <div className="space-y-2">
                            {filteredMaterials.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No materials found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                              </div>
                            ) : (
                              filteredMaterials.map((material) => (
                                <div
                                  key={material._id}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedMaterial === material._id
                                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                      : "border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800"
                                  }`}
                                  onClick={() => handleMaterialSelect(material._id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{material.reference}</span>
                                        {material.critical && (
                                          <Badge variant="destructive" className="text-xs">
                                            Critical
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                        {material.manufacturer}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {material.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-medium">Stock: {material.currentStock}</span>
                                        {getStockStatusBadge(material)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="filters" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="stock-filter">Stock Status</Label>
                            <Select value={materialStockFilter} onValueChange={setMaterialStockFilter}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Stock Levels</SelectItem>
                                <SelectItem value="in_stock">In Stock</SelectItem>
                                <SelectItem value="low_stock">Low Stock</SelectItem>
                                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              type="checkbox"
                              id="critical-filter"
                              checked={criticalFilter}
                              onChange={(e) => setCriticalFilter(e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor="critical-filter" className="text-sm">
                              Show only critical materials
                            </Label>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setMaterialSearch("")
                            setMaterialStockFilter("all")
                            setCriticalFilter(false)
                          }}
                          className="w-full"
                        >
                          Clear Filters
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Machine Allocation */}
            {selectedMaterial && materialDetails && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                      <Cog className="w-5 h-5" />
                      Step 3: Allocate to Machines
                    </CardTitle>
                    <CardDescription>Select machines and specify allocation quantities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4">
                        {/* Machine Search */}
                        <div className="flex gap-4">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search machines..."
                              className="pl-10"
                              value={machineSearch}
                              onChange={(e) => setMachineSearch(e.target.value)}
                            />
                          </div>
                          <Select value={machineStatusFilter} onValueChange={setMachineStatusFilter}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Allocations */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Machine Allocations</h4>
                            <Button type="button" variant="outline" size="sm" onClick={addAllocation}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Allocation
                            </Button>
                          </div>

                          {allocations.map((allocation, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="grid grid-cols-[1fr_120px_40px] gap-3 items-end p-3 border rounded-lg bg-white dark:bg-gray-800"
                            >
                              <div>
                                <Label htmlFor={`machine-${index}`}>Machine</Label>
                                <Select
                                  value={allocation.machineId}
                                  onValueChange={(value) => handleAllocationChange(index, "machineId", value)}
                                >
                                  <SelectTrigger id={`machine-${index}`}>
                                    <SelectValue placeholder="Select machine" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filteredMachines.length > 0 ? (
                                      filteredMachines.map((machine) => (
                                        <SelectItem key={machine._id} value={machine._id}>
                                          <div className="flex items-center justify-between w-full">
                                            <span>{machine.name}</span>
                                            <div className="ml-2">{getMachineStatusBadge(machine)}</div>
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-machines" disabled>
                                        No machines available
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                                <Input
                                  id={`quantity-${index}`}
                                  type="number"
                                  min="1"
                                  value={allocation.allocatedStock}
                                  onChange={(e) => handleAllocationChange(index, "allocatedStock", e.target.value)}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAllocation(index)}
                                disabled={allocations.length === 1}
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                          <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                              <div className="flex items-center">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </div>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Allocations
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Summary & Details */}
          <div className="space-y-6">
            {/* Material Details */}
            {materialDetails && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5" />
                      Material Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Reference</p>
                      <p className="font-medium">{materialDetails.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Manufacturer</p>
                      <p className="font-medium">{materialDetails.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Current Stock</p>
                      <p className="font-medium text-lg">{materialDetails.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Minimum Stock</p>
                      <p className="font-medium">{materialDetails.minimumStock}</p>
                    </div>
                    {materialDetails.category && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Category</p>
                        <p className="font-medium">{materialDetails.category.name}</p>
                      </div>
                    )}
                    <div className="pt-2">{getStockStatusBadge(materialDetails)}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Allocation Summary */}
            {materialDetails && allocations.some((a) => a.machineId || a.allocatedStock > 0) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Allocation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Allocated:</span>
                        <span className="font-medium">{totalAllocated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available Stock:</span>
                        <span className="font-medium">{materialDetails.currentStock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span
                          className={`font-medium ${
                            materialDetails.currentStock - totalAllocated < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {materialDetails.currentStock - totalAllocated}
                        </span>
                      </div>

                      {totalAllocated > materialDetails.currentStock && (
                        <Alert variant="destructive">
                          <AlertCircle className="w-4 h-4" />
                          <AlertTitle>Allocation Exceeds Stock</AlertTitle>
                          <AlertDescription>You're trying to allocate more than available stock.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Important Notice */}
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">Important</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Allocating stock to machines will reduce the material's current stock. The allocated stock will be
                subtracted from the material's available inventory.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineCreate
