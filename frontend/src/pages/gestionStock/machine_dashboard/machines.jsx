"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getMachinesByFactory, getAllMachines, deleteMachine } from "@/apis/gestionStockApi/machineApi"
import { getUserFactories } from "@/apis/gestionStockApi/factoryApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { getCurrentUser } from "@/apis/userApi"
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
  AlertTriangle,
  RefreshCw,
  ChevronRight,
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
  const [userFactories, setUserFactories] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [machineToDelete, setMachineToDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMoreData, setHasMoreData] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Check if user is admin
  const isAdmin = currentUser?.roles?.includes("Admin") || false

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setIsLoading(true)

      // If no factory ID in URL, redirect to dashboard
      if (!factoryId) {
        toast({
          title: "No Factory Selected",
          description: "Please select a factory from the dashboard first.",
          variant: "destructive",
        })
        navigate("/dashboard")
        return
      }

      // Fetch user info and authorized factories
      const [userResponse, userFactoriesResponse] = await Promise.all([getCurrentUser(), getUserFactories()])

      setCurrentUser(userResponse)

      // Handle factories response
      const factoriesArray = Array.isArray(userFactoriesResponse)
        ? userFactoriesResponse
        : userFactoriesResponse?.data || []

      setUserFactories(factoriesArray)

      // Determine if user is admin
      const userIsAdmin = userResponse?.roles?.includes("Admin") || false

      let selectedFactory = null
      let machinesData = null

      if (factoryId === "all") {
        // Admin viewing all factories
        if (userIsAdmin) {
          selectedFactory = { name: "All Factories", _id: "all" }
          // Get all machines for admin
          const allMachinesResponse = await getAllMachines(1, 50)
          machinesData = allMachinesResponse
        } else {
          // Non-admin users should only see machines from their authorized factories
          selectedFactory = { name: "Your Authorized Factories", _id: "all" }
          // Get all machines and filter by user's authorized factories
          const allMachinesResponse = await getAllMachines(1, 50)
          const authorizedFactoryIds = factoriesArray.map((f) => f._id)

          if (allMachinesResponse?.data) {
            const filteredMachines = allMachinesResponse.data.filter(
              (machine) => machine.factory && authorizedFactoryIds.includes(machine.factory._id),
            )
            machinesData = {
              ...allMachinesResponse,
              data: filteredMachines,
              total: filteredMachines.length,
            }
          }
        }
      } else {
        // Specific factory selected - use the new dedicated endpoint
        selectedFactory = factoriesArray.find((f) => f._id === factoryId)

        // Verify user has access to this factory
        if (!userIsAdmin && !selectedFactory) {
          toast({
            title: "Access Denied",
            description: "You don't have access to this factory.",
            variant: "destructive",
          })
          navigate("/dashboard")
          return
        }

        // If admin but factory not in their list, create placeholder
        if (!selectedFactory && userIsAdmin) {
          selectedFactory = {
            name: `Factory ${factoryId}`,
            _id: factoryId,
          }
        }

        // Fetch machines for specific factory using the new dedicated endpoint
        try {
          machinesData = await getMachinesByFactory(factoryId, 1, 50)

          // If the API returned factory info, use it to update selectedFactory
          if (machinesData?.factory) {
            selectedFactory = {
              ...selectedFactory,
              name: machinesData.factory.name,
              description: machinesData.factory.description,
            }
          }
        } catch (error) {
          console.error("Error fetching machines for factory:", error)

          // If factory not found or access denied
          if (error.response?.status === 404) {
            toast({
              title: "Factory Not Found",
              description: "The selected factory could not be found.",
              variant: "destructive",
            })
          } else if (error.response?.status === 403) {
            toast({
              title: "Access Denied",
              description: "You don't have access to this factory.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch machines for this factory.",
              variant: "destructive",
            })
          }

          navigate("/dashboard")
          return
        }
      }

      // Set factory and machines
      setFactory(selectedFactory)
      setMachines(machinesData?.data || [])

      // Fetch allocations
      const allocationsData = await getAllAllocations()
      let allocationsArray = []
      if (allocationsData && allocationsData.data && Array.isArray(allocationsData.data)) {
        allocationsArray = allocationsData.data
      } else if (Array.isArray(allocationsData)) {
        allocationsArray = allocationsData
      }

      // Filter allocations for the current machines
      const machineIds = (machinesData?.data || []).map((m) => m._id)
      const filteredAllocations = allocationsArray.filter(
        (allocation) => allocation.machine && machineIds.includes(allocation.machine._id),
      )
      setAllocations(filteredAllocations)

      console.log(`Loaded ${machinesData?.data?.length || 0} machines for factory:`, selectedFactory?.name)

      toast({
        title: "Machines Loaded",
        description: `Found ${machinesData?.data?.length || 0} machines for ${selectedFactory?.name}`,
      })

      setCurrentPage(1)
      setTotalPages(machinesData?.totalPages || 1)
      setHasMoreData((machinesData?.totalPages || 1) > 1)
    } catch (error) {
      console.error("Error fetching machines data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch machines data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    fetchInitialData()
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

  const searchMachinesInFactory = async (searchTerm, statusFilter) => {
    if (!factoryId || factoryId === "all") return

    try {
      const machinesData = await getMachinesByFactory(factoryId, 1, 1000, searchTerm, statusFilter)
      setMachines(machinesData?.data || [])

      toast({
        title: "Search Complete",
        description: `Found ${machinesData?.data?.length || 0} machines matching your criteria`,
      })
    } catch (error) {
      console.error("Error searching machines:", error)
      toast({
        title: "Search Error",
        description: "Failed to search machines",
        variant: "destructive",
      })
    }
  }

  // Add debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (factoryId && factoryId !== "all") {
        searchMachinesInFactory(searchTerm, statusFilter === "all" ? "" : statusFilter)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, factoryId])

  const filteredMachines =
    factoryId === "all"
      ? machines.filter((machine) => {
          const matchesSearch =
            machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.description?.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesStatus = statusFilter === "all" || machine.status === statusFilter
          return matchesSearch && matchesStatus
        })
      : machines // For specific factories, filtering is done server-side

  const confirmDelete = (machine) => {
    setMachineToDelete(machine)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!machineToDelete) return

    try {
      await deleteMachine(machineToDelete._id)

      // Remove from local state
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

  const handleCreateMachine = () => {
    // Pass factory ID to create page if specific factory is selected
    if (factoryId && factoryId !== "all") {
      navigate(`/machines/create?factory=${factoryId}`)
    } else {
      navigate("/machines/create")
    }
  }

  const loadMoreMachines = async () => {
    if (!hasMoreData || isLoadingData) return

    try {
      setIsLoadingData(true)
      const nextPage = currentPage + 1

      let additionalData
      if (factoryId === "all") {
        additionalData = await getAllMachines(nextPage, 50)
      } else {
        additionalData = await getMachinesByFactory(factoryId, nextPage, 50)
      }

      if (additionalData?.data?.length > 0) {
        setMachines((prev) => [...prev, ...additionalData.data])
        setCurrentPage(nextPage)
        setHasMoreData(nextPage < additionalData.totalPages)
      } else {
        setHasMoreData(false)
      }
    } catch (error) {
      console.error("Error loading more machines:", error)
      toast({
        title: "Error",
        description: "Failed to load more machines",
        variant: "destructive",
      })
    } finally {
      setIsLoadingData(false)
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

  if (!factory) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="mb-2 text-lg font-medium">Factory Not Found</h3>
            <p className="mb-4 text-muted-foreground">
              The selected factory could not be found or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
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
                <Building2 className="inline w-4 h-4 mr-1" />
                {filteredMachines.length} machines found
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreateMachine}>
              <Plus className="w-4 h-4 mr-2" />
              Add Machine
            </Button>
          </div>
        </div>

        {/* Factory Info Card */}
        {factoryId !== "all" && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Selected Factory</h3>
                  <p className="text-sm text-blue-700">{factory.name}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                    {machines.length} Machines
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              {factoryId !== "all" && ` in ${factory.name}`}
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
                    : `No machines found for ${factory.name}. Add your first machine to get started.`}
                </p>
                <Button onClick={handleCreateMachine}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Machine
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {hasMoreData && (
          <div className="flex justify-center mt-6">
            <Button onClick={loadMoreMachines} disabled={isLoadingData} variant="outline">
              {isLoadingData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading More...
                </>
              ) : (
                <>
                  Load More Machines
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

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
