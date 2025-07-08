"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  History,
  Loader2,
  FileText,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

import { getAllMaterials, deleteMaterial, getFilterOptions } from "../../../apis/gestionStockApi/materialApi"
import MainLayout from "@/components/MainLayout"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

const itemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}

const MaterialList = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isHistoryMatch, setIsHistoryMatch] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState(null)

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    manufacturers: [],
    suppliers: [],
    categories: [],
    locations: [],
  })

  // Filters state
  const [filters, setFilters] = useState({
    manufacturer: "",
    supplier: "",
    category: "",
    location: "",
    critical: "",
    consumable: "",
  })

  // Sorting state
  const [sort, setSortConfig] = useState({
    field: "updatedAt",
    order: -1,
  })

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Debounce search to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load filter options on component mount
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = {}

      // Get manufacturer options directly from materials
      const manufacturerData = await getFilterOptions("manufacturer")
      options.manufacturers = manufacturerData.map((name) => ({ name }))

      // Get other options from their respective collections
      options.suppliers = await getFilterOptions("supplier")
      options.categories = await getFilterOptions("category")
      options.locations = await getFilterOptions("location")

      setFilterOptions(options)
    } catch (error) {
      console.error("Error loading filter options:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load filter options",
      })
    }
  }, [toast])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Map active tab to stockStatus filter
      let stockStatusFilter = ""
      if (activeTab !== "all") {
        stockStatusFilter = activeTab
      }

      // Combine tab filter with other filters
      const combinedFilters = {
        ...filters,
        stockStatus: stockStatusFilter,
      }

      const response = await getAllMaterials(pagination.page, pagination.limit, debouncedSearch, combinedFilters, sort)

      if (response && response.data) {
        setMaterials(response.data)
        setPagination({
          ...pagination,
          page: response.page || 1,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        })

        // Check if results are from reference history
        setIsHistoryMatch(response.matchType === "history")
      } else {
        setError("Invalid data received from server.")
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      setError("Failed to load materials. Please try again later.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load materials. Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearch, activeTab, filters, sort, toast])

  // Fetch materials when pagination, search, filters or sort changes
  useEffect(() => {
    fetchMaterials()
  }, [pagination.page, pagination.limit, debouncedSearch, activeTab, sort, fetchMaterials])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [filters])

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

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
      console.error("Failed to delete material:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete material. Please try again.",
      })
    } finally {
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      manufacturer: "",
      supplier: "",
      category: "",
      location: "",
      critical: "",
      consumable: "",
    })
  }

  const handleSortChange = (field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        // Toggle order if same field
        return { field, order: prev.order === 1 ? -1 : 1 }
      }
      // Default to descending for new field
      return { field, order: -1 }
    })
  }

  const exportToCSV = () => {
    const headers = [
      "Reference",
      "Manufacturer",
      "Description",
      "Current Stock",
      "Minimum Stock",
      "Price",
      "Critical",
      "Consumable",
      "Supplier",
      "Location",
      "Category",
    ]

    const rows = materials.map((material) => [
      material.reference,
      material.manufacturer,
      material.description,
      material.currentStock,
      material.minimumStock,
      material.price,
      material.critical ? "Yes" : "No",
      material.consumable ? "Yes" : "No",
      material.supplier ? material.supplier.companyName : "N/A",
      material.location ? material.location.location : "N/A",
      material.category ? material.category.name : "N/A",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `materials-${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStockStatusVariant = (material) => {
    if (material.currentStock <= 0) return "destructive"
    if (material.currentStock <= material.minimumStock) return "warning"
    return "success"
  }

  const getStockStatus = (material) => {
    if (material.currentStock <= 0) return "Out of Stock"
    if (material.currentStock <= material.minimumStock) return "Low Stock"
    return "In Stock"
  }

  return (
    <MainLayout>
      <motion.div className="container py-6 mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Materials</h1>
            <p className="text-muted-foreground">Manage your inventory materials</p>
          </div>
          <div className="flex flex-col gap-2 mt-4 sm:flex-row md:mt-0">
            <Link to="/materials/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add New Material
              </Button>
            </Link>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" /> Export to CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference, manufacturer, or description..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isHistoryMatch && (
                  <Badge variant="secondary" className="absolute transform -translate-y-1/2 right-3 top-1/2">
                    <History className="w-3 h-3 mr-1" />
                    Reference History Match
                  </Badge>
                )}
              </div>
              <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="in_stock">In Stock</TabsTrigger>
                  <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
                  <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
                </TabsList>
              </Tabs>
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                    {Object.values(filters).some((v) => v !== "" && v !== null) && (
                      <Badge variant="secondary" className="ml-1">
                        {Object.values(filters).filter((v) => v !== "" && v !== null).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                        <X className="w-4 h-4 mr-2" />
                        Clear all
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-4">
                      {/* Manufacturer filter */}
                      <div className="space-y-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Select
                          value={filters.manufacturer}
                          onValueChange={(value) => handleFilterChange("manufacturer", value)}
                        >
                          <SelectTrigger id="manufacturer">
                            <SelectValue placeholder="Select manufacturer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Manufacturers</SelectItem>
                            {filterOptions.manufacturers.map((manufacturer, index) => (
                              <SelectItem key={index} value={manufacturer.name}>
                                {manufacturer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Supplier filter */}
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select
                          value={filters.supplier}
                          onValueChange={(value) => handleFilterChange("supplier", value)}
                        >
                          <SelectTrigger id="supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Suppliers</SelectItem>
                            {filterOptions.suppliers.map((supplier) => (
                              <SelectItem key={supplier._id} value={supplier._id}>
                                {supplier.companyName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category filter */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={filters.category}
                          onValueChange={(value) => handleFilterChange("category", value)}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {filterOptions.categories.map((category) => (
                              <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location filter */}
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={filters.location}
                          onValueChange={(value) => handleFilterChange("location", value)}
                        >
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {filterOptions.locations.map((location) => (
                              <SelectItem key={location._id} value={location._id}>
                                {location.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Critical filter */}
                      <div className="space-y-2">
                        <Label htmlFor="critical">Critical Items</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="critical"
                            checked={filters.critical === "true"}
                            onCheckedChange={(checked) => handleFilterChange("critical", checked ? "true" : "")}
                          />
                          <label
                            htmlFor="critical"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Show only critical items
                          </label>
                        </div>
                      </div>

                      {/* Consumable filter */}
                      <div className="space-y-2">
                        <Label htmlFor="consumable">Consumable Items</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="consumable"
                            checked={filters.consumable === "true"}
                            onCheckedChange={(checked) => handleFilterChange("consumable", checked ? "true" : "")}
                          />
                          <label
                            htmlFor="consumable"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Show only consumable items
                          </label>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="flex items-center justify-between p-4 border-t">
                    <Button variant="ghost" onClick={() => setIsFilterOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        fetchMaterials()
                        setIsFilterOpen(false)
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Materials</CardTitle>
                <CardDescription>
                  {pagination.total} {pagination.total === 1 ? "item" : "items"} found
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSortChange("reference")}>
                    Reference {sort.field === "reference" && (sort.order === 1 ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("manufacturer")}>
                    Manufacturer {sort.field === "manufacturer" && (sort.order === 1 ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("currentStock")}>
                    Stock {sort.field === "currentStock" && (sort.order === 1 ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("price")}>
                    Price {sort.field === "price" && (sort.order === 1 ? "↑" : "↓")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSortChange("updatedAt")}>
                    Last Updated {sort.field === "updatedAt" && (sort.order === 1 ? "↑" : "↓")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading materials...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium">No materials found</h3>
                <p className="mt-1 mb-4 text-muted-foreground">
                  {searchTerm || Object.values(filters).some((v) => v !== "" && v !== null)
                    ? "Try adjusting your filters"
                    : "Create your first material to get started"}
                </p>
                {!searchTerm && !Object.values(filters).some((v) => v !== "" && v !== null) && (
                  <Link to="/materials/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Material
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          className="p-0 hover:bg-transparent"
                          onClick={() => handleSortChange("reference")}
                        >
                          Reference
                          <ArrowUpDown className="w-4 h-4 ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="p-0 hover:bg-transparent"
                          onClick={() => handleSortChange("manufacturer")}
                        >
                          Manufacturer
                          <ArrowUpDown className="w-4 h-4 ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="p-0 hover:bg-transparent"
                          onClick={() => handleSortChange("currentStock")}
                        >
                          Stock
                          <ArrowUpDown className="w-4 h-4 ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="p-0 hover:bg-transparent"
                          onClick={() => handleSortChange("price")}
                        >
                          Price
                          <ArrowUpDown className="w-4 h-4 ml-1" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence initial={false} mode="popLayout">
                      {materials.map((material, index) => (
                        <motion.tr
                          key={material._id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className="group"
                        >
                          <TableCell className="font-medium">
                            {material.reference}
                            {material.referenceHistory && material.referenceHistory.length > 0 && (
                              <Badge variant="outline" className="ml-2">
                                <History className="w-3 h-3 mr-1" />
                                {material.referenceHistory.length}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{material.manufacturer}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{material.description}</TableCell>
                          <TableCell>{material.currentStock}</TableCell>
                          <TableCell>${material.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={getStockStatusVariant(material)}>{getStockStatus(material)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/materials/details/${material._id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/materials/edit/${material._id}`)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => confirmDelete(material)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {materials.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the material
                <span className="font-semibold"> {materialToDelete?.reference}</span>. This action cannot be undone.
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

export default MaterialList
