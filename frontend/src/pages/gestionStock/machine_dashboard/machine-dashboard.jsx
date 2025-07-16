"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  deleteAllocation,
  getAllAllocations,
  getMachineStockHistory,
  updateAllocation,
} from "@/apis/gestionStockApi/materialMachineApi"
import { getAllMaterials } from "@/apis/gestionStockApi/materialApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  AlertTriangle,
  Settings,
  BarChart3,
  Clock,
  Search,
  Edit,
  Plus,
  Layers,
  RefreshCw,
  Eye,
  ChevronLeft,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import MainLayout from "@/components/MainLayout"

const MachineDashboard = () => {
  const { toast } = useToast()

  // Factory selection state
  const [selectedFactory, setSelectedFactory] = useState("")
  const [factories, setFactories] = useState([])
  const [showFactorySelection, setShowFactorySelection] = useState(true)

  // Global state
  const [isLoading, setIsLoading] = useState(true)
  const [allocations, setAllocations] = useState([])
  const [materials, setMaterials] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState("machines")
  const [viewMode, setViewMode] = useState("cards")
  const [showHelp, setShowHelp] = useState(false)

  // Machines list state
  const [machineData, setMachineData] = useState([])
  const [filteredMachines, setFilteredMachines] = useState([])
  const [machineFilters, setMachineFilters] = useState({
    status: "",
    hasCriticalMaterials: "",
    hasLowStock: "",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedMachineForDelete, setSelectedMachineForDelete] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Machine details state
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [machineAllocations, setMachineAllocations] = useState([])
  const [filteredAllocations, setFilteredAllocations] = useState([])
  const [machineHistory, setMachineHistory] = useState([])
  const [materialSearchTerm, setMaterialSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMaterialDetails, setSelectedMaterialDetails] = useState(null)
  const [isMaterialDetailsOpen, setIsMaterialDetailsOpen] = useState(false)

  // Stats
  const [machineStats, setMachineStats] = useState({
    totalMachines: 0,
    totalMaterials: 0,
    criticalMaterials: 0,
    lowStockMaterials: 0,
  })

  // Selected machine stats
  const [selectedMachineStats, setSelectedMachineStats] = useState({
    totalMaterials: 0,
    criticalMaterials: 0,
    lowStockMaterials: 0,
    totalAllocatedStock: 0,
  })

  // For the update dialog
  const [selectedAllocation, setSelectedAllocation] = useState(null)
  const [newStock, setNewStock] = useState("")
  const [comment, setComment] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // Sort state
  const [sortConfig, setSortConfig] = useState({
    field: "name",
    order: 1,
  })

  useEffect(() => {
    fetchFactories()
  }, [])

  useEffect(() => {
    if (selectedFactory && !showFactorySelection) {
      fetchData()
    }
  }, [selectedFactory, showFactorySelection])

  useEffect(() => {
    if (allocations.length > 0 && materials.length > 0) {
      processMachineData()
    }
  }, [allocations, materials, searchTerm, machineFilters, sortConfig, viewMode])

  useEffect(() => {
    if (selectedMachine && allocations.length > 0) {
      filterMachineAllocations()
      calculateSelectedMachineStats()
    }
  }, [selectedMachine, materialSearchTerm, allocations, materials])

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

  const handleFactorySelection = (factoryId) => {
    setSelectedFactory(factoryId)
    setShowFactorySelection(false)

    const factoryName =
      factoryId === "all" ? "All Factories" : factories.find((f) => f._id === factoryId)?.name || "Unknown Factory"

    toast({
      title: "Factory Selected",
      description: `Now viewing machines from: ${factoryName}`,
    })
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)

      toast({
        title: "Loading data...",
        description: "Fetching the latest machine and material information",
      })

      const [allocationsData, materialsData] = await Promise.all([getAllAllocations(), getAllMaterials(1, 100)])

      // Filter allocations by selected factory
      let filteredAllocations = allocationsData || []
      if (selectedFactory && selectedFactory !== "all") {
        filteredAllocations = filteredAllocations.filter(
          (allocation) => allocation.machine?.factory?._id === selectedFactory,
        )
      }

      setAllocations(filteredAllocations)
      setMaterials(materialsData?.data || [])

      toast({
        title: "Data loaded successfully",
        description: `Loaded ${filteredAllocations.length} allocations and ${materialsData?.data?.length || 0} materials`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const processMachineData = () => {
    // Group allocations by machine
    const machineMap = new Map()

    allocations.forEach((allocation) => {
      if (!allocation.machine) return

      const machineId = allocation.machine._id
      if (!machineMap.has(machineId)) {
        machineMap.set(machineId, {
          _id: machineId,
          name: allocation.machine.name,
          description: allocation.machine.description,
          status: allocation.machine.status,
          factory: allocation.machine.factory,
          materials: [],
          totalMaterials: 0,
          criticalMaterials: 0,
          lowStockMaterials: 0,
          totalAllocatedStock: 0,
          lastUpdated: null,
          allocation: allocation,
        })
      }

      const machine = machineMap.get(machineId)

      // Find the full material details
      const materialDetails = materials.find((m) => m._id === allocation.material?._id)

      const materialData = {
        _id: allocation.material?._id,
        reference: allocation.material?.reference,
        description: allocation.material?.description,
        allocatedStock: allocation.allocatedStock,
        currentStock: materialDetails?.currentStock || 0,
        minimumStock: materialDetails?.minimumStock || 0,
        critical: materialDetails?.critical || false,
        category: materialDetails?.category?.name || "Unknown",
        updatedAt: allocation.updatedAt,
      }

      machine.materials.push(materialData)
      machine.totalMaterials++
      machine.totalAllocatedStock += allocation.allocatedStock || 0

      // Track the most recent update
      if (!machine.lastUpdated || new Date(allocation.updatedAt) > new Date(machine.lastUpdated)) {
        machine.lastUpdated = allocation.updatedAt
      }

      if (materialData.critical) {
        machine.criticalMaterials++
      }

      if (materialData.currentStock <= materialData.minimumStock) {
        machine.lowStockMaterials++
      }
    })

    // Convert map to array
    let machineArray = Array.from(machineMap.values())

    // Apply search filter
    if (searchTerm) {
      machineArray = machineArray.filter(
        (machine) =>
          machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.factory?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.materials.some(
            (material) =>
              material.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
              material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              material.category.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      )
    }

    // Apply other filters
    if (machineFilters.status) {
      machineArray = machineArray.filter(
        (machine) => machine.status?.toLowerCase() === machineFilters.status.toLowerCase(),
      )
    }

    if (machineFilters.hasCriticalMaterials === "yes") {
      machineArray = machineArray.filter((machine) => machine.criticalMaterials > 0)
    }

    if (machineFilters.hasLowStock === "yes") {
      machineArray = machineArray.filter((machine) => machine.lowStockMaterials > 0)
    }

    // Apply sorting
    machineArray.sort((a, b) => {
      const valueA = a[sortConfig.field]
      const valueB = b[sortConfig.field]

      if (
        sortConfig.field === "totalMaterials" ||
        sortConfig.field === "criticalMaterials" ||
        sortConfig.field === "lowStockMaterials" ||
        sortConfig.field === "totalAllocatedStock"
      ) {
        return (valueA - valueB) * sortConfig.order
      }

      if (sortConfig.field === "lastUpdated") {
        return (new Date(valueA) - new Date(valueB)) * sortConfig.order
      }

      if (typeof valueA === "string" && typeof valueB === "string") {
        return valueA.localeCompare(valueB) * sortConfig.order
      }

      return 0
    })

    setMachineData(machineArray)
    setFilteredMachines(machineArray)

    // Calculate global stats
    const stats = {
      totalMachines: machineArray.length,
      totalMaterials: allocations.length,
      criticalMaterials: machineArray.reduce((sum, machine) => sum + machine.criticalMaterials, 0),
      lowStockMaterials: machineArray.reduce((sum, machine) => sum + machine.lowStockMaterials, 0),
    }

    setMachineStats(stats)
  }

  const selectMachine = async (machine) => {
    setSelectedMachine(machine)
    setActiveView("details")
    setActiveTab("overview")

    // Filter allocations for this machine
    const machineAllocations = allocations.filter(
      (allocation) => allocation.machine && allocation.machine._id === machine._id,
    )

    setMachineAllocations(machineAllocations)
    setFilteredAllocations(machineAllocations)

    // Fetch machine history
    try {
      if (machine._id) {
        const historyData = await getMachineStockHistory(machine._id)
        setMachineHistory(historyData || [])
      }
    } catch (error) {
      console.error("Error fetching machine history:", error)
      setMachineHistory([])
      toast({
        title: "Warning",
        description: "Could not load machine history",
        variant: "warning",
      })
    }
  }

  const filterMachineAllocations = () => {
    if (!materialSearchTerm.trim()) {
      setFilteredAllocations(machineAllocations)
      return
    }

    const filtered = machineAllocations.filter((allocation) => {
      const materialRef = allocation.material?.reference || ""
      const materialDesc = allocation.material?.description || ""
      const category = materials.find((m) => m._id === allocation.material?._id)?.category?.name || ""

      return (
        materialRef.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
        materialDesc.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
        category.toLowerCase().includes(materialSearchTerm.toLowerCase())
      )
    })

    setFilteredAllocations(filtered)
  }

  const calculateSelectedMachineStats = () => {
    let criticalCount = 0
    let lowStockCount = 0
    let totalStock = 0

    machineAllocations.forEach((allocation) => {
      // Find the full material details
      const materialDetails = materials.find((m) => m._id === allocation.material?._id)

      if (materialDetails?.critical) {
        criticalCount++
      }

      if (materialDetails?.currentStock <= materialDetails?.minimumStock) {
        lowStockCount++
      }

      totalStock += allocation.allocatedStock || 0
    })

    setSelectedMachineStats({
      totalMaterials: machineAllocations.length,
      criticalMaterials: criticalCount,
      lowStockMaterials: lowStockCount,
      totalAllocatedStock: totalStock,
    })
  }

  const handleUpdateAllocation = async () => {
    if (!selectedAllocation || !newStock) return

    try {
      setIsUpdating(true)

      const updateData = {
        allocatedStock: Number.parseInt(newStock),
        comment: comment || `Updated stock from ${selectedAllocation.allocatedStock} to ${newStock}`,
      }

      await updateAllocation(selectedAllocation._id, updateData)

      // Show success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)

      toast({
        title: "Success",
        description: "Material allocation updated successfully",
        variant: "success",
      })

      // Refresh data
      fetchData()
      setIsDialogOpen(false)
      setNewStock("")
      setComment("")
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update allocation",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const openUpdateDialog = (allocation) => {
    setSelectedAllocation(allocation)
    setNewStock(allocation.allocatedStock.toString())
    setIsDialogOpen(true)
  }

  const openMaterialDetails = (allocation) => {
    // Find the full material details
    const materialDetails = materials.find((m) => m._id === allocation.material?._id)

    setSelectedMaterialDetails({
      ...allocation,
      fullDetails: materialDetails,
    })

    setIsMaterialDetailsOpen(true)
  }

  const confirmDeleteMachine = (machine) => {
    setSelectedMachineForDelete(machine)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteMachine = async () => {
    await deleteAllocation(selectedMachineForDelete.allocation._id)
    toast({
      title: "Machine deleted",
      description: `${selectedMachineForDelete.name} has been deleted successfully`,
      variant: "success",
    })

    setIsDeleteDialogOpen(false)
    setSelectedMachineForDelete(null)

    // Refresh data
    fetchData()

    if (selectedMachine && selectedMachine._id === selectedMachineForDelete._id) {
      setActiveView("machines")
      setSelectedMachine(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getTimeSince = (dateString) => {
    if (!dateString) return "Never"

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date

    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHrs = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHrs / 24)

    if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)} months ago`
    } else if (diffDays > 0) {
      return `${diffDays} days ago`
    } else if (diffHrs > 0) {
      return `${diffHrs} hours ago`
    } else if (diffMin > 0) {
      return `${diffMin} minutes ago`
    } else {
      return "Just now"
    }
  }

  const getSelectedFactoryName = () => {
    if (!selectedFactory || selectedFactory === "all") return "All Factories"
    const factory = factories.find((f) => f._id === selectedFactory)
    return factory ? factory.name : "Unknown Factory"
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success"
      case "maintenance":
        return "warning"
      case "inactive":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusBgColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-gray-50 dark:bg-green-900/20"
      case "maintenance":
        return "bg-amber-50 dark:bg-amber-900/20"
      case "inactive":
        return "bg-slate-50 dark:bg-slate-900/20"
      default:
        return "bg-slate-50 dark:bg-slate-900/20"
    }
  }

  const handleSortChange = (field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return { field, order: prev.order === 1 ? -1 : 1 }
      }
      return { field, order: 1 }
    })
  }

  const clearFilters = () => {
    setMachineFilters({
      status: "",
      hasCriticalMaterials: "",
      hasLowStock: "",
    })

    toast({
      title: "Filters cleared",
      description: "All filters have been reset",
    })
  }

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "cards" ? "table" : "cards"))

    toast({
      title: `View mode: ${viewMode === "cards" ? "Table" : "Cards"}`,
      description: `Switched to ${viewMode === "cards" ? "table" : "card"} view`,
    })
  }

  // Factory Selection Screen
  if (showFactorySelection) {
    return (
      <MainLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container py-8 mx-auto"
        >
          <div className="max-w-2xl mx-auto">
            <Card className="border-cyan-500/20">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                  <Building2 className="w-6 h-6 text-cyan-500" />
                  Select Factory
                </CardTitle>
                <CardDescription>
                  Choose a factory to view its machine dashboard and material allocations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Button
                    onClick={() => handleFactorySelection("all")}
                    variant="outline"
                    className="justify-start h-auto p-4 text-left border-cyan-500/20 hover:bg-cyan-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-cyan-500" />
                      <div>
                        <div className="font-medium">All Factories</div>
                        <div className="text-sm text-muted-foreground">
                          View machines and materials from all factories
                        </div>
                      </div>
                    </div>
                  </Button>

                  {factories.map((factory) => (
                    <Button
                      key={factory._id}
                      onClick={() => handleFactorySelection(factory._id)}
                      variant="outline"
                      className="justify-start h-auto p-4 text-left border-cyan-500/20 hover:bg-cyan-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-cyan-500" />
                        <div>
                          <div className="font-medium">{factory.name}</div>
                          <div className="text-sm text-muted-foreground">{factory.location || "Factory location"}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                {factories.length === 0 && (
                  <div className="py-8 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-medium">No factories found</h3>
                    <p className="text-muted-foreground">
                      Please create a factory first to access the machine dashboard
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Toaster />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeView === "machines" ? "Machine Dashboard" : selectedMachine?.name}
          </h1>
          <p className="text-muted-foreground">
            {activeView === "machines"
              ? `Monitor machines and materials from: ${getSelectedFactoryName()}`
              : selectedMachine?.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFactorySelection(true)}
            className="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Change Factory
          </Button>

          {activeView === "details" && (
            <Button
              variant="outline"
              onClick={() => setActiveView("machines")}
              className="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Machines
            </Button>
          )}

          {activeView === "details" && (
            <Badge variant={getStatusColor(selectedMachine?.status)} className="px-3 py-1 text-sm">
              {selectedMachine?.status || "Unknown"}
            </Badge>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh all data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {activeView === "machines" && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={toggleViewMode}>
                      {viewMode === "cards" ? (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Table View
                        </>
                      ) : (
                        <>
                          <Layers className="w-4 h-4 mr-2" />
                          Card View
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle between card and table view</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button asChild className="bg-blue-500 hover:bg-blue-600">
                <Link to="/machinematerial/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Allocation
                </Link>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Dashboard Summary Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {activeView === "machines" ? (
          // Machine Dashboard Stats
          <>
            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent dark:from-cyan-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
                <Settings className="w-4 h-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{machineStats.totalMachines}</div>
                <p className="text-xs text-muted-foreground">Machines in {getSelectedFactoryName()}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                <Package className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{machineStats.totalMaterials}</div>
                <p className="text-xs text-muted-foreground">Material allocations across machines</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Critical Materials</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{machineStats.criticalMaterials}</div>
                <p className="text-xs text-muted-foreground">Critical materials allocated to machines</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Materials</CardTitle>
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{machineStats.lowStockMaterials}</div>
                <p className="text-xs text-muted-foreground">Materials below minimum stock level</p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Selected Machine Stats
          <>
            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-transparent dark:from-cyan-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                <Package className="w-4 h-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedMachineStats.totalMaterials}</div>
                <p className="text-xs text-muted-foreground">Materials allocated to this machine</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Critical Materials</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedMachineStats.criticalMaterials}</div>
                <div className="flex items-center mt-1">
                  <div className="w-full h-2 mr-2 rounded-full bg-muted">
                    <div
                      className="h-2 bg-red-500 rounded-full"
                      style={{
                        width: selectedMachineStats.totalMaterials
                          ? `${(selectedMachineStats.criticalMaterials / selectedMachineStats.totalMaterials) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedMachineStats.totalMaterials
                      ? Math.round((selectedMachineStats.criticalMaterials / selectedMachineStats.totalMaterials) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Materials</CardTitle>
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedMachineStats.lowStockMaterials}</div>
                <div className="flex items-center mt-1">
                  <div className="w-full h-2 mr-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{
                        width: selectedMachineStats.totalMaterials
                          ? `${(selectedMachineStats.lowStockMaterials / selectedMachineStats.totalMaterials) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedMachineStats.totalMaterials
                      ? Math.round((selectedMachineStats.lowStockMaterials / selectedMachineStats.totalMaterials) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden transition-all hover:shadow-md border-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent -z-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Allocated Stock</CardTitle>
                <Layers className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedMachineStats.totalAllocatedStock}</div>
                <p className="text-xs text-muted-foreground">Total units allocated to this machine</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content */}
      {activeView === "machines" ? (
        // Machines List View
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
          <Card className="border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Machines</CardTitle>
                <CardDescription>
                  {filteredMachines.length} {filteredMachines.length === 1 ? "machine" : "machines"} found in{" "}
                  {getSelectedFactoryName()}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search machines..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        Object.values(machineFilters).some((v) => v !== "") ? "border-cyan-500 bg-cyan-500/5" : ""
                      }
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {Object.values(machineFilters).some((v) => v !== "") && (
                        <Badge variant="secondary" className="ml-1 bg-cyan-500/20">
                          {Object.values(machineFilters).filter((v) => v !== "").length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-72" align="end">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filters</h4>
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                          <X className="w-4 h-4 mr-2" />
                          Clear all
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      {/* Status filter */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Machine Status</Label>
                        <Select
                          value={machineFilters.status}
                          onValueChange={(value) => setMachineFilters({ ...machineFilters, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Critical materials filter */}
                      <div className="space-y-2">
                        <Label htmlFor="critical">Has Critical Materials</Label>
                        <Select
                          value={machineFilters.hasCriticalMaterials}
                          onValueChange={(value) =>
                            setMachineFilters({ ...machineFilters, hasCriticalMaterials: value })
                          }
                        >
                          <SelectTrigger id="critical">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Machines</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Low stock filter */}
                      <div className="space-y-2">
                        <Label htmlFor="lowstock">Has Low Stock Materials</Label>
                        <Select
                          value={machineFilters.hasLowStock}
                          onValueChange={(value) => setMachineFilters({ ...machineFilters, hasLowStock: value })}
                        >
                          <SelectTrigger id="lowstock">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Machines</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                      <Button variant="ghost" onClick={() => setIsFilterOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsFilterOpen(false)} className="bg-cyan-500 hover:bg-cyan-600">
                        Apply Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal className="w-4 h-4 mr-2" /> Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSortChange("name")}>
                      Name {sortConfig.field === "name" && (sortConfig.order === 1 ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("status")}>
                      Status {sortConfig.field === "status" && (sortConfig.order === 1 ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("totalMaterials")}>
                      Total Materials {sortConfig.field === "totalMaterials" && (sortConfig.order === 1 ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("criticalMaterials")}>
                      Critical Materials{" "}
                      {sortConfig.field === "criticalMaterials" && (sortConfig.order === 1 ? "↑" : "↓")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSortChange("lastUpdated")}>
                      Last Updated {sortConfig.field === "lastUpdated" && (sortConfig.order === 1 ? "↑" : "↓")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <p className="text-sm text-muted-foreground">Loading machine data...</p>
                  </div>
                </div>
              ) : viewMode === "cards" ? (
                <div className="space-y-6">
                  {filteredMachines.length === 0 ? (
                    <div className="py-12 text-center">
                      <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                      <h3 className="text-lg font-medium">No machines found</h3>
                      <p className="text-muted-foreground">
                        {selectedFactory === "all"
                          ? "Try adjusting your search or filters"
                          : `No machines found in ${getSelectedFactoryName()}`}
                      </p>
                    </div>
                  ) : (
                    filteredMachines.map((machine) => (
                      <motion.div
                        key={machine._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className={`transition-all hover:shadow-md ${getStatusBgColor(machine.status)}`}>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{machine.name}</CardTitle>
                              <CardDescription>{machine.description}</CardDescription>
                              {machine.factory && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{machine.factory.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant={getStatusColor(machine.status)}>{machine.status || "Unknown"}</Badge>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => selectMachine(machine)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/machinematerial/edit/${machine.allocation._id}`}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Machine
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-500"
                                    onClick={() => confirmDeleteMachine(machine)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Machine
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 mb-4 md:grid-cols-3">
                              <div className="p-4 border rounded-md bg-background/80">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">Total Materials</div>
                                  <Package className="w-4 h-4 text-cyan-500" />
                                </div>
                                <div className="text-2xl font-bold">{machine.totalMaterials}</div>
                              </div>
                              <div className="p-4 border rounded-md bg-background/80">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">Critical Materials</div>
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div className="text-2xl font-bold">{machine.criticalMaterials}</div>
                              </div>
                              <div className="p-4 border rounded-md bg-background/80">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">Low Stock Materials</div>
                                  <BarChart3 className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="text-2xl font-bold">{machine.lowStockMaterials}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-medium">Recent Materials</h3>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => selectMachine(machine)}
                                className="h-auto p-0 text-cyan-500"
                              >
                                View all
                                <ArrowUpRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>

                            <div className="border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Allocated</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {machine.materials.slice(0, 3).map((material) => (
                                    <TableRow key={material._id} className="hover:bg-muted/50">
                                      <TableCell className="font-medium">{material.reference}</TableCell>
                                      <TableCell>{material.description}</TableCell>
                                      <TableCell>{material.category}</TableCell>
                                      <TableCell className="text-right">{material.allocatedStock}</TableCell>
                                      <TableCell className="text-right">
                                        {material.critical ? (
                                          <Badge variant="destructive">Critical</Badge>
                                        ) : material.currentStock <= material.minimumStock ? (
                                          <Badge variant="warning">Low Stock</Badge>
                                        ) : (
                                          <Badge variant="success">In Stock</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}

                                  {machine.materials.length > 3 && (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center">
                                        <Button
                                          variant="link"
                                          size="sm"
                                          onClick={() => selectMachine(machine)}
                                          className="text-cyan-500"
                                        >
                                          View all {machine.materials.length} materials
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )}

                                  {machine.materials.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No materials allocated to this machine
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between px-6 py-3 border-t bg-muted/30">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              Last updated: {getTimeSince(machine.lastUpdated)}
                            </div>
                            <Button
                              onClick={() => selectMachine(machine)}
                              variant="outline"
                              size="sm"
                              className="border-cyan-500/20 hover:bg-cyan-500/10"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                // Table view
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("name")}
                        >
                          Machine Name {sortConfig.field === "name" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Factory</TableHead>
                        <TableHead
                          className="cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("status")}
                        >
                          Status {sortConfig.field === "status" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("totalMaterials")}
                        >
                          Materials {sortConfig.field === "totalMaterials" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("criticalMaterials")}
                        >
                          Critical {sortConfig.field === "criticalMaterials" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("lowStockMaterials")}
                        >
                          Low Stock {sortConfig.field === "lowStockMaterials" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:text-cyan-500"
                          onClick={() => handleSortChange("lastUpdated")}
                        >
                          Last Updated {sortConfig.field === "lastUpdated" && (sortConfig.order === 1 ? "↑" : "↓")}
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMachines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">
                            No machines found. Try adjusting your search or filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMachines.map((machine) => (
                          <TableRow key={machine._id} className={`hover:${getStatusBgColor(machine.status)}`}>
                            <TableCell className="font-medium">{machine.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{machine.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span>{machine.factory?.name || "No Factory"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(machine.status)}>{machine.status || "Unknown"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{machine.totalMaterials}</TableCell>
                            <TableCell className="text-right">
                              {machine.criticalMaterials > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-red-500">
                                  {machine.criticalMaterials}
                                  <AlertCircle className="w-4 h-4" />
                                </span>
                              ) : (
                                machine.criticalMaterials
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {machine.lowStockMaterials > 0 ? (
                                <span className="flex items-center justify-end gap-1 text-amber-500">
                                  {machine.lowStockMaterials}
                                  <AlertTriangle className="w-4 h-4" />
                                </span>
                              ) : (
                                machine.lowStockMaterials
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-right text-muted-foreground">
                              {getTimeSince(machine.lastUpdated)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => selectMachine(machine)}>
                                        <Eye className="w-4 h-4 text-cyan-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View machine details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" asChild>
                                        <Link to={`/machinematerial/edit/${machine.allocation._id}`}>
                                          <Edit className="w-4 h-4 text-cyan-500" />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit machine</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => selectMachine(machine)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/machinematerial/edit/${machine.allocation._id}`}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Machine
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-500 focus:text-red-500"
                                      onClick={() => confirmDeleteMachine(machine)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Machine
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        // Machine Details View (simplified for brevity)
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Machine Details</CardTitle>
              <CardDescription>
                Detailed view of {selectedMachine?.name} from {selectedMachine?.factory?.name || "Unknown Factory"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Machine details view would be implemented here with tabs for overview, materials, and history.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete Machine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMachineForDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-500">Warning</h4>
                <p className="text-sm text-muted-foreground">
                  Deleting this machine will also remove all material allocations associated with it. This may affect
                  inventory tracking and historical data.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMachine}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Machine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

export default MachineDashboard
