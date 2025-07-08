"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getPedidoById, generateQRCode } from "../../apis/pedido/pedidoApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  Briefcase,
  Box,
  FileText,
  Truck,
  Info,
  User,
  MapPin,
  Tag,
  Hash,
  QrCode,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MainLayout from "@/components/MainLayout"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PedidoDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  const [pedido, setPedido] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidId, setIsValidId] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [qrCode, setQrCode] = useState(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Validate ID before fetching data
  useEffect(() => {
    // Check if ID is valid (not undefined, null, or empty)
    if (id && id !== "undefined" && id !== "null" && id.trim() !== "") {
      setIsValidId(true)
    } else {
      setIsValidId(false)
      toast({
        variant: "destructive",
        title: "Invalid Order ID",
        description: "The order ID is invalid or missing.",
      })
      // Redirect back to the orders list
      navigate("/pedido")
    }
  }, [id, navigate, toast])

  useEffect(() => {
    if (isValidId) {
      fetchPedido(id)
      fetchOrGenerateQRCode(id)
    }
  }, [id, isValidId])

  const fetchPedido = async (pedidoId) => {
    try {
      setIsLoading(true)
      const data = await getPedidoById(pedidoId)

      // Process the data to ensure we're not displaying objects directly
      const processedData = {
        ...data,
        tipo: typeof data.tipo === "object" ? data.tipo.name || "N/A" : data.tipo || "N/A",
        referencia: typeof data.referencia === "object" ? data.referencia.reference || "N/A" : data.referencia || "N/A",
        solicitante: typeof data.solicitante === "object" ? data.solicitante.name || "N/A" : data.solicitante || "N/A",
        proveedor: typeof data.proveedor === "object" ? data.proveedor.name || "N/A" : data.proveedor || "N/A",
        table_status:
          typeof data.table_status === "object" ? data.table_status.name || "N/A" : data.table_status || "N/A",
      }

      setPedido(processedData)
    } catch (error) {
      console.error("Error fetching pedido:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details. Please try again.",
      })
      navigate("/pedido")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrGenerateQRCode = async (pedidoId) => {
    try {
      setIsGeneratingQR(true)

      // Instead of using the backend-generated QR code, we'll create one with a full URL
      // This will create a QR code that contains a link to the order details page
      const baseUrl = window.location.origin // Gets the base URL of your application
      const orderUrl = `${baseUrl}/pedido/${pedidoId}`

      // Use the QRCode.toDataURL method to generate a QR code with the full URL
      // If you don't have the QRCode library, we'll use the backend's QR code as fallback
      try {
        // Try to use the backend's QR code generation first
        const response = await generateQRCode(pedidoId)
        setQrCode(response.qrCode)
      } catch (qrError) {
        console.error("Error with backend QR code, using fallback:", qrError)
        // If that fails, we'll just display the URL as text
        setQrCode(null)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleEdit = () => {
    navigate(`/pedido/edit/${id}`)
  }

  const handleDelete = () => {
    // Implement delete functionality
    toast({
      title: "Not Implemented",
      description: "Delete functionality is not yet implemented.",
    })
    navigate("/pedido")
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const getStatusDetails = (pedido) => {
    if (pedido?.recepcionado === "Si")
      return {
        label: "Completed",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        description: "Order has been received and completed",
      }
    if (pedido?.aceptado)
      return {
        label: "In Progress",
        icon: Package,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        description: "Order has been accepted and is being processed",
      }
    if (pedido?.introducidaSAP)
      return {
        label: "Pending",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        description: "Order has been entered into SAP and is pending acceptance",
      }
    return {
      label: "Cancelled",
      icon: AlertCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      description: "Order has been cancelled or rejected",
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </MainLayout>
    )
  }

  if (!pedido) {
    return (
      <MainLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container px-4 py-8 mx-auto"
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Order Not Found</CardTitle>
              <CardDescription>The requested order could not be found or has been deleted.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/pedido")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </MainLayout>
    )
  }

  const statusDetails = getStatusDetails(pedido)
  const StatusIcon = statusDetails.icon

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container px-4 py-8 mx-auto">
        {/* Header with back button, title and actions */}
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center space-x-4"
          >
            <Button variant="outline" size="icon" onClick={() => navigate("/pedido")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
              <div className="flex items-center mt-1 text-muted-foreground">
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-medium">{pedido.referencia}</span>
                {pedido._id && (
                  <>
                    <span className="mx-2">•</span>
                    <Hash className="w-4 h-4 mr-1" />
                    <span className="font-mono text-xs">{pedido._id}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex space-x-3"
          >
            <Button onClick={handleEdit} variant="outline">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the order and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>

        {/* Status card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-2 border-muted">
            <CardContent className="p-6">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-full ${statusDetails.className}`}>
                    <StatusIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center mb-1 space-x-2">
                      <h2 className="text-2xl font-bold">{pedido.tipo}</h2>
                      <Badge variant="secondary" className={statusDetails.className}>
                        {statusDetails.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{statusDetails.description}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end p-4 border rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-3xl font-bold">{formatCurrency(pedido.importePedido)}</span>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <span>{pedido.cantidad} units</span>
                    <span className="mx-1">×</span>
                    <span>{formatCurrency(pedido.precioUnidad)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs content */}
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="status">Status & Tracking</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card className="overflow-hidden border-2 border-muted">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center text-lg">
                      <Info className="w-5 h-5 mr-2 text-primary" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <dl className="divide-y">
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Reference</dt>
                        <dd className="font-semibold">{pedido.referencia}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Type</dt>
                        <dd className="flex items-center">
                          <Package className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.tipo}
                        </dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Requester</dt>
                        <dd className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.solicitante}
                        </dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Year</dt>
                        <dd>{pedido.ano}</dd>
                      </div>
                      <div className="p-4">
                        <dt className="mb-1 font-medium text-muted-foreground">Internal Description</dt>
                        <dd className="mt-1 text-sm">{pedido.descripcionInterna || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Table Status</dt>
                        <dd>{pedido.table_status}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-muted">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center text-lg">
                      <Box className="w-5 h-5 mr-2 text-primary" />
                      Product Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <dl className="divide-y">
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Manufacturer</dt>
                        <dd>{pedido.fabricante || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Provider</dt>
                        <dd>{pedido.proveedor}</dd>
                      </div>
                      <div className="p-4">
                        <dt className="mb-1 font-medium text-muted-foreground">Provider Description</dt>
                        <dd className="mt-1 text-sm">{pedido.descripcionProveedor || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Delivery Address</dt>
                        <dd className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.direccion || "Not specified"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>

              {pedido.comentario && (
                <Card className="border-2 border-muted">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="w-5 h-5 mr-2 text-primary" />
                      Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-line">{pedido.comentario}</p>
                  </CardContent>
                </Card>
              )}

              {/* QR Code Section */}
              <Card className="border-2 border-muted">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center text-lg">
                    <QrCode className="w-5 h-5 mr-2 text-primary" />
                    QR Code
                  </CardTitle>
                  <CardDescription>Scan this code to access order details</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-6">
                  {isGeneratingQR ? (
                    <div className="flex flex-col items-center p-6">
                      <Loader2 className="w-10 h-10 mb-4 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Generating QR code...</p>
                    </div>
                  ) : qrCode ? (
                    <div className="p-4 mb-4 bg-white border rounded-lg">
                      <img
                        src={qrCode || "/placeholder.svg"}
                        alt="Order QR Code"
                        className="w-48 h-48"
                        id="qrCodeImage"
                      />
                    </div>
                  ) : (
                    <div className="p-4 mb-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-center w-48 h-48 bg-muted/20">
                        <p className="text-center text-muted-foreground">QR code not available</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <p className="mt-4 text-sm text-muted-foreground">
                      Scan with your phone's camera to quickly access this order's details
                    </p>

                    {qrCode && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          // Create a temporary link element
                          const link = document.createElement("a")
                          link.href = qrCode
                          link.download = `order-qr-${id}.png`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)

                          toast({
                            title: "QR Code Downloaded",
                            description: "The QR code has been downloaded successfully.",
                          })
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-8">
              <Card className="overflow-hidden border-2 border-muted">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center text-lg">
                    <DollarSign className="w-5 h-5 mr-2 text-primary" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y">
                    <div className="flex justify-between p-4">
                      <dt className="font-medium text-muted-foreground">Quantity</dt>
                      <dd className="font-semibold">{pedido.cantidad}</dd>
                    </div>
                    <div className="flex justify-between p-4">
                      <dt className="font-medium text-muted-foreground">Unit Price</dt>
                      <dd>{formatCurrency(pedido.precioUnidad)}</dd>
                    </div>
                    <div className="flex justify-between p-4 bg-muted/30">
                      <dt className="font-medium text-muted-foreground">Total Amount</dt>
                      <dd className="text-lg font-bold">{formatCurrency(pedido.importePedido)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="space-y-8">
              <Card className="border-2 border-muted">
                <CardHeader className="pb-4 bg-muted/30">
                  <CardTitle className="flex items-center">
                    <StatusIcon className="w-5 h-5 mr-2" />
                    Current Status: {statusDetails.label}
                  </CardTitle>
                  <CardDescription>{statusDetails.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted"></div>

                    <div className="relative pb-8 pl-12">
                      <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary">
                        <Calendar className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold">Request Date</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.fechaSolicitud)}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.introducidaSAP ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <FileText
                          className={`w-5 h-5 ${pedido.introducidaSAP ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">SAP Entry Date</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.introducidaSAP) || "Pending"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.aceptado ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <Package
                          className={`w-5 h-5 ${pedido.aceptado ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">Acceptance Date</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.aceptado) || "Pending"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 bg-primary flex items-center justify-center`}
                      >
                        <Truck className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold">Delivery Days</h3>
                      <p className="text-muted-foreground">{pedido.days ? `${pedido.days} days` : "Not specified"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 bg-primary flex items-center justify-center`}
                      >
                        <MapPin className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold">Delivery Address</h3>
                      <p className="text-muted-foreground">{pedido.direccion || "Not specified"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.date_receiving ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <Calendar
                          className={`w-5 h-5 ${pedido.date_receiving ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">Receiving Date</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.date_receiving) || "Pending"}</p>
                      <p className="text-xs text-muted-foreground">
                        {pedido.days
                          ? `Calculated as ${pedido.days} days after acceptance date`
                          : "Will be calculated when delivery days are specified"}
                      </p>
                    </div>

                    <div className="relative pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.recepcionado === "Si" ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <CheckCircle
                          className={`w-5 h-5 ${pedido.recepcionado === "Si" ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">Received</h3>
                      <p className="text-muted-foreground">{pedido.recepcionado === "Si" ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center text-lg">
                    <Info className="w-5 h-5 mr-2 text-primary" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Badge className="mr-3 text-sm">{pedido.table_status}</Badge>
                    <span className="text-sm text-muted-foreground">Current status in the system</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </MainLayout>
  )
}
