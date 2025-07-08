"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAllSuppliers, deleteSupplier } from "@/apis/gestionStockApi/supplierApi"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Building,
  Phone,
  Mail,
  User,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
      setError("Failed to fetch suppliers. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch suppliers. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = (supplier) => {
    setSupplierToDelete(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!supplierToDelete) return

    setIsDeleting(true)
    try {
      await deleteSupplier(supplierToDelete._id)
      setSuppliers(suppliers.filter((supplier) => supplier._id !== supplierToDelete._id))
      toast({
        title: "Success",
        description: "Supplier deleted successfully!",
      })
    } catch (error) {
      console.error("Failed to delete supplier:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setSupplierToDelete(null)
    }
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.businessEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <Card className="overflow-hidden shadow-lg border-zinc-200 dark:border-zinc-700">
          <CardHeader className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
            <div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Supplier Management</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Manage your suppliers and their contact information
              </CardDescription>
            </div>
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <div className="relative">
                <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 md:w-64"
                />
              </div>
              <Link to="/suppliers/create">
                <Button className="w-full text-white md:w-auto bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 dark:from-zinc-200 dark:to-white dark:text-zinc-900 dark:hover:from-zinc-100 dark:hover:to-zinc-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Supplier
                </Button>
              </Link>
            </div>
          </CardHeader>

          {error && (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <CardContent className="p-0">
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="justify-start w-full h-auto p-0 border-b rounded-none">
                <TabsTrigger
                  value="table"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 px-6 py-3"
                >
                  Table View
                </TabsTrigger>
                <TabsTrigger
                  value="grid"
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 px-6 py-3"
                >
                  Grid View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="p-0 m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 border-4 rounded-full border-t-zinc-900 dark:border-t-zinc-100 border-zinc-200 dark:border-zinc-700 animate-spin"></div>
                      <p className="text-zinc-500 dark:text-zinc-400">Loading suppliers...</p>
                    </div>
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                    <div className="p-3 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-700">
                      <Building className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <h3 className="mb-1 text-xl font-medium text-zinc-900 dark:text-zinc-100">No suppliers found</h3>
                    <p className="mb-4 text-zinc-500 dark:text-zinc-400">
                      {searchTerm ? "Try a different search term" : "Add your first supplier to get started"}
                    </p>
                    {searchTerm ? (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                    ) : (
                      <Link to="/suppliers/create">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Supplier
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                          <TableHead className="font-medium">Company Name</TableHead>
                          <TableHead className="font-medium">Contact Name</TableHead>
                          <TableHead className="font-medium">Business Phone</TableHead>
                          <TableHead className="font-medium">Business Email</TableHead>
                          <TableHead className="font-medium text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredSuppliers.map((supplier) => (
                            <motion.tr
                              key={supplier._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <Building className="w-4 h-4 mr-2 text-zinc-400" />
                                  {supplier.companyName}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-2 text-zinc-400" />
                                  {supplier.name || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-zinc-400" />
                                  {supplier.businessPhone || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-zinc-400" />
                                  {supplier.businessEmail || "—"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedSupplier(supplier)}
                                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Link to={`/suppliers/edit/${supplier._id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDelete(supplier)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="grid" className="p-6 m-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 border-4 rounded-full border-t-zinc-900 dark:border-t-zinc-100 border-zinc-200 dark:border-zinc-700 animate-spin"></div>
                      <p className="text-zinc-500 dark:text-zinc-400">Loading suppliers...</p>
                    </div>
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                    <div className="p-3 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-700">
                      <Building className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <h3 className="mb-1 text-xl font-medium text-zinc-900 dark:text-zinc-100">No suppliers found</h3>
                    <p className="mb-4 text-zinc-500 dark:text-zinc-400">
                      {searchTerm ? "Try a different search term" : "Add your first supplier to get started"}
                    </p>
                    {searchTerm ? (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Clear Search
                      </Button>
                    ) : (
                      <Link to="/suppliers/create">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Supplier
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {filteredSuppliers.map((supplier) => (
                      <motion.div key={supplier._id} variants={item}>
                        <Card className="overflow-hidden transition-all duration-300 border hover:shadow-md dark:bg-zinc-800">
                          <CardHeader className="p-4 pb-2 bg-zinc-50 dark:bg-zinc-800">
                            <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              {supplier.companyName}
                            </CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400">
                              {supplier.name || "No contact name"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-zinc-400" />
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                  {supplier.businessPhone || "No phone number"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-zinc-400" />
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                  {supplier.businessEmail || "No email address"}
                                </span>
                              </div>
                              <div className="flex justify-end pt-2 mt-4 space-x-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSupplier(supplier)}
                                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <Link to={`/suppliers/edit/${supplier._id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDelete(supplier)}
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Details Dialog */}
      <Dialog open={selectedSupplier !== null} onOpenChange={(open) => !open && setSelectedSupplier(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {selectedSupplier?.companyName}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Supplier details and contact information
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Company Information</h3>
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <DetailItem
                        icon={<Building className="w-4 h-4" />}
                        label="Company Name"
                        value={selectedSupplier.companyName}
                      />
                      <DetailItem
                        icon={<User className="w-4 h-4" />}
                        label="Contact Name"
                        value={selectedSupplier.name}
                      />
                      <DetailItem
                        icon={<Phone className="w-4 h-4" />}
                        label="Business Phone"
                        value={selectedSupplier.businessPhone}
                      />
                      <DetailItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Business Email"
                        value={selectedSupplier.businessEmail}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Commercial Information</h3>
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <DetailItem
                        icon={<User className="w-4 h-4" />}
                        label="Commercial Contact"
                        value={selectedSupplier.commercialContact}
                      />
                      <DetailItem
                        icon={<User className="w-4 h-4" />}
                        label="Company Contact"
                        value={selectedSupplier.companyContact}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Technical Information</h3>
                  <Card className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <DetailItem
                        icon={<User className="w-4 h-4" />}
                        label="Technical Contact"
                        value={selectedSupplier.technicalContact}
                      />
                      <DetailItem
                        icon={<Phone className="w-4 h-4" />}
                        label="Office Phone"
                        value={selectedSupplier.officePhone}
                      />
                      <DetailItem
                        icon={<Phone className="w-4 h-4" />}
                        label="Technical Phone"
                        value={selectedSupplier.technicalPhone}
                      />
                      <DetailItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Company Email"
                        value={selectedSupplier.companyEmail}
                      />
                      <DetailItem
                        icon={<Mail className="w-4 h-4" />}
                        label="Technical Email"
                        value={selectedSupplier.technicalEmail}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Link to={`/suppliers/edit/${selectedSupplier?._id}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Supplier
              </Button>
            </Link>
            <Button onClick={() => setSelectedSupplier(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the supplier "{supplierToDelete?.companyName}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
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
                  Delete Supplier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex items-center justify-center w-8 h-8 mr-3 text-zinc-500 dark:text-zinc-400">{icon}</div>
    <div>
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
    </div>
  </div>
)

export default SupplierList
