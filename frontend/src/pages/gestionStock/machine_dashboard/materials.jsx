"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getAllMaterials, deleteMaterial } from "@/apis/gestionStockApi/materialApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"

const MaterialsPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const factoryId = searchParams.get("factory")
  const { toast } = useToast()

  const [materials, setMaterials] = useState([])
  const [allocations, setAllocations] = useState([])
  const [factory, setFactory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)

  useEffect(() => {
    fetchData()
  }, [factoryId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const [materialsData, allocationsData, factoriesData] = await Promise.all([
        getAllMaterials(1, 100),
        getAllAllocations(),
        getAllFactories(),
      ])

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

      if (factoryId && factoryId !== "all") {
        filteredMaterials = filteredMaterials.filter((material) => material.factory?._id === factoryId)
        filteredAllocations = filteredAllocations.filter((allocation) => allocation.machine?.factory?._id === factoryId)

        const factoryData = Array.isArray(factoriesData) ? factoriesData : factoriesData?.data || []
        const currentFactory = factoryData.find((f) => f._id === factoryId)
        setFactory(currentFactory)
      } else {
        setFactory({ name: "All Factories", _id: "all" })
      }

      setMaterials(filteredMaterials)
      setAllocations(filteredAllocations)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch materials data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatus = (material) => {
    if (material.currentStock <= 0) return { status: "Out of Stock", variant: "destructive" }
    if (material.currentStock <= material.minimumStock) return { status: "Low Stock", variant: "warning" }
    return { status: "In Stock", variant: "default" }
  }

  const getMaterialAllocations = (materialId) => {
    return allocations.filter((allocation) => allocation.material?._id === materialId)
  }

  const getTotalAllocated = (materialId) => {
    const materialAllocations = getMaterialAllocations(materialId)
    return materialAllocations.reduce((total, allocation) => total + (allocation.allocatedStock || 0), 0)
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStock = true
    if (stockFilter === "low") {
      matchesStock = material.currentStock <= material.minimumStock
    } else if (stockFilter === "out") {
      matchesStock = material.currentStock <= 0
    } else if (stockFilter === "critical") {
      matchesStock = material.critical
    }

    return matchesSearch && matchesStock
  })

  const confirmDelete = (material) => {
    setMaterialToDelete(material)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!materialToDelete) return

    try {
      await deleteMaterial(materialToDelete._id)
      setMaterials(materials.filter((material) => material._id !== materialToDelete._id))
      toast({
        title: "Success",
        description: "Material deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting material:", error)
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading materials...</span>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-6 mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Materials Inventory</h1>
              <p className="text-muted-foreground">
                {factory?.name} - {filteredMaterials.length} materials
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/materials/create">
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Materials</p>
                  <p className="text-2xl font-bold">{materials.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">
                    {materials.filter((m) => m.currentStock > m.minimumStock).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {materials.filter((m) => m.currentStock <= m.minimumStock && m.currentStock > 0).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {materials.filter((m) => m.currentStock <= 0).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="critical">Critical Materials</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle>Materials List</CardTitle>
            <CardDescription>
              {filteredMaterials.length} of {materials.length} materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Factory</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => {
                    const stockStatus = getStockStatus(material)
                    const totalAllocated = getTotalAllocated(material._id)
                    return (
                      <TableRow key={material._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.reference}</p>
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                            <p className="text-xs text-muted-foreground">{material.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{material.currentStock}</p>
                            <p className="text-xs text-muted-foreground">Min: {material.minimumStock}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                            {material.critical && <Badge variant="destructive">Critical</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{totalAllocated} units</Badge>
                        </TableCell>
                        <TableCell>${material.price?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{material.factory?.name || "No Factory"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to={`/materials/details/${material._id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/materials/edit/${material._id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Material
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(material)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Material
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredMaterials.length === 0 && (
              <div className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No materials found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || stockFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first material to get started"}
                </p>
                <Button asChild>
                  <Link to="/materials/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Material
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the material "{materialToDelete?.reference}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </MainLayout>
  )
}

export default MaterialsPage
