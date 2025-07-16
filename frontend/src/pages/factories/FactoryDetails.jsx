"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFactoryById } from "../../apis/gestionStockApi/factoryApi"
import { getAllMachines } from "../../apis/gestionStockApi/machineApi" // Assuming this can take a factoryId filter
import { getAllMaterials } from "../../apis/gestionStockApi/materialApi" // Assuming this can take a factoryId filter
import {
  ArrowLeft,
  Edit,
  Building2,
  Cog,
  Package,
  Users,
  UserCheck,
  CheckCircle,
  PowerOff,
  Wrench,
  AlertCircle,
  Eye,
  Settings,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const FactoryDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [factory, setFactory] = useState(null)
  const [machines, setMachines] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (id) {
      fetchFactoryDetails()
    }
  }, [id])

  const fetchFactoryDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch factory details
      const factoryData = await getFactoryById(id)
      setFactory(factoryData)

      // Fetch machines for this factory by passing factoryId as a filter
      // Assuming getAllMachines can accept a 'factory' filter
      const machinesResponse = await getAllMachines(1, 1000, "", { factory: id })
      const factoryMachines = Array.isArray(machinesResponse) ? machinesResponse : machinesResponse?.data || []
      setMachines(factoryMachines)

      // Fetch materials for this factory by passing factoryId as a filter
      // Assuming getAllMaterials can accept a 'factory' filter
      const materialsResponse = await getAllMaterials(1, 1000, "", { factory: id })
      const factoryMaterials = Array.isArray(materialsResponse) ? materialsResponse : materialsResponse?.data || []
      setMaterials(factoryMaterials)
    } catch (error) {
      console.error("Failed to fetch factory details:", error)
      setError("Failed to fetch factory details")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch factory details. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-200 bg-red-50">
            <PowerOff className="w-3 h-3" />
            Inactive
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Wrench className="w-3 h-3" />
            Maintenance
          </Badge>
        )
      default:
        return null
    }
  }

  const getMachineStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
            Inactive
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Maintenance
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStockStatusBadge = (material) => {
    if (material.currentStock <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (material.currentStock <= material.minimumStock) {
      return (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
        In Stock
      </Badge>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 rounded-full border-t-primary animate-spin"></div>
        </div>
      </MainLayout>
    )
  }

  if (error || !factory) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Factory not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/factories")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Factories
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container py-8 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/factories")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Factories
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/factories/edit/${factory._id}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Factory
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-500" />
                <div>
                  <CardTitle className="text-2xl">{factory.name}</CardTitle>
                  <CardDescription>{factory.description || "No description provided"}</CardDescription>
                </div>
              </div>
              {getStatusBadge(factory.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Cog className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Machines</p>
                  <p className="text-2xl font-bold">{machines.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Materials</p>
                  <p className="text-2xl font-bold">{materials.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Authorized Users</p>
                  <p className="text-2xl font-bold">{factory.authorizedUsers?.length || 0}</p>
                </div>
              </div>
            </div>

            {factory.manager && (
              <div className="flex items-center gap-2 p-3 mt-4 rounded-md bg-blue-50">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  <strong>Manager:</strong> {factory.manager.username} ({factory.manager.email})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="machines">Machines ({machines.length})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    Machine Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Active Machines</span>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        {machines.filter((m) => m.status === "active").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Inactive Machines</span>
                      <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                        {machines.filter((m) => m.status === "inactive").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Under Maintenance</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {machines.filter((m) => m.status === "maintenance").length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Material Stock Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>In Stock</span>
                      <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        {materials.filter((m) => m.currentStock > m.minimumStock).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {materials.filter((m) => m.currentStock <= m.minimumStock && m.currentStock > 0).length}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Out of Stock</span>
                      <Badge variant="destructive">{materials.filter((m) => m.currentStock <= 0).length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {factory.authorizedUsers && factory.authorizedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Authorized Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {factory.authorizedUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-2 p-2 border rounded-md">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="text-sm font-medium text-blue-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="machines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Factory Machines</h3>
              <Link to={`/machines?factory=${factory._id}`}>
                <Button variant="outline" size="sm">
                  View All Machines
                </Button>
              </Link>
            </div>

            {machines.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Cog className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No Machines Found</h3>
                  <p className="mb-4 text-muted-foreground">This factory doesn't have any machines assigned yet.</p>
                  <Link to="/machines/create">
                    <Button>Add Machine</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {machines.map((machine) => (
                    <motion.div
                      key={machine._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{machine.name}</CardTitle>
                            <Settings className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-3 text-sm text-muted-foreground">
                            {machine.description || "No description"}
                          </p>
                          <div className="flex items-center justify-between">
                            {getMachineStatusBadge(machine.status)}
                            <Link to={`/machines/edit/${machine._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Factory Materials</h3>
              <Link to={`/materials?factory=${factory._id}`}>
                <Button variant="outline" size="sm">
                  View All Materials
                </Button>
              </Link>
            </div>

            {materials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No Materials Found</h3>
                  <p className="mb-4 text-muted-foreground">This factory doesn't have any materials assigned yet.</p>
                  <Link to="/materials/create">
                    <Button>Add Material</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {materials.map((material) => (
                    <motion.div
                      key={material._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{material.reference}</CardTitle>
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2 text-sm text-muted-foreground">{material.manufacturer}</p>
                          <p className="mb-3 text-sm text-muted-foreground">
                            Stock: {material.currentStock} / Min: {material.minimumStock}
                          </p>
                          <div className="flex items-center justify-between">
                            {getStockStatusBadge(material)}
                            <Link to={`/materials/details/${material._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default FactoryDetails
