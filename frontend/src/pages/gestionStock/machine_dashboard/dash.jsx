"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { getUserFactories, getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { getCurrentUser } from "@/apis/userApi"
import { getAllMachines } from "@/apis/gestionStockApi/machineApi"
import { getAllMaterials } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Building2,
  Settings,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  Target,
  Loader2,
  RefreshCw,
  DollarSign,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircleIcon,
  PieChart,
  Download,
  ChevronRight,
  Gauge,
  Shield,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js"
import { Bar, Line, Doughnut } from "react-chartjs-2"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
)

const EnhancedFactoryDashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [factories, setFactories] = useState([])
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    machines: [],
    materials: [],
    allocations: [],
  })
  const [timeRange, setTimeRange] = useState("7d")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Check if user is admin based on roles
  const isAdmin = useMemo(() => {
    return currentUser?.roles?.includes("Admin") || false
  }, [currentUser])

  // Enhanced analytics with more detailed metrics
  const analytics = useMemo(() => {
    const { machines, materials, allocations } = dashboardData

    // Machine analytics
    const activeMachines = machines.filter((m) => m.status === "active").length
    const maintenanceMachines = machines.filter((m) => m.status === "maintenance").length
    const inactiveMachines = machines.filter((m) => m.status === "inactive").length
    const machineUtilization = machines.length > 0 ? (activeMachines / machines.length) * 100 : 0

    // Material analytics
    const criticalMaterials = materials.filter((m) => m.critical).length
    const lowStockMaterials = materials.filter((m) => m.currentStock <= m.minimumStock).length
    const outOfStockMaterials = materials.filter((m) => m.currentStock <= 0).length
    const consumableMaterials = materials.filter((m) => m.consumable).length
    const stockEfficiency = materials.length > 0 ? ((materials.length - lowStockMaterials) / materials.length) * 100 : 0

    // Financial analytics
    const totalMaterialValue = materials.reduce((sum, m) => sum + m.currentStock * m.price, 0)
    const averageMaterialPrice =
      materials.length > 0 ? materials.reduce((sum, m) => sum + m.price, 0) / materials.length : 0

    // Allocation analytics
    const totalAllocatedStock = allocations.reduce((sum, a) => sum + a.allocatedStock, 0)
    const allocationsPerMachine = machines.length > 0 ? allocations.length / machines.length : 0

    // Trend calculations (mock data for demonstration)
    const machineUtilizationTrend = 5.2
    const stockEfficiencyTrend = -2.1
    const materialValueTrend = 12.5

    return {
      machines: {
        total: machines.length,
        active: activeMachines,
        maintenance: maintenanceMachines,
        inactive: inactiveMachines,
        utilization: machineUtilization,
        utilizationTrend: machineUtilizationTrend,
      },
      materials: {
        total: materials.length,
        critical: criticalMaterials,
        lowStock: lowStockMaterials,
        outOfStock: outOfStockMaterials,
        consumable: consumableMaterials,
        efficiency: stockEfficiency,
        efficiencyTrend: stockEfficiencyTrend,
        totalValue: totalMaterialValue,
        averagePrice: averageMaterialPrice,
        valueTrend: materialValueTrend,
      },
      allocations: {
        total: allocations.length,
        totalStock: totalAllocatedStock,
        perMachine: allocationsPerMachine,
      },
    }
  }, [dashboardData])

  // Factory-specific analytics for "All Factories" view
  const factoriesAnalytics = useMemo(() => {
    if (selectedFactory?._id !== "all" || !isAdmin) return []

    return factories.map((factory) => {
      const factoryMachines = dashboardData.machines.filter((m) => m.factory?._id === factory._id)
      const factoryMaterials = dashboardData.materials.filter((m) => m.factory?._id === factory._id)
      const factoryAllocations = dashboardData.allocations.filter((a) => a.machine?.factory?._id === factory._id)

      const activeMachines = factoryMachines.filter((m) => m.status === "active").length
      const totalMachines = factoryMachines.length
      const utilization = totalMachines > 0 ? (activeMachines / totalMachines) * 100 : 0

      const lowStockMaterials = factoryMaterials.filter((m) => m.currentStock <= m.minimumStock).length
      const totalMaterials = factoryMaterials.length
      const stockEfficiency = totalMaterials > 0 ? ((totalMaterials - lowStockMaterials) / totalMaterials) * 100 : 0

      const totalValue = factoryMaterials.reduce((sum, m) => sum + m.currentStock * m.price, 0)
      const totalAllocations = factoryAllocations.length

      return {
        factory,
        metrics: {
          machines: {
            total: totalMachines,
            active: activeMachines,
            utilization,
          },
          materials: {
            total: totalMaterials,
            lowStock: lowStockMaterials,
            efficiency: stockEfficiency,
            totalValue,
          },
          allocations: {
            total: totalAllocations,
          },
        },
      }
    })
  }, [dashboardData, factories, selectedFactory, isAdmin])

  // Chart data
  const machineStatusChartData = {
    labels: ["Active", "Maintenance", "Inactive"],
    datasets: [
      {
        data: [analytics.machines.active, analytics.machines.maintenance, analytics.machines.inactive],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  }

  const materialStockChartData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [
          analytics.materials.total - analytics.materials.lowStock,
          analytics.materials.lowStock - analytics.materials.outOfStock,
          analytics.materials.outOfStock,
        ],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  }

  const utilizationTrendData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Machine Utilization %",
        data: [85, 88, 92, 89, 94, 87, 91],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const stockValueTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Stock Value ($)",
        data: [45000, 48000, 52000, 49000],
        backgroundColor: "#10b981",
      },
    ],
  }

  const fetchUserAndFactories = async () => {
    try {
      setIsLoading(true)

      // Fetch current user first
      const userResponse = await getCurrentUser()
      console.log("User response:", userResponse)
      setCurrentUser(userResponse)

      // Determine user role based on roles array
      const userRoles = userResponse?.roles || []
      const isUserAdmin = userRoles.includes("Admin")
      setUserRole(isUserAdmin ? "admin" : "user")

      // For admin users, fetch ALL factories, for regular users fetch only their authorized factories
      let factoriesResponse
      if (isUserAdmin) {
        console.log("Admin user detected, fetching all factories...")
        factoriesResponse = await getAllFactories() // Admin gets all factories
      } else {
        console.log("Regular user detected, fetching user factories...")
        factoriesResponse = await getUserFactories() // Regular user gets only authorized factories
      }

      console.log("Factories response:", factoriesResponse)

      // Handle factories response - check both data property and direct array
      let factoriesArray = []

      if (Array.isArray(factoriesResponse)) {
        factoriesArray = factoriesResponse
      } else if (factoriesResponse?.data && Array.isArray(factoriesResponse.data)) {
        factoriesArray = factoriesResponse.data
      } else if (factoriesResponse && typeof factoriesResponse === "object") {
        // If it's an object with pagination info, extract the data
        factoriesArray = factoriesResponse.data || []
      }

      console.log("Processed factories array:", factoriesArray)
      console.log("Number of factories found:", factoriesArray.length)
      console.log("User is admin:", isUserAdmin)

      setFactories(factoriesArray)

      // Auto-select factory for non-admin users with single factory access
      if (!isUserAdmin && factoriesArray.length === 1) {
        setSelectedFactory(factoriesArray[0])
        toast({
          title: "Factory Auto-Selected",
          description: `Viewing data for ${factoriesArray[0].name}`,
        })
      }

      // Show info about factory access
      if (factoriesArray.length === 0) {
        toast({
          title: "No Factory Access",
          description: "You don't have access to any factories. Contact your administrator.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Factories Loaded",
          description: `Found ${factoriesArray.length} accessible factories${isUserAdmin ? " (Admin access)" : ""}`,
        })
      }
    } catch (error) {
      console.error("Error fetching user and factories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user information and factories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAndFactories()
  }, [])

  useEffect(() => {
    if (selectedFactory) {
      fetchFactoryData()
    }
  }, [selectedFactory, timeRange])

  const fetchFactoryData = async () => {
    try {
      setIsLoadingData(true)

      const [machinesData, materialsData, allocationsData] = await Promise.all([
        getAllMachines(1, 50), // Changed from 100 to 50
        getAllMaterials(1, 50), // Changed from 100 to 50
        getAllAllocations(),
      ])

      let filteredMachines = machinesData?.data || []
      let filteredMaterials = materialsData?.data || []
      let filteredAllocations = []

      if (allocationsData && allocationsData.data && Array.isArray(allocationsData.data)) {
        filteredAllocations = allocationsData.data
      } else if (Array.isArray(allocationsData)) {
        filteredAllocations = allocationsData
      }

      // Filter data based on selected factory and user permissions
      if (selectedFactory._id !== "all") {
        filteredMachines = filteredMachines.filter((machine) => machine.factory?._id === selectedFactory._id)
        filteredMaterials = filteredMaterials.filter((material) => material.factory?._id === selectedFactory._id)
        filteredAllocations = filteredAllocations.filter(
          (allocation) => allocation.machine?.factory?._id === selectedFactory._id,
        )
      } else if (!isAdmin) {
        // Non-admin users should never see "all" data, filter by their authorized factories
        const authorizedFactoryIds = factories.map((f) => f._id)
        filteredMachines = filteredMachines.filter((machine) => authorizedFactoryIds.includes(machine.factory?._id))
        filteredMaterials = filteredMaterials.filter((material) => authorizedFactoryIds.includes(material.factory?._id))
        filteredAllocations = filteredAllocations.filter((allocation) =>
          authorizedFactoryIds.includes(allocation.machine?.factory?._id),
        )
      }

      setDashboardData({
        machines: filteredMachines,
        materials: filteredMaterials,
        allocations: filteredAllocations,
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error fetching factory data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch factory data",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleFactorySelect = (factory) => {
    setSelectedFactory(factory)
    toast({
      title: "Factory Selected",
      description: `Now viewing data for ${factory.name}`,
    })
  }

  // Navigation functions with factory context
  const navigateToMachines = () => {
    if (selectedFactory) {
      navigate(`/machines?factory=${selectedFactory._id}`)
    } else {
      navigate("/machines")
    }
  }

  const navigateToMaterials = () => {
    if (selectedFactory) {
      navigate(`/materials?factory=${selectedFactory._id}`)
    } else {
      navigate("/materials")
    }
  }

  const navigateToAllocations = () => {
    if (selectedFactory) {
      navigate(`/allocations?factory=${selectedFactory._id}`)
    } else {
      navigate("/allocations")
    }
  }

  const exportData = () => {
    const data = {
      factory: selectedFactory.name,
      timestamp: new Date().toISOString(),
      analytics,
      rawData: dashboardData,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `factory-dashboard-${selectedFactory.name}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Dashboard data has been exported successfully",
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading factories...</span>
        </div>
      </MainLayout>
    )
  }

  if (!selectedFactory) {
    return (
      <MainLayout>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container py-8 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"
              >
                Factory Management Dashboard
              </motion.h1>
              <p className="text-xl text-muted-foreground">
                {isAdmin
                  ? "Select from all available factories to view comprehensive analytics and insights"
                  : "Select from your authorized factories to view analytics and insights"}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm capitalize text-muted-foreground">
                  Access Level: {isAdmin ? "Admin" : "User"} • {factories.length} factories available
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* All Factories Option - Only for Admin */}
              {isAdmin && (
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card
                    className="relative overflow-hidden transition-all duration-300 border-2 border-dashed cursor-pointer border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-xl"
                    onClick={() => handleFactorySelect({ _id: "all", name: "All Factories" })}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
                    <CardHeader className="relative pb-4 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl">All Factories</CardTitle>
                      <CardDescription>View consolidated data from all factories</CardDescription>
                    </CardHeader>
                    <CardContent className="relative text-center">
                      <Badge variant="outline" className="bg-primary/10 border-primary/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin Access
                      </Badge>
                      <div className="flex items-center justify-center mt-4 text-sm text-muted-foreground">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Click to access
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Individual Factories */}
              {factories.map((factory, index) => (
                <motion.div
                  key={factory._id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + (isAdmin ? 2 : 1)) }}
                >
                  <Card
                    className="relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 group"
                    onClick={() => handleFactorySelect(factory)}
                  >
                    <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 group-hover:opacity-100" />
                    <CardHeader className="relative pb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 transition-colors bg-blue-100 rounded-full dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50">
                          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {factory.name}
                          </CardTitle>
                          <CardDescription>{factory.description || "Factory location"}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Click to view dashboard</span>
                        <ChevronRight className="w-4 h-4 transition-transform text-primary group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {factories.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="py-12 mt-8 text-center">
                  <CardContent>
                    <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-medium">No Authorized Factories</h3>
                    <p className="mb-6 text-muted-foreground">
                      You don't have access to any factories. Contact your administrator to get factory access.
                    </p>
                    <Button variant="outline" onClick={fetchUserAndFactories}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Access
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-6 mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                {selectedFactory.name} Dashboard
              </h1>
              {isAdmin && (
                <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {selectedFactory._id === "all"
                ? "Consolidated analytics from all factories"
                : "Factory-specific analytics and insights"}{" "}
              • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setSelectedFactory(null)}>
              <Building2 className="w-4 h-4 mr-2" />
              Change Factory
            </Button>
            <Button onClick={fetchFactoryData} disabled={isLoadingData}>
              {isLoadingData ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue={selectedFactory?._id === "all" && isAdmin ? "factories-overview" : "overview"}
          className="space-y-6"
        >
          <TabsList
            className={`grid w-full ${selectedFactory?._id === "all" && isAdmin ? "grid-cols-5" : "grid-cols-4"}`}
          >
            {selectedFactory?._id === "all" && isAdmin && (
              <TabsTrigger value="factories-overview">Factories Overview</TabsTrigger>
            )}
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="machines">Machines</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* New Factories Overview Tab - Only for Admin viewing All Factories */}
          {selectedFactory?._id === "all" && isAdmin && (
            <TabsContent value="factories-overview" className="space-y-6">
              {/* Factories Summary Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {factoriesAnalytics.map((factoryData, index) => (
                  <motion.div
                    key={factoryData.factory._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg group">
                      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 group-hover:opacity-100" />
                      <CardHeader className="relative pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/30">
                              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{factoryData.factory.name}</CardTitle>
                              <CardDescription>{factoryData.factory.description || "Factory location"}</CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFactorySelect(factoryData.factory)}
                            className="transition-opacity opacity-0 group-hover:opacity-100"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="relative space-y-4">
                        {/* Machine Metrics */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-blue-500" />
                              Machines
                            </span>
                            <span className="font-medium">{factoryData.metrics.machines.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Utilization</span>
                            <span
                              className={`font-medium ${factoryData.metrics.machines.utilization > 80 ? "text-green-600" : factoryData.metrics.machines.utilization > 60 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {factoryData.metrics.machines.utilization.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={factoryData.metrics.machines.utilization} className="h-2" />
                        </div>

                        {/* Material Metrics */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-500" />
                              Materials
                            </span>
                            <span className="font-medium">{factoryData.metrics.materials.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Stock Efficiency</span>
                            <span
                              className={`font-medium ${factoryData.metrics.materials.efficiency > 80 ? "text-green-600" : factoryData.metrics.materials.efficiency > 60 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {factoryData.metrics.materials.efficiency.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={factoryData.metrics.materials.efficiency} className="h-2" />
                        </div>

                        {/* Value and Allocations */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              ${factoryData.metrics.materials.totalValue.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Material Value</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-amber-600">
                              {factoryData.metrics.allocations.total}
                            </div>
                            <div className="text-xs text-muted-foreground">Allocations</div>
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex gap-2 pt-2">
                          {factoryData.metrics.machines.utilization > 80 && (
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              High Performance
                            </Badge>
                          )}
                          {factoryData.metrics.materials.lowStock > 0 && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Stock Alert
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Comparative Analytics */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Factory Performance Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: factoriesAnalytics.map((f) => f.factory.name),
                          datasets: [
                            {
                              label: "Machine Utilization %",
                              data: factoriesAnalytics.map((f) => f.metrics.machines.utilization),
                              backgroundColor: "rgba(59, 130, 246, 0.6)",
                              borderColor: "rgba(59, 130, 246, 1)",
                              borderWidth: 1,
                            },
                            {
                              label: "Stock Efficiency %",
                              data: factoriesAnalytics.map((f) => f.metrics.materials.efficiency),
                              backgroundColor: "rgba(16, 185, 129, 0.6)",
                              borderColor: "rgba(16, 185, 129, 1)",
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                            },
                          },
                          plugins: {
                            legend: {
                              position: "top",
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Material Value Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Doughnut
                        data={{
                          labels: factoriesAnalytics.map((f) => f.factory.name),
                          datasets: [
                            {
                              data: factoriesAnalytics.map((f) => f.metrics.materials.totalValue),
                              backgroundColor: [
                                "#3b82f6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                                "#06b6d4",
                                "#84cc16",
                                "#f97316",
                              ],
                              borderWidth: 2,
                              borderColor: "#ffffff",
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: $${context.parsed.toLocaleString()}`,
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Global Factory Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {factoriesAnalytics.reduce((sum, f) => sum + f.metrics.machines.total, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Machines</div>
                      <div className="mt-1 text-xs text-green-600">
                        {factoriesAnalytics.reduce((sum, f) => sum + f.metrics.machines.active, 0)} Active
                      </div>
                    </div>
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {factoriesAnalytics.reduce((sum, f) => sum + f.metrics.materials.total, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Materials</div>
                      <div className="mt-1 text-xs text-amber-600">
                        {factoriesAnalytics.reduce((sum, f) => sum + f.metrics.materials.lowStock, 0)} Low Stock
                      </div>
                    </div>
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        $
                        {factoriesAnalytics
                          .reduce((sum, f) => sum + f.metrics.materials.totalValue, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                      <div className="mt-1 text-xs text-muted-foreground">Across All Factories</div>
                    </div>
                    <div className="p-4 text-center border rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">
                        {factoriesAnalytics.reduce((sum, f) => sum + f.metrics.allocations.total, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Allocations</div>
                      <div className="mt-1 text-xs text-muted-foreground">Active Assignments</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Factory Rankings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Factory Performance Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {factoriesAnalytics
                      .sort(
                        (a, b) =>
                          b.metrics.machines.utilization +
                          b.metrics.materials.efficiency -
                          (a.metrics.machines.utilization + a.metrics.materials.efficiency),
                      )
                      .map((factoryData, index) => (
                        <motion.div
                          key={factoryData.factory._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 transition-colors border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                    ? "bg-gray-400"
                                    : index === 2
                                      ? "bg-amber-600"
                                      : "bg-gray-300"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{factoryData.factory.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {factoryData.metrics.machines.total} machines • {factoryData.metrics.materials.total}{" "}
                                materials
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {(
                                (factoryData.metrics.machines.utilization + factoryData.metrics.materials.efficiency) /
                                2
                              ).toFixed(1)}
                              %
                            </div>
                            <div className="text-xs text-muted-foreground">Overall Score</div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Machine Utilization
                    </CardTitle>
                    <Gauge className="w-4 h-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {analytics.machines.utilization.toFixed(1)}%
                    </div>
                    <div className="flex items-center text-xs">
                      {analytics.machines.utilizationTrend > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                      )}
                      <span className={analytics.machines.utilizationTrend > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(analytics.machines.utilizationTrend)}% vs last period
                      </span>
                    </div>
                    <Progress value={analytics.machines.utilization} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 dark:border-green-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                      Stock Efficiency
                    </CardTitle>
                    <Target className="w-4 h-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {analytics.materials.efficiency.toFixed(1)}%
                    </div>
                    <div className="flex items-center text-xs">
                      {analytics.materials.efficiencyTrend > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                      )}
                      <span className={analytics.materials.efficiencyTrend > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(analytics.materials.efficiencyTrend)}% vs last period
                      </span>
                    </div>
                    <Progress value={analytics.materials.efficiency} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 dark:border-purple-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Material Value
                    </CardTitle>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      ${analytics.materials.totalValue.toLocaleString()}
                    </div>
                    <div className="flex items-center text-xs">
                      {analytics.materials.valueTrend > 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                      )}
                      <span className={analytics.materials.valueTrend > 0 ? "text-green-600" : "text-red-600"}>
                        {Math.abs(analytics.materials.valueTrend)}% vs last period
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                      Avg: ${analytics.materials.averagePrice.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Active Allocations
                    </CardTitle>
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                      {analytics.allocations.total}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      {analytics.allocations.totalStock.toLocaleString()} units allocated
                    </div>
                    <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {analytics.allocations.perMachine.toFixed(1)} per machine
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Machine Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut
                      data={machineStatusChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Material Stock Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut
                      data={materialStockChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="transition-all duration-300 cursor-pointer hover:shadow-lg"
                  onClick={navigateToMachines}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Machines Management
                    </CardTitle>
                    <CardDescription>Monitor and control all factory machines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{analytics.machines.active}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">{analytics.machines.maintenance}</div>
                          <div className="text-xs text-muted-foreground">Maintenance</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{analytics.machines.inactive}</div>
                          <div className="text-xs text-muted-foreground">Inactive</div>
                        </div>
                      </div>
                      <Button className="w-full bg-transparent" variant="outline">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Manage Machines
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="transition-all duration-300 cursor-pointer hover:shadow-lg"
                  onClick={navigateToMaterials}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      Materials Inventory
                    </CardTitle>
                    <CardDescription>Track and manage material stock levels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {analytics.materials.total - analytics.materials.lowStock}
                          </div>
                          <div className="text-xs text-muted-foreground">In Stock</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-amber-600">{analytics.materials.lowStock}</div>
                          <div className="text-xs text-muted-foreground">Low Stock</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{analytics.materials.outOfStock}</div>
                          <div className="text-xs text-muted-foreground">Out of Stock</div>
                        </div>
                      </div>
                      <Button className="w-full bg-transparent" variant="outline">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Manage Materials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="transition-all duration-300 cursor-pointer hover:shadow-lg"
                  onClick={navigateToAllocations}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Material Allocations
                    </CardTitle>
                    <CardDescription>Optimize material distribution to machines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{analytics.allocations.total}</div>
                          <div className="text-xs text-muted-foreground">Total Allocations</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {analytics.allocations.totalStock.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Units Allocated</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">{analytics.allocations.perMachine.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Avg per Machine</div>
                      </div>
                      <Button className="w-full bg-transparent" variant="outline">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Manage Allocations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Machine Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line
                      data={utilizationTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Machine Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Active Machines</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        {analytics.machines.active}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-amber-500" />
                        <span>Under Maintenance</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {analytics.machines.maintenance}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span>Inactive Machines</span>
                      </div>
                      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                        {analytics.machines.inactive}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Machine Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {dashboardData.machines.slice(0, 10).map((machine, index) => (
                      <motion.div
                        key={machine._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              machine.status === "active"
                                ? "bg-green-500"
                                : machine.status === "maintenance"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <div>
                            <p className="font-medium">{machine.name}</p>
                            <p className="text-sm text-muted-foreground">{machine.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {machine.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Value Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar
                      data={stockValueTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Material Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span>Critical Materials</span>
                      </div>
                      <Badge variant="destructive">{analytics.materials.critical}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-blue-500" />
                        <span>Consumable Materials</span>
                      </div>
                      <Badge variant="outline">{analytics.materials.consumable}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <span>Total Value</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        ${analytics.materials.totalValue.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Material Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {dashboardData.materials
                      .filter((material) => material.currentStock <= material.minimumStock)
                      .slice(0, 10)
                      .map((material, index) => (
                        <motion.div
                          key={material._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle
                              className={`w-5 h-5 ${material.currentStock <= 0 ? "text-red-500" : "text-amber-500"}`}
                            />
                            <div>
                              <p className="font-medium">{material.reference}</p>
                              <p className="text-sm text-muted-foreground">
                                Current: {material.currentStock} | Min: {material.minimumStock}
                              </p>
                            </div>
                          </div>
                          <Badge variant={material.currentStock <= 0 ? "destructive" : "warning"}>
                            {material.currentStock <= 0 ? "Out of Stock" : "Low Stock"}
                          </Badge>
                        </motion.div>
                      ))}
                    {dashboardData.materials.filter((m) => m.currentStock <= m.minimumStock).length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>All materials are adequately stocked</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Efficiency Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="mb-2 text-4xl font-bold text-blue-600">
                      {((analytics.machines.utilization + analytics.materials.efficiency) / 2).toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Factory Score</div>
                    <Progress
                      value={(analytics.machines.utilization + analytics.materials.efficiency) / 2}
                      className="mt-4"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Material Value</span>
                      <span className="font-medium">${analytics.materials.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Material Cost</span>
                      <span className="font-medium">${analytics.materials.averagePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cost per Machine</span>
                      <span className="font-medium">
                        $
                        {analytics.machines.total > 0
                          ? (analytics.materials.totalValue / analytics.machines.total).toLocaleString()
                          : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productivity Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Machines</span>
                      <span className="font-medium">
                        {analytics.machines.active}/{analytics.machines.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Allocations per Machine</span>
                      <span className="font-medium">{analytics.allocations.perMachine.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Stock Turnover</span>
                      <span className="font-medium">
                        {analytics.materials.total > 0
                          ? (analytics.allocations.totalStock / analytics.materials.total).toFixed(1)
                          : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-600">Strengths</h4>
                    <div className="space-y-2">
                      {analytics.machines.utilization > 80 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          High machine utilization rate
                        </div>
                      )}
                      {analytics.materials.efficiency > 75 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Good stock management efficiency
                        </div>
                      )}
                      {analytics.materials.outOfStock === 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          No materials out of stock
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-amber-600">Areas for Improvement</h4>
                    <div className="space-y-2">
                      {analytics.machines.maintenance > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                          {analytics.machines.maintenance} machines need maintenance
                        </div>
                      )}
                      {analytics.materials.lowStock > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                          {analytics.materials.lowStock} materials have low stock
                        </div>
                      )}
                      {analytics.machines.utilization < 70 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                          Machine utilization could be improved
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </MainLayout>
  )
}

export default EnhancedFactoryDashboard
