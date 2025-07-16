"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getMaterialById } from "@/apis/gestionStockApi/materialApi"
import { getAllAllocations, updateAllocation } from "@/apis/gestionStockApi/materialMachineApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  ArrowLeft,
  AlertCircle,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  Package,
  Settings,
  TrendingUp,
  TrendingDown,
  History,
  Calculator,
  Building2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MainLayout from "@/components/MainLayout"

const MaterialMachineEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [allocation, setAllocation] = useState(null)
  const [material, setMaterial] = useState(null)
  const [machine, setMachine] = useState(null)
  const [allocatedStock, setAllocatedStock] = useState(0)
  const [adjustmentAmount, setAdjustmentAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalStock, setOriginalStock] = useState(0)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [comment, setComment] = useState("")
  const [maxAvailableStock, setMaxAvailableStock] = useState(0)

  // Calculate new values based on adjustment mode
  const calculatedNewStock = allocatedStock

  // Calculate the difference for display
  const stockDifference = calculatedNewStock - originalStock

  // Calculate available material stock after adjustment
  const availableAfterAdjustment = maxAvailableStock - calculatedNewStock

  useEffect(() => {
    fetchAllocationDetails()
  }, [id])

  useEffect(() => {
    if (material && material.currentStock !== undefined) {
      // Calculate max available stock (current material stock + what's already allocated to this machine)
      const max = material.currentStock + originalStock
      setMaxAvailableStock(max)
    }
  }, [material, originalStock])

  // Update adjustment amount when allocated stock changes
  useEffect(() => {
    setAdjustmentAmount(allocatedStock - originalStock)
  }, [allocatedStock, originalStock])

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

      setAllocation(currentAllocation)
      setMaterial(currentAllocation.material)
      setMachine(currentAllocation.machine)
      setAllocatedStock(currentAllocation.allocatedStock)
      setOriginalStock(currentAllocation.allocatedStock)

      // Fetch material details to get current stock
      if (currentAllocation.material?._id) {
        const materialDetails = await getMaterialById(currentAllocation.material._id)
        setMaterial(materialDetails)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (calculatedNewStock < 0) {
      toast({
        title: "Error",
        description: "Allocated stock cannot be negative",
        variant: "destructive",
      })
      return
    }

    // Check if there's enough stock available if we're increasing the allocation
    if (stockDifference > 0 && material && material.currentStock < stockDifference) {
      toast({
        title: "Error",
        description: `Not enough stock available. Only ${material.currentStock} units available.`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const userId = localStorage.getItem("userId")

      const updateData = {
        allocatedStock: calculatedNewStock,
        comment: comment || `Stock updated from ${originalStock} to ${calculatedNewStock}`,
      }

      if (userId) {
        updateData.userId = userId
      }

      const response = await updateAllocation(id, updateData)

      // Show success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 2000)

      toast({
        title: "Success",
        description: "Allocation updated successfully",
      })

      // Update material with new stock if provided in response
      if (response.updatedMaterialStock !== undefined) {
        setMaterial({
          ...material,
          currentStock: response.updatedMaterialStock,
        })
      }

      // Refresh allocation details to get updated history
      await fetchAllocationDetails()

      // Reset adjustment amount after successful update
      setAdjustmentAmount(0)
      setComment("")
    } catch (error) {
      console.error("Update error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to update allocation",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAdjustment = (amount) => {
    setAllocatedStock(Math.max(0, allocatedStock + amount))
  }

  const resetToOriginal = () => {
    setAllocatedStock(originalStock)
    setAdjustmentAmount(0)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 rounded-full animate-spin border-violet-500 border-t-transparent"></div>
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/machinematerial")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              Material: {material?.reference}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Machine: {machine?.name}
            </Badge>
            {machine?.factory && (
              <Badge variant="outline" className="px-3 py-1">
                <Building2 className="w-3 h-3 mr-1" />
                Factory: {machine.factory.name}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Stock Adjustment
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Allocation History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle>Edit Material Allocation</CardTitle>
                <CardDescription>Update the stock allocation for this machine</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                          <Package className="w-4 h-4 text-violet-500" />
                          Material Information
                        </h3>
                        <div className="p-4 border rounded-md bg-muted/50">
                          <div className="grid gap-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Reference</Label>
                              <p className="font-medium">{material?.reference}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Description</Label>
                              <p className="font-medium">{material?.description}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Current Stock</Label>
                              <p className="font-medium">{material?.currentStock}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Manufacturer</Label>
                              <p className="font-medium">{material?.manufacturer}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                          <Settings className="w-4 h-4 text-violet-500" />
                          Machine Information
                        </h3>
                        <div className="p-4 border rounded-md bg-muted/50">
                          <div className="grid gap-2">
                            <div>
                              <Label className="text-sm text-muted-foreground">Name</Label>
                              <p className="font-medium">{machine?.name}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Description</Label>
                              <p className="font-medium">{machine?.description}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Status</Label>
                              <p className="font-medium capitalize">{machine?.status}</p>
                            </div>
                            {machine?.factory && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Factory</Label>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-medium">{machine.factory.name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Stock Adjustment</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetToOriginal}
                            className="h-8 px-2 text-xs bg-transparent"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        </div>
                      </div>

                      {/* Current allocation display */}
                      <div className="p-4 border rounded-md bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Current Allocation</span>
                          <span className="text-lg font-medium">{originalStock}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">New Allocation</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">{calculatedNewStock}</span>
                            {stockDifference !== 0 && (
                              <Badge
                                variant={stockDifference > 0 ? "default" : "destructive"}
                                className="flex items-center gap-1"
                              >
                                {stockDifference > 0 ? (
                                  <>
                                    <TrendingUp className="w-3 h-3" />+{stockDifference}
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown className="w-3 h-3" />
                                    {stockDifference}
                                  </>
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Adjustment controls */}
                      <div className="space-y-2">
                        <Label htmlFor="allocatedStock">Set Exact Stock Value</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuickAdjustment(-1)}
                            disabled={allocatedStock <= 0}
                            className="w-10 h-10"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            id="allocatedStock"
                            type="number"
                            min="0"
                            value={allocatedStock}
                            onChange={(e) => setAllocatedStock(Math.max(0, Number.parseInt(e.target.value) || 0))}
                            className="h-10 text-lg font-medium text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleQuickAdjustment(1)}
                            className="w-10 h-10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Stock impact visualization */}
                      {stockDifference !== 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-4 border rounded-md bg-muted/30"
                        >
                          <h4 className="mb-2 font-medium">Stock Impact</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Total Available Stock</span>
                              <span className="font-medium">{maxAvailableStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Currently Allocated</span>
                              <span className="font-medium">{originalStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">New Allocation</span>
                              <span className="font-medium">{calculatedNewStock}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Remaining Available Stock</span>
                              <span className={`font-medium ${availableAfterAdjustment < 0 ? "text-red-600" : ""}`}>
                                {availableAfterAdjustment}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Warning alerts */}
                      <AnimatePresence>
                        {availableAfterAdjustment < 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <Alert variant="destructive">
                              <AlertCircle className="w-4 h-4" />
                              <AlertTitle>Not enough stock available</AlertTitle>
                              <AlertDescription>
                                You're trying to allocate {calculatedNewStock} units, but only {maxAvailableStock} are
                                available in total.
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}

                        {stockDifference !== 0 && availableAfterAdjustment >= 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                          >
                            <Alert
                              variant={stockDifference > 0 ? "warning" : "default"}
                              className={
                                stockDifference > 0 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                              }
                            >
                              <AlertCircle
                                className={`w-4 h-4 ${stockDifference > 0 ? "text-amber-600" : "text-blue-600"}`}
                              />
                              <AlertTitle className={stockDifference > 0 ? "text-amber-800" : "text-blue-800"}>
                                {stockDifference > 0 ? "Adding Stock" : "Removing Stock"}
                              </AlertTitle>
                              <AlertDescription className={stockDifference > 0 ? "text-amber-700" : "text-blue-700"}>
                                {stockDifference > 0
                                  ? `You're adding ${stockDifference} units to this machine. This will reduce the material's available stock by the same amount.`
                                  : `You're removing ${-stockDifference} units from this machine. This will return stock to the material's inventory.`}
                              </AlertDescription>
                            </Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Comment field */}
                      <div className="space-y-2">
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Input
                          id="comment"
                          placeholder="Reason for adjustment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          If left empty, a default comment will be generated.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={saving || stockDifference === 0 || availableAfterAdjustment < 0}
                      className="w-full bg-violet-600 hover:bg-violet-700"
                    >
                      {saving ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 mr-2 border-2 border-current rounded-full animate-spin border-t-transparent"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Allocation
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-violet-500/20">
              <CardHeader>
                <CardTitle>Allocation History</CardTitle>
                <CardDescription>Track changes to this material allocation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden border rounded-md">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Previous</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">New</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Change</th>
                        <th className="px-4 py-3 text-xs font-medium text-left text-muted-foreground">Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {allocation?.history?.length > 0 ? (
                        allocation.history.map((entry, index) => {
                          const change = entry.newStock - entry.previousStock
                          return (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-sm">{new Date(entry.date).toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm">{entry.previousStock}</td>
                              <td className="px-4 py-3 text-sm">{entry.newStock}</td>
                              <td className="px-4 py-3 text-sm">
                                <Badge
                                  variant={change > 0 ? "default" : change < 0 ? "destructive" : "outline"}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {change > 0 ? (
                                    <>
                                      <TrendingUp className="w-3 h-3" />+{change}
                                    </>
                                  ) : change < 0 ? (
                                    <>
                                      <TrendingDown className="w-3 h-3" />
                                      {change}
                                    </>
                                  ) : (
                                    "No change"
                                  )}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.comment}</td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-sm text-center text-muted-foreground">
                            No history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success animation overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex flex-col items-center p-8 bg-white rounded-lg dark:bg-gray-800"
            >
              <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
              <h2 className="text-xl font-bold">Stock Updated!</h2>
              <p className="mt-2 text-center text-muted-foreground">
                {stockDifference > 0
                  ? `Added ${stockDifference} units to this machine`
                  : `Removed ${-stockDifference} units from this machine`}
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </MainLayout>
  )
}

export default MaterialMachineEdit
