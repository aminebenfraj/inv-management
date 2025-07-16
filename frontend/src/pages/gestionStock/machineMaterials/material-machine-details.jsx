"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { getMaterialById } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations } from "@/apis/gestionStockApi/materialMachineApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil, Clock, Package, Settings, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import MainLayout from "@/components/MainLayout"

const MaterialMachineDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllocationDetails()
  }, [id])

  const fetchAllocationDetails = async () => {
    try {
      setLoading(true)
      const allAllocations = await getAllAllocations()
      const currentAllocation = allAllocations.find((a) => a._id === id)

      if (!currentAllocation) {
        toast({
          title: "Error",
          description: "Allocation not found",
          variant: "destructive",
        })
        return
      }

      // Sort history by date (newest first) if it exists
      if (currentAllocation.history && currentAllocation.history.length > 0) {
        currentAllocation.history.sort((a, b) => new Date(b.date) - new Date(a.date))
      }

      setAllocation(currentAllocation)

      // Fetch material details to get current stock
      if (currentAllocation.material?._id) {
        const materialDetails = await getMaterialById(currentAllocation.material._id)
        setAllocation((prev) => ({
          ...prev,
          material: materialDetails,
        }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch allocation details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-primary border-t-transparent"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container py-8 mx-auto"
      >
        <Toaster />
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/machinematerial")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>

          <Button asChild>
            <Link to={`/machinematerial/edit/${id}`}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Allocation
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Material-Machine Allocation Details
                </CardTitle>
                <CardDescription>View details about this material allocation to a machine</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">Material Information</h3>
                        <div className="p-4 space-y-2 border rounded-md">
                          <div>
                            <span className="text-sm text-muted-foreground">Reference:</span>
                            <p className="font-medium">{allocation.material?.reference}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Description:</span>
                            <p className="font-medium">{allocation.material?.description}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Manufacturer:</span>
                            <p className="font-medium">{allocation.material?.manufacturer}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Current Stock:</span>
                            <p className="font-medium">{allocation.material?.currentStock}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Minimum Stock:</span>
                            <p className="font-medium">{allocation.material?.minimumStock}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Category:</span>
                            <p className="font-medium">{allocation.material?.category?.name || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-lg font-medium">Machine Information</h3>
                        <div className="p-4 space-y-2 border rounded-md">
                          <div>
                            <span className="text-sm text-muted-foreground">Name:</span>
                            <p className="font-medium">{allocation.machine?.name}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Description:</span>
                            <p className="font-medium">{allocation.machine?.description}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <p className="font-medium capitalize">{allocation.machine?.status}</p>
                          </div>
                          {allocation.machine?.factory && (
                            <div>
                              <span className="text-sm text-muted-foreground">Factory:</span>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <p className="font-medium">{allocation.machine.factory.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="mb-2 text-lg font-medium">Allocation Details</h3>
                      <div className="p-4 border rounded-md">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <span className="text-sm text-muted-foreground">Allocated Stock:</span>
                            <p className="text-2xl font-bold">{allocation.allocatedStock}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Last Updated:</span>
                            <p className="font-medium">{new Date(allocation.updatedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="space-y-4">
                      <h3 className="flex items-center text-lg font-medium">
                        <Clock className="w-4 h-4 mr-2" />
                        Allocation History
                      </h3>

                      {allocation.history && allocation.history.length > 0 ? (
                        <div className="overflow-hidden border rounded-md">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">Date</th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">
                                  Previous
                                </th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">New</th>
                                <th className="px-4 py-2 text-xs font-medium text-left text-muted-foreground">
                                  Comment
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {allocation.history.map((entry, index) => (
                                <motion.tr
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="hover:bg-muted/50"
                                >
                                  <td className="px-4 py-2 text-sm">{formatDate(entry.date)}</td>
                                  <td className="px-4 py-2 text-sm">{entry.previousStock}</td>
                                  <td className="px-4 py-2 text-sm">{entry.newStock}</td>
                                  <td className="px-4 py-2 text-sm">{entry.comment}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center border rounded-md">
                          <p className="text-muted-foreground">No history available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Settings className="w-4 h-4 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild className="justify-start w-full">
                    <Link to={`/machinematerial/edit/${id}`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Allocation
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start w-full bg-transparent">
                    <Link to={`/materials/edit/${allocation.material?._id}`}>
                      <Package className="w-4 h-4 mr-2" />
                      View Material Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allocation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Material:</span>
                    <p className="font-medium">{allocation.material?.reference}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Machine:</span>
                    <p className="font-medium">{allocation.machine?.name}</p>
                  </div>
                  {allocation.machine?.factory && (
                    <div>
                      <span className="text-sm text-muted-foreground">Factory:</span>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{allocation.machine.factory.name}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Allocated Stock:</span>
                    <p className="text-xl font-bold">{allocation.allocatedStock}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <p className="font-medium">{new Date(allocation.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Last Updated:</span>
                    <p className="font-medium">{new Date(allocation.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineDetails
