"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Truck,
  Package,
  Info,
  MapPin,
  Tag,
  DollarSign,
  AlertTriangle,
  Repeat,
  MessageSquare,
  ImageIcon,
  Clock,
  History,
  Edit,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getMaterialById, removeReferenceFromHistory } from "../../../apis/gestionStockApi/materialApi"
import PedidLayout from "@/components/PedidLayout"
import MainLayout from "@/components/MainLayout"

const MaterialDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        setLoading(true)
        const data = await getMaterialById(id)
        setMaterial(data)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch material:", error)
        setError("Failed to fetch material details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchMaterial()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 rounded-full border-t-primary animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl text-red-500">{error}</div>
        <Button onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Materials
        </Button>
      </div>
    )
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-xl">Material not found</div>
        <Button onClick={() => navigate("/materials")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Materials
        </Button>
      </div>
    )
  }

  const getStockStatusVariant = () => {
    if (material.currentStock <= 0) return "destructive"
    if (material.currentStock <= material.minimumStock) return "warning"
    return "success"
  }

  const getStockStatus = () => {
    if (material.currentStock <= 0) return "Out of Stock"
    if (material.currentStock <= material.minimumStock) return "Low Stock"
    return "In Stock"
  }

  return (
    <MainLayout>
      <PedidLayout>
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
          <div className="container px-4 py-8 mx-auto">
            <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigate("/materials")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Material Details</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/materials/edit/${material._id}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Material
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Main Info Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{material.reference}</CardTitle>
                      <CardDescription>{material.manufacturer}</CardDescription>
                    </div>
                    <Badge variant={getStockStatusVariant()}>{getStockStatus()}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <Package className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Description</p>
                        <p className="text-sm text-muted-foreground">
                          {material.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Supplier</p>
                        <p className="text-sm text-muted-foreground">
                          {material.supplier ? material.supplier.companyName : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {material.location ? material.location.location : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Category</p>
                        <p className="text-sm text-muted-foreground">
                          {material.category ? material.category.name : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Stock Information</p>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Current</p>
                            <p className="font-medium">{material.currentStock}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Minimum</p>
                            <p className="font-medium">{material.minimumStock}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Order Lot</p>
                            <p className="font-medium">{material.orderLot}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Price</p>
                        <p className="text-sm text-muted-foreground">${material.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Status</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={material.critical ? "destructive" : "outline"}>
                            {material.critical ? "Critical" : "Non-Critical"}
                          </Badge>
                          <Badge variant={material.consumable ? "secondary" : "outline"}>
                            {material.consumable ? "Consumable" : "Non-Consumable"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Comment</p>
                        <p className="text-sm text-muted-foreground">{material.comment || "No comment"}</p>
                      </div>
                    </div>
                  </div>

                  {material.photo && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        <p className="font-medium">Photo</p>
                      </div>
                      <img
                        src={material.photo || "/placeholder.svg"}
                        alt={material.reference}
                        className="object-cover w-full h-auto rounded-md max-h-64"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Associated Machines Card */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Associated Machines</CardTitle>
                </CardHeader>
                <CardContent>
                  {material.machines && material.machines.length > 0 ? (
                    <ScrollArea className="h-[200px] pr-4">
                      <ul className="space-y-2">
                        {material.machines.map((machine) => (
                          <li key={machine._id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span>{machine.name}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No associated machines</p>
                  )}
                </CardContent>
              </Card>

              {/* History Tabs */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Material History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="material-history">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="material-history">Material History</TabsTrigger>
                      <TabsTrigger value="reference-history">Reference History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="material-history" className="mt-4">
                      {material.materialHistory && material.materialHistory.length > 0 ? (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                            {material.materialHistory.map((history, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                      {new Date(history.changeDate).toLocaleString()}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {history.changedBy ? history.changedBy.name : "Unknown"}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-sm">{history.description}</p>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                          <History className="w-12 h-12 mb-2 opacity-20" />
                          <p>No history available</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="reference-history" className="mt-4">
                      {material.referenceHistory && material.referenceHistory.length > 0 ? (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                            {material.referenceHistory.map((history, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Repeat className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                      {new Date(history.changedDate).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {history.changedBy ? history.changedBy.name : "Unknown"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-8 h-8 text-destructive hover:bg-destructive/10"
                                      onClick={async () => {
                                        try {
                                          await removeReferenceFromHistory(id, history._id)
                                          // Refresh the material data after successful deletion
                                          const updatedMaterial = await getMaterialById(id)
                                          setMaterial(updatedMaterial)
                                        } catch (error) {
                                          console.error("Failed to delete reference history:", error)
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm">
                                    <span className="font-medium">Old Reference:</span> {history.oldReference}
                                  </p>
                                  {history.comment && (
                                    <p className="mt-1 text-sm text-muted-foreground">{history.comment}</p>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                          <History className="w-12 h-12 mb-2 opacity-20" />
                          <p>No reference changes recorded</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PedidLayout>
    </MainLayout>
  )
}

export default MaterialDetails
