"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getAllMachines, deleteMachine } from "@/apis/gestionStockApi/machineApi"
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
  Settings,
  CheckCircle,
  Wrench,
  PowerOff,
  Loader2,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"

const MachinesPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const factoryId = searchParams.get("factory")
  const { toast } = useToast()

  const [machines, setMachines] = useState([])
  const [allocations, setAllocations] = useState([])
  const [factory, setFactory] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [machineToDelete, setMachineToDelete] = useState(null)

  useEffect(() => {
    fetchData()
  }, [factoryId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      const [machinesData, allocationsData, factoriesData] = await Promise.all([
        getAllMachines(1, 100),
        getAllAllocations(),
        getAllFactories(),
      ])

      let filteredMachines = machinesData?.data || []
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
        filteredMachines = filteredMachines.filter((machine) => machine.factory?._id === factoryId)
        filteredAllocations = filteredAllocations.filter((allocation) => allocation.machine?.factory?._id === factoryId)

        const factoryData = Array.isArray(factoriesData) ? factoriesData : factoriesData?.data || []
        const currentFactory = factoryData.find((f) => f._id === factoryId)
        setFactory(currentFactory)
      } else {
        setFactory({ name: "All Factories", _id: "all" })
      }

      setMachines(filteredMachines)
      setAllocations(filteredAllocations)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch machines data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default"
      case "maintenance":
        return "warning"
      case "inactive":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "maintenance":
        return <Wrench className="w-4 h-4 text-amber-500" />
      case "inactive":
        return <PowerOff className="w-4 h-4 text-gray-500" />
      default:
        return <Settings className="w-4 h-4 text-gray-500" />
    }
  }

  const getMachineAllocations = (machineId) => {
    return allocations.filter((allocation) => allocation.machine?._id === machineId)
  }

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || machine.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const confirmDelete = (machine) => {
    setMachineToDelete(machine)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!machineToDelete) return

    try {
      await deleteMachine(machineToDelete._id)
      setMachines(machines.filter((machine) => machine._id !== machineToDelete._id))
      toast({
        title: "Success",
        description: "Machine deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting machine:", error)
      toast({
        title: "Error",
        description: "Failed to delete machine",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMachineToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading machines...</span>
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
              <h1 className="text-3xl font-bold">Machines Management</h1>
              <p className="text-muted-foreground">
                {factory?.name} - {filteredMachines.length} machines
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/machines/create">
                <Plus className="w-4 h-4 mr-2" />
                Add Machine
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
                  <p className="text-sm text-muted-foreground">Total Machines</p>
                  <p className="text-2xl font-bold">{machines.length}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {machines.filter((m) => m.status === "active").length}
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
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {machines.filter((m) => m.status === "maintenance").length}
                  </p>
                </div>
                <Wrench className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {machines.filter((m) => m.status === "inactive").length}
                  </p>
                </div>
                <PowerOff className="w-8 h-8 text-gray-500" />
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
                  placeholder="Search machines..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Machines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Machines List</CardTitle>
            <CardDescription>
              {filteredMachines.length} of {machines.length} machines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Factory</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMachines.map((machine) => {
                    const machineAllocations = getMachineAllocations(machine._id)
                    return (
                      <TableRow key={machine._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{machine.name}</p>
                            <p className="text-sm text-muted-foreground">{machine.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(machine.status)}
                            <Badge variant={getStatusColor(machine.status)}>{machine.status}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{machine.factory?.name || "No Factory"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{machineAllocations.length} materials</Badge>
                        </TableCell>
                        <TableCell>{new Date(machine.updatedAt).toLocaleDateString()}</TableCell>
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
                                <Link to={`/machines/details/${machine._id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/machines/edit/${machine._id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Machine
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(machine)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Machine
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

            {filteredMachines.length === 0 && (
              <div className="py-8 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No machines found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first machine to get started"}
                </p>
                <Button asChild>
                  <Link to="/machines/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Machine
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
                This will permanently delete the machine "{machineToDelete?.name}". This action cannot be undone.
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

export default MachinesPage
