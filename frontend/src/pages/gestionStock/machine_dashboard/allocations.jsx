"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getAllAllocations, deleteAllocation, updateAllocation } from "@/apis/gestionStockApi/materialMachineApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { getAllMaterials } from "@/apis/gestionStockApi/materialApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Layers,
  Package,
  Settings,
  Loader2,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"

const AllocationsPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const factoryId = searchParams.get("factory")
  const { toast } = useToast()

  const [allocations, setAllocations] = useState([])
  const [materials, setMaterials] = useState([])
  const [factory, setFactory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [allocationToDelete, setAllocationToDelete] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState(null)
  const [newStockValue, setNewStockValue] = useState("")

  useEffect(() => {
    fetchData()
  }, [factoryId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const [allocationsData, materialsData, factoriesData] = await Promise.all([
        getAllAllocations(),
        getAllMaterials(1, 100),
        getAllFactories(),
      ])

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
        filteredAllocations = filteredAllocations.filter((allocation) => allocation.machine?.factory?._id === factoryId)

        const factoryData = Array.isArray(factoriesData) ? factoriesData : factoriesData?.data || []
        const currentFactory = factoryData.find((f) => f._id === factoryId)
        setFactory(currentFactory)
      } else {
        setFactory({ name: "All Factories", _id: "all" })
      }

      setAllocations(filteredAllocations)
      const filteredMaterials = materialsData?.data || []
      setMaterials(filteredMaterials)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch allocations data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMaterialDetails = (materialId) => {
    return materials.find((material) => material._id === materialId)
  }

  const filteredAllocations = allocations.filter((allocation) => {
    const materialRef = allocation.material?.reference || ""
    const materialDesc = allocation.material?.description || ""
    const machineName = allocation.machine?.name || ""
    const factoryName = allocation.machine?.factory?.name || ""

    return (
      materialRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materialDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factoryName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const confirmDelete = (allocation) => {
    setAllocationToDelete(allocation)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!allocationToDelete) return

    try {
      await deleteAllocation(allocationToDelete._id)
      setAllocations(allocations.filter((allocation) => allocation._id !== allocationToDelete._id))
      toast({
        title: "Success",
        description: "Allocation deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting allocation:", error)
      toast({
        title: "Error",
        description: "Failed to delete allocation",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setAllocationToDelete(null)
    }
  }

  const openEditDialog = (allocation) => {
    setEditingAllocation(allocation)
    setNewStockValue(allocation.allocatedStock.toString())
    setEditDialogOpen(true)
  }

  const handleQuickEdit = async () => {
    if (!editingAllocation || !newStockValue) return

    try {
      await updateAllocation(editingAllocation._id, {
        allocatedStock: Number.parseInt(newStockValue),
        comment: `Quick update from dashboard`,
      })

      // Update local state
      setAllocations(
        allocations.map((allocation) =>
          allocation._id === editingAllocation._id
            ? { ...allocation, allocatedStock: Number.parseInt(newStockValue) }
            : allocation,
        ),
      )

      toast({
        title: "Success",
        description: "Allocation updated successfully",
      })

      setEditDialogOpen(false)
      setEditingAllocation(null)
      setNewStockValue("")
    } catch (error) {
      console.error("Error updating allocation:", error)
      toast({
        title: "Error",
        description: "Failed to update allocation",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading allocations...</span>
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
              <h1 className="text-3xl font-bold">Material Allocations</h1>
              <p className="text-muted-foreground">
                {factory?.name} - {filteredAllocations.length} allocations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/machinematerial/create">
                <Plus className="w-4 h-4 mr-2" />
                New Allocation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Allocations</p>
                  <p className="text-2xl font-bold">{allocations.length}</p>
                </div>
                <Layers className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Materials</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Set(allocations.map((a) => a.material?._id)).size}
                  </p>
                </div>
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Machines</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(allocations.map((a) => a.machine?._id)).size}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by material, machine, or factory..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Allocations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Allocations List</CardTitle>
            <CardDescription>
              {filteredAllocations.length} of {allocations.length} allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Factory</TableHead>
                    <TableHead>Allocated Stock</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllocations.map((allocation) => {
                    const materialDetails = getMaterialDetails(allocation.material?._id)
                    return (
                      <TableRow key={allocation._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{allocation.material?.reference}</p>
                            <p className="text-sm text-muted-foreground">{allocation.material?.description}</p>
                            {materialDetails?.critical && (
                              <Badge variant="destructive" className="mt-1">
                                Critical
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{allocation.machine?.name}</p>
                            <Badge variant="outline" className="mt-1">
                              {allocation.machine?.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{allocation.machine?.factory?.name || "No Factory"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-medium">{allocation.allocatedStock}</div>
                        </TableCell>
                        <TableCell>{new Date(allocation.updatedAt).toLocaleDateString()}</TableCell>
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
                              <DropdownMenuItem onClick={() => openEditDialog(allocation)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Quick Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/machinematerial/detail/${allocation._id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/machinematerial/edit/${allocation._id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Full Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(allocation)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Allocation
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

            {filteredAllocations.length === 0 && (
              <div className="py-8 text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No allocations found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "Create your first allocation to get started"}
                </p>
                <Button asChild>
                  <Link to="/machinematerial/create">
                    <Plus className="w-4 h-4 mr-2" />
                    New Allocation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Edit Allocation</DialogTitle>
              <DialogDescription>
                Update stock allocation for {editingAllocation?.material?.reference} on{" "}
                {editingAllocation?.machine?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock">Allocated Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  placeholder="Enter new stock value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickEdit}>Update Stock</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the allocation between{" "}
                <span className="font-semibold">{allocationToDelete?.material?.reference}</span> and{" "}
                <span className="font-semibold">{allocationToDelete?.machine?.name}</span>. This action cannot be
                undone.
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

export default AllocationsPage
