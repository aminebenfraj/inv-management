"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAllLocations, deleteLocation } from "@/apis/gestionStockApi/locationApi"
import { Plus, Edit, Trash2, MapPin, Search, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const ShowLocations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationToDelete, setLocationToDelete] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllLocations()
      setLocations(data)
    } catch (error) {
      console.error("Failed to fetch locations:", error)
      setError("Failed to fetch locations. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch locations. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (location) => {
    setLocationToDelete(location)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!locationToDelete) return

    setIsDeleting(true)
    try {
      await deleteLocation(locationToDelete._id)
      setLocations(locations.filter((loc) => loc._id !== locationToDelete._id))
      toast({
        title: "Success",
        description: "Location deleted successfully!",
      })
    } catch (error) {
      console.error("Failed to delete location:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete location. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setLocationToDelete(null)
    }
  }

  const filteredLocations = locations.filter((loc) => loc.location.toLowerCase().includes(searchTerm.toLowerCase()))

  const renderSkeletons = () => {
    return Array(6)
      .fill()
      .map((_, index) => (
        <Card key={index} className="bg-gray-50 dark:bg-zinc-700">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center">
              <Skeleton className="w-5 h-5 mr-2" />
              <Skeleton className="w-3/4 h-6" />
            </div>
            <div className="flex justify-end pt-4 space-x-2">
              <Skeleton className="w-20 h-9" />
              <Skeleton className="w-20 h-9" />
            </div>
          </CardContent>
        </Card>
      ))
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <Card className="bg-white shadow-lg dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Locations</CardTitle>
              <CardDescription>Manage your inventory locations</CardDescription>
            </div>
            <Link to="/locations/create">
              <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                <Plus className="w-4 h-4 mr-2" />
                Add New Location
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {renderSkeletons()}
              </motion.div>
            ) : filteredLocations.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <MapPin className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No locations found</h3>
                <p className="mb-4 text-muted-foreground">
                  {searchTerm ? "Try adjusting your search" : "Get started by adding your first location"}
                </p>
                {!searchTerm && (
                  <Link to="/locations/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Location
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredLocations.map((loc) => (
                  <motion.div
                    key={loc._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-4">
                          <MapPin className="w-5 h-5 mr-2 text-zinc-500 dark:text-zinc-400" />
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{loc.location}</h3>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Link to={`/locations/edit/${loc._id}`}>
                            <Button
                              variant="outline"
                              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDeleteClick(loc)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the location "{locationToDelete?.location}"? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

export default ShowLocations
