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
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Save, AlertCircle, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MainLayout from "@/components/MainLayout"

const MaterialMachineCreate = () => {
  const { toast } = useToast()
  const [materials, setMaterials] = useState([])
  const [machines, setMachines] = useState([])
  const [factories, setFactories] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [materialDetails, setMaterialDetails] = useState(null)
  const [selectedFactory, setSelectedFactory] = useState("")
  const [filteredMachines, setFilteredMachines] = useState([])
  const [allocations, setAllocations] = useState([{ machineId: "", allocatedStock: 0 }])
  const [loading, setLoading] = useState(false)
  const [totalAllocated, setTotalAllocated] = useState(0)

  useEffect(() => {
    fetchMaterials()
    fetchMachines()
    fetchFactories()
  }, [])

  useEffect(() => {
    if (selectedMaterial) {
      fetchMaterialDetails(selectedMaterial)
    } else {
      setMaterialDetails(null)
    }
  }, [selectedMaterial])

  useEffect(() => {
    // Filter machines by selected factory
    if (selectedFactory && selectedFactory !== "all") {
      const filtered = machines.filter((machine) => machine.factory?._id === selectedFactory)
      setFilteredMachines(filtered)
    } else {
      setFilteredMachines(machines)
    }

    // Reset allocations when factory changes
    setAllocations([{ machineId: "", allocatedStock: 0 }])
  }, [selectedFactory, machines])

  useEffect(() => {
    // Calculate total allocated stock
    const total = allocations.reduce((sum, allocation) => {
      return sum + (Number.parseInt(allocation.allocatedStock, 10) || 0)
    }, 0)
    setTotalAllocated(total)
  }, [allocations])

  const fetchMaterials = async () => {
    try {
      const response = await getAllMaterials(1, 100)
      if (response && response.data && Array.isArray(response.data)) {
        setMaterials(response.data)
      } else if (Array.isArray(response)) {
        setMaterials(response)
      } else {
        setMaterials([])
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      setMaterials([])
      toast({
        title: "Error",
        description: "Failed to fetch materials",
        variant: "destructive",
      })
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await getAllMachines(1, 100)
      if (response && response.data && Array.isArray(response.data)) {
        setMachines(response.data)
      } else if (Array.isArray(response)) {
        setMachines(response)
      } else {
        setMachines([])
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
      setMachines([])
      toast({
        title: "Error",
        description: "Failed to fetch machines",
        variant: "destructive",
      })
    }
  }

  const fetchFactories = async () => {
    try {
      const data = await getAllFactories()
      setFactories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching factories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch factories",
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
      setMaterialDetails(null)
      toast({
        title: "Error",
        description: "Failed to fetch material details",
        variant: "destructive",
      })
    }
  }

  const handleMaterialChange = (value) => {
    setSelectedMaterial(value)
    // Reset allocations when material changes
    setAllocations([{ machineId: "", allocatedStock: 0 }])
  }

  const handleFactoryChange = (value) => {
    setSelectedFactory(value)
  }

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...allocations]

    // Ensure allocatedStock is always a valid number
    if (field === "allocatedStock") {
      value = Number.parseInt(value, 10) || 0
      // Prevent negative values
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMaterial) {
      toast({
        title: "Error",
        description: "Please select a material",
        variant: "destructive",
      })
      return
    }

    if (!selectedFactory) {
      toast({
        title: "Error",
        description: "Please select a factory",
        variant: "destructive",
      })
      return
    }

    // Validate all allocations have machine selected
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

    // Check for duplicate machines
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

    // Check if total allocation exceeds available stock
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
      // Get current user ID from localStorage
      const userId = localStorage.getItem("userId")

      // Prepare allocations with proper integer values
      const formattedAllocations = allocations.map((alloc) => ({
        ...alloc,
        allocatedStock: Number.parseInt(alloc.allocatedStock, 10),
      }))

      const response = await allocateStock({
        materialId: selectedMaterial,
        allocations: formattedAllocations,
        userId: userId || "unknown",
      })

      toast({
        title: "Success",
        description: "Stock allocated successfully",
      })

      // Update material details with new stock
      if (response && response.updatedStock !== undefined) {
        setMaterialDetails({
          ...materialDetails,
          currentStock: response.updatedStock,
        })
      } else {
        // If the response doesn't include updated stock, fetch the material details again
        fetchMaterialDetails(selectedMaterial)
      }

      // Reset form
      setAllocations([{ machineId: "", allocatedStock: 0 }])
    } catch (error) {
      console.error("Error allocating stock:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to allocate stock",
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

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container py-8 mx-auto"
      >
        <Toaster />
        <Card>
          <CardHeader>
            <CardTitle>Allocate Material to Machines</CardTitle>
            <CardDescription>Assign material stock to specific machines and track inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="material">Select Material</Label>
                  <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                    <SelectTrigger id="material">
                      <SelectValue placeholder="Select a material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials && materials.length > 0 ? (
                        materials.map((material) => (
                          <SelectItem key={material._id} value={material._id}>
                            {material.reference} - {material.description || ""}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-materials" disabled>
                          No materials available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {materialDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border rounded-md bg-muted"
                  >
                    <h3 className="mb-2 font-medium">Material Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Reference:</p>
                        <p className="font-medium">{materialDetails.reference}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Stock:</p>
                        <p className="font-medium">{materialDetails.currentStock}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Manufacturer:</p>
                        <p className="font-medium">{materialDetails.manufacturer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category:</p>
                        <p className="font-medium">{materialDetails.category?.name || "N/A"}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="factory">Select Factory</Label>
                  <Select value={selectedFactory} onValueChange={handleFactoryChange}>
                    <SelectTrigger id="factory">
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
                  {selectedFactory && selectedFactory !== "all" && (
                    <p className="text-sm text-muted-foreground">
                      Showing machines from: <span className="font-medium">{getSelectedFactoryName()}</span>
                    </p>
                  )}
                </div>

                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Important</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Allocating stock to machines will reduce the material's current stock. The allocated stock will be
                    subtracted from the material's available inventory.
                  </AlertDescription>
                </Alert>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Machine Allocations</h3>
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
                      className="grid grid-cols-[1fr_auto_auto] gap-4 items-end"
                    >
                      <div>
                        <Label htmlFor={`machine-${index}`}>Machine</Label>
                        <Select
                          value={allocation.machineId}
                          onValueChange={(value) => handleAllocationChange(index, "machineId", value)}
                        >
                          <SelectTrigger id={`machine-${index}`}>
                            <SelectValue placeholder="Select a machine" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredMachines && filteredMachines.length > 0 ? (
                              filteredMachines.map((machine) => (
                                <SelectItem key={machine._id} value={machine._id}>
                                  <div className="flex items-center gap-2">
                                    {machine.name}
                                    {machine.factory && (
                                      <span className="text-xs text-muted-foreground">({machine.factory.name})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-machines" disabled>
                                {selectedFactory && selectedFactory !== "all"
                                  ? "No machines in selected factory"
                                  : "No machines available"}
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  {materialDetails && (
                    <div className="flex justify-between p-2 rounded-md bg-muted">
                      <span>Total Allocated:</span>
                      <span
                        className={
                          totalAllocated > materialDetails.currentStock ? "text-destructive font-bold" : "font-medium"
                        }
                      >
                        {totalAllocated} / {materialDetails.currentStock}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
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
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineCreate
