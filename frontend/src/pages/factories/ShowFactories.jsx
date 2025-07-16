"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllFactories, deleteFactory } from "../../apis/gestionStockApi/factoryApi"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Settings,
  Wrench,
  PowerOff,
  Filter,
  RefreshCw,
  Building2,
  Users,
  UserCheck,
  Cog,
  Package,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ShowFactories = () => {
  const [factories, setFactories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [factoryToDelete, setFactoryToDelete] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFactories()
  }, [searchTerm, statusFilter]) // Re-fetch when search or filter changes

  const fetchFactories = async () => {
    try {
      setLoading(true)
      setError(null)
      const filters = statusFilter !== "all" ? { status: statusFilter } : {}
      const response = await getAllFactories(1, 100, searchTerm, filters) // Pass search and filters
      setFactories(response.data || response)
    } catch (error) {
      console.error("Failed to fetch factories:", error)
      setError("Failed to fetch factories. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch factories. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (factory) => {
    setFactoryToDelete(factory)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!factoryToDelete) return

    try {
      await deleteFactory(factoryToDelete._id)
      setFactories(factories.filter((factory) => factory._id !== factoryToDelete._id))
      toast({
        title: "Success",
        description: "Factory deleted successfully!",
      })
    } catch (error) {
      console.error("Failed to delete factory:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete factory. Please try again.",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFactoryToDelete(null)
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
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-200 bg-gray-50">
            {status}
          </Badge>
        )
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "inactive":
        return <PowerOff className="w-5 h-5 text-red-500" />
      case "maintenance":
        return <Wrench className="w-5 h-5 text-amber-500" />
      default:
        return <Settings className="w-5 h-5 text-gray-500" />
    }
  }

  // Filtered factories are now handled by the API call itself,
  // so we just use the 'factories' state directly for rendering.
  // The 'searchTerm' and 'statusFilter' are passed to getAllFactories.

  const renderSkeletons = () => {
    return Array(6)
      .fill()
      .map((_, index) => (
        <Card key={index} className="bg-gray-50 dark:bg-zinc-700">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-1/4 h-8" />
            <div className="flex justify-end pt-4 space-x-2">
              <Skeleton className="w-20 h-9" />
              <Skeleton className="w-20 h-9" />
            </div>
          </CardContent>
        </Card>
      ))
  }

  const renderGridView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {loading ? (
        renderSkeletons()
      ) : (
        <AnimatePresence>
          {factories.map((factory) => (
            <motion.div
              key={factory._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="flex flex-col h-full transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {factory.name}
                    </CardTitle>
                    {getStatusIcon(factory.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow py-2">
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
                    {factory.description || "No description provided"}
                  </p>

                  <div className="mb-3 space-y-2">
                    {factory.manager && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserCheck className="w-3 h-3" />
                        <span>Manager: {factory.manager.username}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {factory.machines && (
                        <div className="flex items-center gap-1">
                          <Cog className="w-3 h-3" />
                          <span>{factory.machines.length} machines</span>
                        </div>
                      )}
                      {factory.materials && (
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>{factory.materials.length} materials</span>
                        </div>
                      )}
                      {factory.authorizedUsers && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{factory.authorizedUsers.length} users</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {getStatusBadge(factory.status)}
                </CardContent>
                <CardFooter className="flex justify-end pt-2 space-x-2">
                  <Link to={`/factories/detail/${factory._id}`}>
                    {" "}
                    {/* Link to new FactoryDetails page */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 bg-transparent hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Link to={`/factories/edit/${factory._id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 bg-transparent hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 bg-transparent hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteClick(factory)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  )

  return (
    <MainLayout>
      <div className="container py-8 mx-auto">
        <Card className="bg-white shadow-lg dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Factories</CardTitle>
              <CardDescription>Manage your factory locations and operations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchFactories} className="bg-transparent h-9">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link to="/factories/create">
                <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 h-9">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Factory
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters and search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search factories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status counts */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-green-100 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Active</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                      {factories.filter((f) => f.status === "active").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Maintenance</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      {factories.filter((f) => f.status === "maintenance").length}
                    </p>
                  </div>
                  <Wrench className="w-8 h-8 text-amber-500" />
                </CardContent>
              </Card>

              <Card className="border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Inactive</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                      {factories.filter((f) => f.status === "inactive").length}
                    </p>
                  </div>
                  <PowerOff className="w-8 h-8 text-red-500" />
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Factories list/grid */}
            {!loading && factories.length === 0 && !error ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Building2 className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No factories found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first factory"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Link to="/factories/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Factory
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              renderGridView()
            )}
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the factory "{factoryToDelete?.name}"? This action cannot be undone and
                may affect associated machines and materials.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

export default ShowFactories
