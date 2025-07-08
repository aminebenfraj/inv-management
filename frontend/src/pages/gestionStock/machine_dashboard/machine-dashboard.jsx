"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  deleteAllocation,
  getAllAllocations,
  getMachineStockHistory,
  updateAllocation,
} from "../../../apis/gestionStockApi/materialMachineApi"
import { getAllMaterials } from "../../../apis/gestionStockApi/materialApi"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  AlertTriangle,
  Settings,
  BarChart3,
  Clock,
  Search,
  Edit,
  Plus,
  History,
  Layers,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  Filter,
  X,
  SlidersHorizontal,
  HelpCircle,
  ArrowUpRight,
  Printer,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import MainLayout from "@/components/MainLayout"

// Simple chart component
const PieChartComponent = ({ data }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!data || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    const total = data.values.reduce((sum, value) => sum + value, 0)
    let startAngle = 0

    // Colors for the pie slices
    const colors = [
      "#06b6d4", // cyan-500
      "#22c55e", // green-500
      "#f59e0b", // amber-500
      "#ef4444", // red-500
      "#8b5cf6", // violet-500
      "#ec4899", // pink-500
      "#3b82f6", // blue-500
    ]

    // Draw the pie chart
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    data.values.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = colors[index % colors.length]
      ctx.fill()

      startAngle = endAngle
    })

    // Draw a white circle in the middle for a donut chart effect
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()

    // Draw the total in the center
    ctx.fillStyle = "#1f2937" // gray-800
    ctx.font = "bold 16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(total.toString(), centerX, centerY)
  }, [data])

  if (!data) return <div className="flex items-center justify-center h-full">No data available</div>

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={200} height={200} />
      <div className="mt-4 space-y-2">
        {data.labels.map((label, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div
                className="w-3 h-3 mr-2 rounded-full"
                style={{
                  backgroundColor: ["#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"][
                    index % 7
                  ],
                }}
              />
              <span>{label}</span>
            </div>
            <span className="font-medium">{data.values[index]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Bar chart component for stock history
const StockHistoryChart = ({ history }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!history || history.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Find the material with the most history entries
    let maxHistoryLength = 0
    history.forEach((item) => {
      if (item.history && item.history.length > maxHistoryLength) {
        maxHistoryLength = item.history.length
      }
    })

    if (maxHistoryLength === 0) return

    // Set up chart dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2
    const barWidth = Math.max(chartWidth / (maxHistoryLength * 2), 15)

    // Find max stock value for scaling
    let maxStock = 0
    history.forEach((item) => {
      if (item.history) {
        item.history.forEach((h) => {
          maxStock = Math.max(maxStock, h.newStock, h.previousStock)
        })
      }
    })

    // Add 20% padding to max value
    maxStock = Math.ceil(maxStock * 1.2)

    // Draw axes
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.strokeStyle = "#d1d5db" // gray-300
    ctx.stroke()

    // Draw y-axis labels
    ctx.fillStyle = "#6b7280" // gray-500
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxStock / 5) * i)
      const y = canvas.height - padding - (chartHeight / 5) * i
      ctx.fillText(value.toString(), padding - 10, y)

      // Draw horizontal grid line
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)
      ctx.strokeStyle = "#f3f4f6" // gray-100
      ctx.stroke()
    }

    // Draw bars for each material (up to 3 materials)
    const colors = ["#06b6d4", "#22c55e", "#ef4444"]

    history.slice(0, 3).forEach((item, materialIndex) => {
      if (!item.history) return

      const color = colors[materialIndex % colors.length]

      item.history.forEach((h, historyIndex) => {
        const x = padding + historyIndex * (barWidth * 2) + materialIndex * (barWidth / 2)
        const height = (h.newStock / maxStock) * chartHeight
        const y = canvas.height - padding - height

        // Draw bar
        ctx.fillStyle = color
        ctx.fillRect(x, y, barWidth, height)

        // Add material reference to the first bar of each material
        if (historyIndex === 0) {
          ctx.fillStyle = "#1f2937" // gray-800
          ctx.font = "bold 10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(
            item.material?.reference?.substring(0, 8) || "Unknown",
            x + barWidth / 2,
            canvas.height - padding + 15,
          )
        }
      })
    })

    // Add legend
    const legendY = padding / 2
    history.slice(0, 3).forEach((item, index) => {
      const color = colors[index % colors.length]
      const x = padding + index * 120

      ctx.fillStyle = color
      ctx.fillRect(x, legendY, 15, 15)

      ctx.fillStyle = "#1f2937" // gray-800
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(item.material?.reference || "Unknown", x + 20, legendY + 7)
    })
  }, [history])

  if (!history || history.length === 0) {
    return <div className="flex items-center justify-center h-full">No history data available</div>
  }

  return (
    <div className="relative">
      <h3 className="mb-4 text-sm font-medium">Stock History Trends</h3>
      <canvas ref={canvasRef} width={600} height={300} className="w-full" />
    </div>
  )
}

