"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { getAllMachines } from "@/apis/gestionStockApi/machineApi"
import { getAllMaterials } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Settings,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Zap,
  Target,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"

const FactoryDashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [factories, setFactories] = useState([])
  const [selectedFactory, setSelectedFactory] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    machines: [],
    materials: [],
    allocations: [],
  })
  const [analytics, setAnalytics] = useState({
    totalMachines: 0,
    activeMachines: 0,
    totalMaterials: 0,
    criticalMaterials: 0,
    lowStockMaterials: 0,
    totalAllocations: 0,
    machineUtilization: 0,
    stockEfficiency: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    fetchFactories()
  }, [])

  useEffect(() => {
    if (selectedFactory) {
      fetchFactoryData()
    }
  }, [selectedFactory])

  const fetchFactories = async () => {
    try {
      setIsLoading(true)
      const data = await getAllFactories()
      const factoriesArray = Array.isArray(data) ? data : data?.data || []
      setFactories(factoriesArray)
    } catch (error) {
      console.error("Error fetching factories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch factories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFactoryData = async () => {
    try {
      setIsLoadingData(true)

      const [machinesData, materialsData, allocationsData] = await Promise.all([
        getAllMachines(1, 100),
        getAllMaterials(1, 100),
        getAllAllocations(),
      ])

      // Filter data by selected factory
      let filteredMachines = machinesData?.data || []
      let filteredMaterials = materialsData?.data || []

      // Handle different allocations response formats
      let filteredAllocations = []
      if (allocationsData && allocationsData.data && Array.isArray(allocationsData.data)) {
        // Paginated response format
        filteredAllocations = allocationsData.data
      } else if (Array.isArray(allocationsData)) {
        // Direct array response format
        filteredAllocations = allocationsData
      } else {
        // Fallback to empty array if format is unexpected
        filteredAllocations = []
        console.warn("Unexpected allocations response format:", allocationsData)
      }

      if (selectedFactory._id !== "all") {
        filteredMachines = filteredMachines.filter((machine) => machine.factory?._id === selectedFactory._id)
        filteredMaterials = filteredMaterials.filter((material) => material.factory?._id === selectedFactory._id)
        filteredAllocations = filteredAllocations.filter(
          (allocation) => allocation.machine?.factory?._id === selectedFactory._id,
        )
      }

      setDashboardData({
        machines: filteredMachines,
        materials: filteredMaterials,
        allocations: filteredAllocations,
      })

      calculateAnalytics(filteredMachines, filteredMaterials, filteredAllocations)
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

  const calculateAnalytics = (machines, materials, allocations) => {
    const activeMachines = machines.filter((m) => m.status === "active").length
    const criticalMaterials = materials.filter((m) => m.critical).length
    const lowStockMaterials = materials.filter((m) => m.currentStock <= m.minimumStock).length

    const machineUtilization = machines.length > 0 ? (activeMachines / machines.length) * 100 : 0
    const stockEfficiency = materials.length > 0 ? ((materials.length - lowStockMaterials) / materials.length) * 100 : 0

    setAnalytics({
      totalMachines: machines.length,
      activeMachines,
      totalMaterials: materials.length,
      criticalMaterials,
      lowStockMaterials,
      totalAllocations: allocations.length,
      machineUtilization,
      stockEfficiency,
    })
  }

  const handleFactorySelect = (factory) => {
    setSelectedFactory(factory)
    toast({
      title: "Factory Selected",
      description: `Now viewing data for ${factory.name}`,
    })
  }

  const navigateToMachines = () => {
    navigate(`/dashboard/machines?factory=${selectedFactory._id}`)
  }

  const navigateToMaterials = () => {
    navigate(`/dashboard/materials?factory=${selectedFactory._id}`)
  }

  const navigateToAllocations = () => {
    navigate(`/dashboard/allocations?factory=${selectedFactory._id}`)
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
              <h1 className="mb-4 text-4xl font-bold">Factory Management Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Select a factory to view comprehensive machine and material analytics
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* All Factories Option */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="transition-all duration-300 border-2 border-dashed cursor-pointer border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10"
                  onClick={() => handleFactorySelect({ _id: "all", name: "All Factories" })}
                >
                  <CardHeader className="pb-4 text-center">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20">
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">All Factories</CardTitle>
                    <CardDescription>View consolidated data from all factories</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="outline" className="bg-primary/10 border-primary/30">
                      Global Overview
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Individual Factories */}
              {factories.map((factory) => (
                <motion.div key={factory._id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className="transition-all duration-300 cursor-pointer hover:shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
                    onClick={() => handleFactorySelect(factory)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/30">
                          <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{factory.name}</CardTitle>
                          <CardDescription>{factory.location || "Factory location"}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Click to view dashboard</span>
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {factories.length === 0 && (
              <Card className="py-12 mt-8 text-center">
                <CardContent>
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-medium">No Factories Found</h3>
                  <p className="mb-6 text-muted-foreground">Create a factory first to access the dashboard</p>
                  <Button onClick={() => navigate("/factories/create")}>Create Factory</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-6 mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{selectedFactory.name} Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive overview of machines, materials, and allocations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedFactory(null)}>
              <Building2 className="w-4 h-4 mr-2" />
              Change Factory
            </Button>
            <Button onClick={fetchFactoryData} disabled={isLoadingData}>
              {isLoadingData ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Machines</CardTitle>
              <Settings className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalMachines}</div>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                {analytics.activeMachines} active
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Materials</CardTitle>
              <Package className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics.totalMaterials}</div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {analytics.criticalMaterials} critical
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Machine Utilization
              </CardTitle>
              <Zap className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                {analytics.machineUtilization.toFixed(1)}%
              </div>
              <Progress value={analytics.machineUtilization} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Stock Efficiency
              </CardTitle>
              <Target className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.stockEfficiency.toFixed(1)}%
              </div>
              <Progress value={analytics.stockEfficiency} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card className="transition-shadow cursor-pointer hover:shadow-lg" onClick={navigateToMachines}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Machines Management
              </CardTitle>
              <CardDescription>View and manage all machines in this factory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Machines</span>
                  <Badge variant="secondary">{analytics.totalMachines}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Badge variant="default">{analytics.activeMachines}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maintenance</span>
                  <Badge variant="warning">
                    {dashboardData.machines.filter((m) => m.status === "maintenance").length}
                  </Badge>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Manage Machines
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow cursor-pointer hover:shadow-lg" onClick={navigateToMaterials}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Materials Inventory
              </CardTitle>
              <CardDescription>Monitor and manage material stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Materials</span>
                  <Badge variant="secondary">{analytics.totalMaterials}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <Badge variant="destructive">{analytics.lowStockMaterials}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Critical</span>
                  <Badge variant="destructive">{analytics.criticalMaterials}</Badge>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Manage Materials
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-shadow cursor-pointer hover:shadow-lg" onClick={navigateToAllocations}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Material Allocations
              </CardTitle>
              <CardDescription>Track material assignments to machines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Allocations</span>
                  <Badge variant="secondary">{analytics.totalAllocations}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Machines</span>
                  <Badge variant="default">{analytics.activeMachines}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Efficiency</span>
                  <Badge variant="default">{analytics.stockEfficiency.toFixed(0)}%</Badge>
                </div>
                <Button className="w-full bg-transparent" variant="outline">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Manage Allocations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.allocations.slice(0, 5).map((allocation, index) => (
                  <div key={allocation._id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {allocation.material?.reference} → {allocation.machine?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{allocation.allocatedStock} units allocated</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(allocation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {dashboardData.allocations.length === 0 && (
                  <p className="py-4 text-center text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.lowStockMaterials > 0 && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg border-amber-200 bg-amber-50">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
                      <p className="text-xs text-amber-600">{analytics.lowStockMaterials} materials need restocking</p>
                    </div>
                  </div>
                )}

                {dashboardData.machines.filter((m) => m.status === "maintenance").length > 0 && (
                  <div className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Maintenance Required</p>
                      <p className="text-xs text-orange-600">
                        {dashboardData.machines.filter((m) => m.status === "maintenance").length} machines in
                        maintenance
                      </p>
                    </div>
                  </div>
                )}

                {analytics.criticalMaterials > 0 && (
                  <div className="flex items-center gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Critical Materials</p>
                      <p className="text-xs text-red-600">
                        {analytics.criticalMaterials} critical materials require attention
                      </p>
                    </div>
                  </div>
                )}

                {analytics.lowStockMaterials === 0 &&
                  dashboardData.machines.filter((m) => m.status === "maintenance").length === 0 &&
                  analytics.criticalMaterials === 0 && (
                    <div className="flex items-center gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">All Systems Operational</p>
                        <p className="text-xs text-green-600">No alerts at this time</p>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </MainLayout>
  )
}

export default FactoryDashboard
