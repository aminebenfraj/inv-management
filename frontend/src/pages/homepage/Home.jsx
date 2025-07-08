"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Package,
  Wrench,
  Warehouse,
  Box,
  FileText,
  ShoppingCart,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Activity,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Users,
  Bell,
  Target,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardTitle, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import MainLayout from "../../components/MainLayout"
import { motion } from "framer-motion"

// Import the APIs
import { getAllMaterials } from "@/apis/gestionStockApi/materialApi"
import { getAllMachines } from "@/apis/gestionStockApi/machineApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { getAllPedidos } from "@/apis/pedido/pedidoApi"

import { useToast } from "@/hooks/use-toast"

// Dashboard stat card component with animation
const StatCard = ({ icon: Icon, title, value, trend, color, isLoading, onClick, subtitle }) => (
  <motion.div
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    whileTap={{ y: 0, transition: { duration: 0.2 } }}
    className="w-full"
  >
    <Card
      className="overflow-hidden transition-all border-0 shadow-sm cursor-pointer hover:shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            {isLoading ? (
              <Skeleton className="w-20 h-8 mt-1" />
            ) : (
              <div>
                <h3 className="mb-1 text-3xl font-bold">{value}</h3>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            )}
            {trend !== undefined && !isLoading && (
              <div className="flex items-center mt-3">
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-rose-500" />
                )}
                <span className={`text-xs font-medium ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
                <span className="ml-1 text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

// Feature card component with animation
const FeatureCard = ({ to, icon: Icon, title, description, color, count }) => (
  <motion.div
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    whileTap={{ y: 0, transition: { duration: 0.2 } }}
    className="h-full"
  >
    <Card className="h-full transition-all border-0 shadow-sm hover:shadow-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {count !== undefined && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {count} items
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" asChild className="p-0 font-medium text-primary hover:text-primary/80">
          <Link to={to} className="flex items-center text-sm">
            Access Module
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
)

// Activity item component with animation
const ActivityItem = ({ title, description, time, icon: Icon, iconColor, onClick }) => (
  <motion.div whileHover={{ x: 4, transition: { duration: 0.2 } }} whileTap={{ x: 0, transition: { duration: 0.2 } }}>
    <div
      className="flex items-start gap-4 p-4 transition-all border border-transparent cursor-pointer rounded-xl bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-700"
      onClick={onClick}
    >
      <div className={`p-2.5 rounded-lg ${iconColor} shadow-sm`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      <ChevronRight className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
    </div>
  </motion.div>
)

// Status badge component
const StatusBadge = ({ status }) => {
  let color, icon, label

  switch (status?.toLowerCase?.()) {
    case "on-going":
    case "in_progress":
    case "pending":
      color = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      icon = <Clock className="w-3 h-3 mr-1" />
      label = status === "on-going" ? "On-going" : status === "in_progress" ? "In Progress" : "Pending"
      break
    case "completed":
    case "closed":
      color = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      icon = <CheckCircle className="w-3 h-3 mr-1" />
      label = status === "completed" ? "Completed" : "Closed"
      break
    case "stand-by":
      color = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      icon = <AlertTriangle className="w-3 h-3 mr-1" />
      label = "Stand-by"
      break
    case "cancelled":
      color = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      icon = <AlertTriangle className="w-3 h-3 mr-1" />
      label = "Cancelled"
      break
    default:
      color = "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      icon = <AlertTriangle className="w-3 h-3 mr-1" />
      label = status || "Unknown"
  }

  return (
    <Badge variant="secondary" className={`${color} border-0`}>
      {icon}
      {label}
    </Badge>
  )
}

const Dashboard = () => {
  const [materials, setMaterials] = useState([])
  const [machines, setMachines] = useState([])
  const [allocations, setAllocations] = useState([])
  const [orders, setOrders] = useState([])
  const [massProductions, setMassProductions] = useState([])
  const [readinessEntries, setReadinessEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const navigate = useNavigate()

  // Fetch data when component mounts
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all data in parallel
      const [materialsResponse, machinesResponse, allocationsResponse, ordersResponse] = await Promise.all([
        getAllMaterials(),
        getAllMachines(),
        getAllAllocations(),
        getAllPedidos(),
      ])

      // Process materials
      setMaterials(Array.isArray(materialsResponse) ? materialsResponse : materialsResponse?.data || [])

      // Process machines
      setMachines(Array.isArray(machinesResponse) ? machinesResponse : machinesResponse?.data || [])

      // Process allocations
      setAllocations(Array.isArray(allocationsResponse) ? allocationsResponse : allocationsResponse?.data || [])

      // Process orders
      setOrders(ordersResponse?.data || [])

      // Mock data for mass productions and readiness entries
      setMassProductions([])
      setReadinessEntries([])

      toast({
        title: "Data loaded successfully",
        description: "Dashboard data has been refreshed",
      })
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load dashboard data. Please try again later.")
      toast({
        title: "Error loading data",
        description: "Failed to load dashboard data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllData()
  }

  // Calculate statistics
  const getLowStockCount = () => {
    return materials.filter((material) => material.currentStock <= material.minimumStock).length
  }

  const getActiveProjects = () => {
    return massProductions.filter((prod) => prod.status === "on-going" || prod.status === "in_progress").length
  }

  const getPendingOrders = () => {
    return orders.filter((order) => !order.recepcionado || order.recepcionado === "No").length
  }

  // Get recent activities across all modules
  const getRecentActivities = () => {
    const recentItems = []

    // Add recent materials
    materials.slice(0, 3).forEach((material) => {
      recentItems.push({
        type: "material",
        id: material._id,
        title: `Material ${material.reference || material._id}`,
        description: `${material.description || "Material"} - Stock: ${material.currentStock}`,
        time: new Date(material.updatedAt || material.createdAt).toLocaleString(),
        icon: Package,
        iconColor: "bg-blue-500",
        date: new Date(material.updatedAt || material.createdAt),
        route: `/materials/details/${material._id}`,
      })
    })

    // Add recent orders
    orders.slice(0, 3).forEach((order) => {
      recentItems.push({
        type: "order",
        id: order._id,
        title: `Order ${order.referencia?.reference || order._id}`,
        description: `${order.descripcionInterna || "Order"} - ${getPropertyValue(order.proveedor) || "Supplier"}`,
        time: new Date(order.fechaSolicitud || order.createdAt || new Date()).toLocaleString(),
        icon: ShoppingCart,
        iconColor: "bg-emerald-500",
        date: new Date(order.fechaSolicitud || order.createdAt || new Date()),
        route: `/pedido/${order._id}`,
      })
    })

    // Sort by date (newest first) and take the top 6
    return recentItems.sort((a, b) => b.date - a.date).slice(0, 6)
  }

  // Helper function to safely extract property values from objects
  const getPropertyValue = (obj) => {
    if (!obj) return "N/A"
    if (typeof obj === "string") return obj
    if (typeof obj === "object" && obj !== null) {
      if (obj.name) return obj.name
      if (obj.reference) return obj.reference
      if (obj._id) return obj._id
    }
    return "N/A"
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const recentActivities = getRecentActivities()

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Welcome banner */}
        <div className="w-full p-8 mb-8 text-white shadow-lg rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="mb-3 text-3xl font-bold">Welcome to Your Dashboard</h1>
              <p className="text-lg leading-relaxed text-blue-100">
                Get a comprehensive overview of your inventory, production, and orders in one place.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="text-white bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-sm"
              >
                {refreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Key Metrics</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Package}
                title="Total Materials"
                value={loading ? "..." : materials.length}
                subtitle="Items in inventory"
                trend={5}
                color="bg-blue-500"
                isLoading={loading}
                onClick={() => navigate("/materials")}
              />
              <StatCard
                icon={AlertTriangle}
                title="Low Stock Items"
                value={loading ? "..." : getLowStockCount()}
                subtitle="Need attention"
                trend={-2}
                color="bg-amber-500"
                isLoading={loading}
                onClick={() => navigate("/materials")}
              />
              <StatCard
                icon={Box}
                title="Active Projects"
                value={loading ? "..." : getActiveProjects()}
                subtitle="In progress"
                trend={8}
                color="bg-emerald-500"
                isLoading={loading}
                onClick={() => navigate("/masspd")}
              />
              <StatCard
                icon={ShoppingCart}
                title="Pending Orders"
                value={loading ? "..." : getPendingOrders()}
                subtitle="Awaiting delivery"
                trend={3}
                color="bg-purple-500"
                isLoading={loading}
                onClick={() => navigate("/pedido")}
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Recent Activity</h2>
              </div>
              <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/50">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="w-3/4 h-4 mb-2" />
                            <Skeleton className="w-full h-3 mb-2" />
                            <Skeleton className="w-1/4 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <ActivityItem
                          key={`${activity.type}-${activity.id}-${index}`}
                          title={activity.title}
                          description={activity.description}
                          time={formatDate(activity.time)}
                          icon={activity.icon}
                          iconColor={activity.iconColor}
                          onClick={() => navigate(activity.route)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">No recent activity found</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Activity will appear here as you use the system
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold">Quick Stats</h2>
              </div>
              <div className="space-y-4">
                {/* Inventory Health */}
                <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Package className="w-5 h-5 mr-2 text-blue-500" />
                      Inventory Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        <Skeleton className="w-full h-4" />
                        <Skeleton className="w-full h-4" />
                        <Skeleton className="w-full h-4" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Total Items</span>
                            <span className="text-sm text-muted-foreground">{materials.length}</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-amber-600">Low Stock</span>
                            <span className="text-sm text-muted-foreground">{getLowStockCount()}</span>
                          </div>
                          <Progress
                            value={getLowStockCount() > 0 ? (getLowStockCount() / materials.length) * 100 : 0}
                            className="h-2 bg-muted"
                          >
                            <div
                              className="h-full bg-amber-500"
                              style={{
                                width: `${getLowStockCount() > 0 ? (getLowStockCount() / materials.length) * 100 : 0}%`,
                              }}
                            />
                          </Progress>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-600">Out of Stock</span>
                            <span className="text-sm text-muted-foreground">
                              {materials.filter((m) => m.currentStock <= 0).length}
                            </span>
                          </div>
                          <Progress
                            value={
                              materials.filter((m) => m.currentStock <= 0).length > 0
                                ? (materials.filter((m) => m.currentStock <= 0).length / materials.length) * 100
                                : 0
                            }
                            className="h-2 bg-muted"
                          >
                            <div
                              className="h-full bg-red-500"
                              style={{
                                width: `${materials.filter((m) => m.currentStock <= 0).length > 0 ? (materials.filter((m) => m.currentStock <= 0).length / materials.length) * 100 : 0}%`,
                              }}
                            />
                          </Progress>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database</span>
                        <Badge className="text-green-800 bg-green-100 border-0">Online</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Services</span>
                        <Badge className="text-green-800 bg-green-100 border-0">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Sync</span>
                        <span className="text-xs text-muted-foreground">Just now</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Bell className="w-5 h-5 mr-2 text-orange-500" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="justify-start w-full bg-transparent" asChild>
                        <Link to="/materials/create">
                          <Package className="w-4 h-4 mr-2" />
                          Add Material
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start w-full bg-transparent" asChild>
                        <Link to="/pedido/create">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Create Order
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start w-full bg-transparent" asChild>
                        <Link to="/masspd/create">
                          <Box className="w-4 h-4 mr-2" />
                          New Project
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Module Access */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Module Access</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                to="/materials"
                icon={Package}
                title="Materials"
                description="Manage your inventory, track stock levels, and monitor material usage across all projects."
                color="bg-blue-500"
                count={materials.length}
              />
              <FeatureCard
                to="/machines"
                icon={Wrench}
                title="Machines"
                description="View and manage your machines, equipment status, and maintenance schedules."
                color="bg-emerald-500"
                count={machines.length}
              />
              <FeatureCard
                to="/machinematerial"
                icon={Warehouse}
                title="Allocations"
                description="Allocate materials to machines and track resource distribution efficiently."
                color="bg-amber-500"
                count={allocations.length}
              />
              <FeatureCard
                to="/pedido"
                icon={ShoppingCart}
                title="Orders"
                description="Manage purchase orders, track deliveries, and handle supplier relationships."
                color="bg-rose-500"
                count={orders.length}
              />
              <FeatureCard
                to="/masspd"
                icon={Box}
                title="Mass Production"
                description="Oversee production processes, project timelines, and manufacturing workflows."
                color="bg-indigo-500"
                count={massProductions.length}
              />
              <FeatureCard
                to="/readiness"
                icon={FileText}
                title="Readiness"
                description="Track project readiness, documentation status, and completion milestones."
                color="bg-purple-500"
                count={readinessEntries.length}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default Dashboard