// Mock function to simulate chart data
const generateChartData = (machine) => {
  if (!machine) return null

  // Generate random data for demonstration
  const materialCategories = {}
  machine.materials.forEach((material) => {
    const category = material.category || "Uncategorized"
    if (!materialCategories[category]) {
      materialCategories[category] = 0
    }
    materialCategories[category] += material.allocatedStock
  })

  return {
    labels: Object.keys(materialCategories),
    values: Object.values(materialCategories),
  }
}

const MachineDashboard = () => {
  const { toast } = useToast()

  // Global state
  const [isLoading, setIsLoading] = useState(true)
  const [allocations, setAllocations] = useState([])
  const [materials, setMaterials] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState("machines") // 'machines' or 'details'
  const [viewMode, setViewMode] = useState("cards") // 'cards' or 'table'
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
    order: 1, // 1 for ascending, -1 for descending
  })

  // Print mode

  useEffect(() => {
    fetchData()

    // Show welcome toast on first load
    toast({
      title: "Welcome to Machine Dashboard",
      description: "Monitor and manage all your machines and materials in one place",
      action: (
        <Button variant="outline" size="sm" onClick={() => setShowHelp(true)}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
      ),
    })
  }, [])

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

 

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Show loading toast
      toast({
        title: "Loading data...",
        description: "Fetching the latest machine and material information",
      })

      const [allocationsData, materialsData] = await Promise.all([
        getAllAllocations(),
        getAllMaterials(1, 1000), // Get all materials with a high limit
      ])

      setAllocations(allocationsData || [])
      setMaterials(materialsData?.data || [])

      // Show success toast
      toast({
        title: "Data loaded successfully",
        description: `Loaded ${allocationsData.length} allocations and ${materialsData?.data?.length || 0} materials`,
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
          materials: [],
          totalMaterials: 0,
          criticalMaterials: 0,
          lowStockMaterials: 0,
          totalAllocatedStock: 0,
          lastUpdated: null,
          allocation:allocation
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

      // Handle numeric fields
      if (
        sortConfig.field === "totalMaterials" ||
        sortConfig.field === "criticalMaterials" ||
        sortConfig.field === "lowStockMaterials" ||
        sortConfig.field === "totalAllocatedStock"
      ) {
        return (valueA - valueB) * sortConfig.order
      }

      // Handle date fields
      if (sortConfig.field === "lastUpdated") {
        return (new Date(valueA) - new Date(valueB)) * sortConfig.order
      }

      // Handle string fields
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

    // In a real app, you would refresh the data here
    // For now, we'll just simulate removing it from the list
    setMachineData(machineData.filter((m) => m._id !== selectedMachineForDelete._id))
    setFilteredMachines(filteredMachines.filter((m) => m._id !== selectedMachineForDelete._id))

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

    // Convert to seconds, minutes, hours, days
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

  const exportToCSV = (data, filename) => {
    if (data === "machines") {
      // Export machines list
      const headers = [
        "Machine Name",
        "Description",
        "Status",
        "Total Materials",
        "Critical Materials",
        "Low Stock Materials",
        "Total Allocated Stock",
        "Last Updated",
      ]

      const rows = filteredMachines.map((machine) => [
        machine.name,
        machine.description,
        machine.status,
        machine.totalMaterials,
        machine.criticalMaterials,
        machine.lowStockMaterials,
        machine.totalAllocatedStock,
        formatDate(machine.lastUpdated),
      ])

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `machines-${new Date().toLocaleString
().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `Exported ${rows.length} machines to CSV`,
        variant: "success",
      })
    } else if (data === "materials" && selectedMachine) {
      // Export materials for selected machine
      const headers = [
        "Reference",
        "Description",
        "Category",
        "Allocated Stock",
        "Current Stock",
        "Status",
        "Last Updated",
      ]

      const rows = filteredAllocations.map((allocation) => {
        const materialDetails = materials.find((m) => m._id === allocation.material?._id)
        let status = "In Stock"
        if (materialDetails?.critical) status = "Critical"
        else if (materialDetails?.currentStock <= materialDetails?.minimumStock) status = "Low Stock"

        return [
          allocation.material?.reference || "",
          allocation.material?.description || "",
          materialDetails?.category?.name || "Unknown",
          allocation.allocatedStock || 0,
          materialDetails?.currentStock || 0,
          status,
          formatDate(allocation.updatedAt),
        ]
      })

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `machine-materials-${selectedMachine?.name}-${new Date().toLocaleString
().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `Exported ${rows.length} materials to CSV`,
        variant: "success",
      })
    }
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
        // Toggle order if same field
        return { field, order: prev.order === 1 ? -1 : 1 }
      }
      // Default to ascending for new field
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


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  }

  return (
    <MainLayout>
        <Toaster />

        {/* Help Dialog */}
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-500" />
                Machine Dashboard Help
              </DialogTitle>
              <DialogDescription>Learn how to use the machine dashboard effectively</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="mb-2 text-sm font-medium">Machine List View</h3>
                <ul className="ml-5 space-y-2 text-sm list-disc">
                  <li>View all machines with their material allocations</li>
                  <li>Use the search box to find machines by name, description, or material</li>
                  <li>Filter machines by status, critical materials, or low stock</li>
                  <li>Sort machines by different properties</li>
                  <li>Toggle between card and table view</li>
                  <li>Click "View Details" on any machine to see its full information</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="mb-2 text-sm font-medium">Machine Details View</h3>
                <ul className="ml-5 space-y-2 text-sm list-disc">
                  <li>Overview tab shows key statistics and visualizations</li>
                  <li>Materials tab lists all materials allocated to the machine</li>
                  <li>History tab shows the stock change history</li>
                  <li>Search for specific materials</li>
                  <li>Update material allocations by clicking the edit icon</li>
                  <li>Export material data to CSV</li>
                  <li>Return to the machine list by clicking "Back to Machines"</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="mb-2 text-sm font-medium">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs border rounded-md">F</kbd>
                    <span>Focus search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs border rounded-md">R</kbd>
                    <span>Refresh data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs border rounded-md">V</kbd>
                    <span>Toggle view mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs border rounded-md">Esc</kbd>
                    <span>Back to machines list</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowHelp(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                ? "Monitor all machines and their material allocations"
                : selectedMachine?.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
                  <p>Refresh all data (Shortcut: R)</p>
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
                      <p>Toggle between card and table view (Shortcut: V)</p>
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

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}>
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Help & Keyboard Shortcuts</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  <p className="text-xs text-muted-foreground">Machines with material allocations</p>
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
                  <p className="text-xs text-muted-foreground">Material allocations across all machines</p>
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
                        ? Math.round(
                            (selectedMachineStats.criticalMaterials / selectedMachineStats.totalMaterials) * 100,
                          )
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
                        ? Math.round(
                            (selectedMachineStats.lowStockMaterials / selectedMachineStats.totalMaterials) * 100,
                          )
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
                    {filteredMachines.length} {filteredMachines.length === 1 ? "machine" : "machines"} found
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

                  <Button variant="outline" onClick={() => exportToCSV("machines")}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
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
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                    {filteredMachines.length === 0 ? (
                      <div className="py-12 text-center">
                        <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <h3 className="text-lg font-medium">No machines found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      filteredMachines.map((machine) => (
                        <motion.div key={machine._id} variants={itemVariants}>
                          <Card className={`transition-all hover:shadow-md ${getStatusBgColor(machine.status)}`}>
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-xl">{machine.name}</CardTitle>
                                <CardDescription>{machine.description}</CardDescription>
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
                  </motion.div>
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
                            <TableCell colSpan={8} className="h-24 text-center">
                              No machines found. Try adjusting your search or filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMachines.map((machine) => (
                            <TableRow key={machine._id} className={`hover:${getStatusBgColor(machine.status)}`}>
                              <TableCell className="font-medium">{machine.name}</TableCell>
                              <TableCell className="max-w-xs truncate">{machine.description}</TableCell>
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
                                          <Link to={`/machine/edit/${machine._id}`}>
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
                                        <Link to={`/machine/edit/${machine._id}`}>
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
          // Machine Details View
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <Tabs defaultValue="overview" className="mb-8" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-6 mt-6 md:grid-cols-2">
                  <Card className="border-cyan-500/20">
                    <CardHeader>
                      <CardTitle>Material Distribution</CardTitle>
                      <CardDescription>Breakdown of materials by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PieChartComponent data={generateChartData(selectedMachine)} />
                    </CardContent>
                  </Card>

                  <Card className="border-cyan-500/20">
                    <CardHeader>
                      <CardTitle>Stock Status</CardTitle>
                      <CardDescription>Overview of material stock levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Critical Materials</span>
                            <span className="font-medium">
                              {selectedMachineStats.criticalMaterials} of {selectedMachineStats.totalMaterials}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted">
                            <div
                              className="h-2 bg-red-500 rounded-full"
                              style={{
                                width: selectedMachineStats.totalMaterials
                                  ? `${(selectedMachineStats.criticalMaterials / selectedMachineStats.totalMaterials) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Low Stock Materials</span>
                            <span className="font-medium">
                              {selectedMachineStats.lowStockMaterials} of {selectedMachineStats.totalMaterials}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-amber-500"
                              style={{
                                width: selectedMachineStats.totalMaterials
                                  ? `${(selectedMachineStats.lowStockMaterials / selectedMachineStats.totalMaterials) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Healthy Stock Materials</span>
                            <span className="font-medium">
                              {selectedMachineStats.totalMaterials -
                                selectedMachineStats.lowStockMaterials -
                                selectedMachineStats.criticalMaterials}{" "}
                              of {selectedMachineStats.totalMaterials}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{
                                width: selectedMachineStats.totalMaterials
                                  ? `${((selectedMachineStats.totalMaterials - selectedMachineStats.lowStockMaterials - selectedMachineStats.criticalMaterials) / selectedMachineStats.totalMaterials) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Total Allocated</span>
                            <Layers className="w-4 h-4 text-cyan-500" />
                          </div>
                          <div className="text-2xl font-bold">{selectedMachineStats.totalAllocatedStock}</div>
                        </div>

                        <div className="p-4 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Settings className="w-4 h-4 text-cyan-500" />
                          </div>
                          <Badge variant={getStatusColor(selectedMachine?.status)} className="px-3 py-1">
                            {selectedMachine?.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2 border-cyan-500/20">
                    <CardHeader>
                      <CardTitle>Recent Materials</CardTitle>
                      <CardDescription>Materials allocated to this machine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reference</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Allocated</TableHead>
                              <TableHead className="text-right">Current Stock</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {machineAllocations.slice(0, 5).map((allocation) => {
                              // Find the full material details
                              const materialDetails = materials.find((m) => m._id === allocation.material?._id)

                              return (
                                <TableRow key={allocation._id} className="hover:bg-muted/50">
                                  <TableCell className="font-medium">{allocation.material?.reference}</TableCell>
                                  <TableCell>{allocation.material?.description}</TableCell>
                                  <TableCell>{materialDetails?.category?.name || "Unknown"}</TableCell>
                                  <TableCell className="text-right">{allocation.allocatedStock}</TableCell>
                                  <TableCell className="text-right">{materialDetails?.currentStock || 0}</TableCell>
                                  <TableCell className="text-right">
                                    {materialDetails?.critical ? (
                                      <Badge variant="destructive">Critical</Badge>
                                    ) : materialDetails?.currentStock <= materialDetails?.minimumStock ? (
                                      <Badge variant="warning">Low Stock</Badge>
                                    ) : (
                                      <Badge variant="success">In Stock</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openUpdateDialog(allocation)}
                                            >
                                              <Edit className="w-4 h-4 text-cyan-500" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Update allocation</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => openMaterialDetails(allocation)}
                                            >
                                              <Eye className="w-4 h-4 text-cyan-500" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>View material details</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}

                            {machineAllocations.length > 5 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                  <Button
                                    variant="link"
                                    onClick={() => setActiveTab("materials")}
                                    className="text-cyan-500"
                                  >
                                    View all {machineAllocations.length} materials
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}

                            {machineAllocations.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                  No materials allocated to this machine
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="materials">
                <Card className="border-cyan-500/20">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Machine Materials</CardTitle>
                      <CardDescription>All materials allocated to this machine</CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search materials..."
                          className="pl-8"
                          value={materialSearchTerm}
                          onChange={(e) => setMaterialSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" onClick={() => exportToCSV("materials")}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
                        <Link to="/machinematerial/create">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Material
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                      {filteredAllocations.length === 0 ? (
                        <div className="py-12 text-center">
                          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                          <h3 className="text-lg font-medium">No materials found</h3>
                          <p className="text-muted-foreground">
                            Try adjusting your search or add materials to this machine
                          </p>
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Reference</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Allocated</TableHead>
                                <TableHead className="text-right">Current Stock</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <AnimatePresence>
                                {filteredAllocations.map((allocation) => {
                                  // Find the full material details
                                  const materialDetails = materials.find((m) => m._id === allocation.material?._id)

                                  return (
                                    <motion.tr
                                      key={allocation._id}
                                      variants={itemVariants}
                                      exit={{ opacity: 0 }}
                                      className="hover:bg-muted/50"
                                    >
                                      <TableCell className="font-medium">{allocation.material?.reference}</TableCell>
                                      <TableCell>{allocation.material?.description}</TableCell>
                                      <TableCell>{materialDetails?.category?.name || "Unknown"}</TableCell>
                                      <TableCell className="text-right">{allocation.allocatedStock}</TableCell>
                                      <TableCell className="text-right">{materialDetails?.currentStock || 0}</TableCell>
                                      <TableCell className="text-right">
                                        {materialDetails?.critical ? (
                                          <Badge variant="destructive">Critical</Badge>
                                        ) : materialDetails?.currentStock <= materialDetails?.minimumStock ? (
                                          <Badge variant="warning">Low Stock</Badge>
                                        ) : (
                                          <Badge variant="success">In Stock</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => openUpdateDialog(allocation)}
                                                >
                                                  <Edit className="w-4 h-4 text-cyan-500" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Update allocation</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => openMaterialDetails(allocation)}
                                                >
                                                  <Eye className="w-4 h-4 text-cyan-500" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>View material details</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>

                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" asChild>
                                                  <Link to={`/machinematerial/detail/${allocation._id}`}>
                                                    <Settings className="w-4 h-4 text-cyan-500" />
                                                  </Link>
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Advanced settings</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                  )
                                })}
                              </AnimatePresence>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <div className="grid gap-6 mt-6 md:grid-cols-3">
                  <Card className="md:col-span-2 border-cyan-500/20">
                    <CardHeader>
                      <CardTitle>Stock History</CardTitle>
                      <CardDescription>History of material stock changes for this machine</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {machineHistory.length === 0 ? (
                        <div className="py-12 text-center">
                          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                          <h3 className="text-lg font-medium">No history available</h3>
                          <p className="text-muted-foreground">This machine has no recorded stock history</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {machineHistory.map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card>
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                      {item.material?.reference || "Unknown Material"}
                                    </CardTitle>
                                    <Badge variant="outline">
                                      {item.material?.category?.name || "Unknown Category"}
                                    </Badge>
                                  </div>
                                  <CardDescription>{item.material?.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    {item.history &&
                                      item.history.map((historyItem, historyIndex) => (
                                        <div key={historyIndex} className="p-3 border rounded-md bg-muted/30">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-4 h-4 text-muted-foreground" />
                                              <span className="text-sm text-muted-foreground">
                                                {formatDate(historyItem.date)}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-muted-foreground">Previous Stock</p>
                                              <p className="font-medium">{historyItem.previousStock}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground">New Stock</p>
                                              <div className="flex items-center gap-2">
                                                <p className="font-medium">{historyItem.newStock}</p>
                                                {historyItem.newStock > historyItem.previousStock ? (
                                                  <Badge variant="success" className="px-1 py-0 text-xs">
                                                    <TrendingUp className="w-3 h-3 mr-1" />+
                                                    {historyItem.newStock - historyItem.previousStock}
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="destructive" className="px-1 py-0 text-xs">
                                                    <TrendingDown className="w-3 h-3 mr-1" />
                                                    {historyItem.newStock - historyItem.previousStock}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          {historyItem.comment && (
                                            <div className="mt-2">
                                              <p className="text-xs text-muted-foreground">Comment</p>
                                              <p className="text-sm">{historyItem.comment}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-cyan-500/20">
                    <CardHeader>
                      <CardTitle>Stock Trends</CardTitle>
                      <CardDescription>Visual representation of stock changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StockHistoryChart history={machineHistory} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}

        {/* Update Allocation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Material Allocation</DialogTitle>
              <DialogDescription>
                Update the allocated stock for {selectedAllocation?.material?.reference}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid items-center grid-cols-4 gap-4">
                <Label htmlFor="current-stock" className="text-right">
                  Current Stock
                </Label>
                <Input
                  id="current-stock"
                  value={selectedAllocation?.allocatedStock || ""}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid items-center grid-cols-4 gap-4">
                <Label htmlFor="new-stock" className="text-right">
                  New Stock
                </Label>
                <Input
                  id="new-stock"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="col-span-3"
                  type="number"
                  min="0"
                />
              </div>
              <div className="grid items-center grid-cols-4 gap-4">
                <Label htmlFor="comment" className="text-right">
                  Comment
                </Label>
                <Input
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional comment"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAllocation} disabled={isUpdating} className="bg-cyan-500 hover:bg-cyan-600">
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Stock"
                )}
              </Button>
            </DialogFooter>

            {/* Success animation overlay */}
            {showSuccessAnimation && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                  <p className="mt-2 text-lg font-medium">Stock Updated!</p>
                </motion.div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Material Details Dialog */}
        <Dialog open={isMaterialDetailsOpen} onOpenChange={setIsMaterialDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Material Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedMaterialDetails?.material?.reference}
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedMaterialDetails?.material?.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedMaterialDetails?.fullDetails?.category?.name || "Unknown"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedMaterialDetails?.material?.description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Allocated Stock</p>
                  <p className="font-medium">{selectedMaterialDetails?.allocatedStock}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className="font-medium">{selectedMaterialDetails?.fullDetails?.currentStock || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Minimum Stock</p>
                  <p className="font-medium">{selectedMaterialDetails?.fullDetails?.minimumStock || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {selectedMaterialDetails?.fullDetails?.critical ? (
                    <Badge variant="destructive">Critical</Badge>
                  ) : selectedMaterialDetails?.fullDetails?.currentStock <=
                    selectedMaterialDetails?.fullDetails?.minimumStock ? (
                    <Badge variant="warning">Low Stock</Badge>
                  ) : (
                    <Badge variant="success">In Stock</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(selectedMaterialDetails?.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIsMaterialDetailsOpen(false)}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsMaterialDetailsOpen(false)
                    openUpdateDialog(selectedMaterialDetails)
                  }}
                  className="border-cyan-500/20 hover:bg-cyan-500/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update Stock
                </Button>
                <Button asChild className="bg-cyan-500 hover:bg-cyan-600">
                  <Link to={`/machinematerial/detail/${selectedMaterialDetails?._id}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Link>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        {/* Help Button (Fixed Position) */}
        <div className="fixed bottom-4 right-4 print:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full shadow-md bg-cyan-500 text-primary-foreground hover:bg-cyan-600"
                  onClick={() => setShowHelp(true)}
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Help & Keyboard Shortcuts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

      
       
      
    </MainLayout>
  )
}

export default MachineDashboard
