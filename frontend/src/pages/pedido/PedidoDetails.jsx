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

  // Validar ID antes de obtener datos
  useEffect(() => {
    // Verificar si el ID es válido (no undefined, null, o vacío)
    if (id && id !== "undefined" && id !== "null" && id.trim() !== "") {
      setIsValidId(true)
    } else {
      setIsValidId(false)
      toast({
        variant: "destructive",
        title: "ID de Pedido Inválido",
        description: "El ID del pedido es inválido o falta.",
      })
      // Redirigir de vuelta a la lista de pedidos
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

      // Procesar los datos para asegurar que no mostramos objetos directamente
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
      console.error("Error al obtener el pedido:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los detalles del pedido. Por favor, inténtalo de nuevo.",
      })
      navigate("/pedido")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrGenerateQRCode = async (pedidoId) => {
    try {
      setIsGeneratingQR(true)

      // En lugar de usar el código QR generado por el backend, crearemos uno con una URL completa
      // Esto creará un código QR que contiene un enlace a la página de detalles del pedido
      const baseUrl = window.location.origin // Obtiene la URL base de tu aplicación
      const orderUrl = `${baseUrl}/pedido/${pedidoId}`

      // Usar el método QRCode.toDataURL para generar un código QR con la URL completa
      // Si no tienes la librería QRCode, usaremos el código QR del backend como respaldo
      try {
        // Intentar usar la generación de código QR del backend primero
        const response = await generateQRCode(pedidoId)
        setQrCode(response.qrCode)
      } catch (qrError) {
        console.error("Error con el código QR del backend, usando respaldo:", qrError)
        // Si eso falla, simplemente mostraremos la URL como texto
        setQrCode(null)
      }
    } catch (error) {
      console.error("Error al generar el código QR:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al generar el código QR. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleEdit = () => {
    navigate(`/pedido/edit/${id}`)
  }

  const handleDelete = () => {
    // Implementar funcionalidad de eliminación
    toast({
      title: "No Implementado",
      description: "La funcionalidad de eliminación aún no está implementada.",
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
        label: "Completado",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        description: "El pedido ha sido recibido y completado",
      }
    if (pedido?.aceptado)
      return {
        label: "En Progreso",
        icon: Package,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        description: "El pedido ha sido aceptado y se está procesando",
      }
    if (pedido?.introducidaSAP)
      return {
        label: "Pendiente",
        icon: Clock,
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        description: "El pedido ha sido ingresado en SAP y está pendiente de aceptación",
      }
    return {
      label: "Cancelado",
      icon: AlertCircle,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      description: "El pedido ha sido cancelado o rechazado",
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando detalles del pedido...</p>
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
              <CardTitle className="text-2xl">Pedido No Encontrado</CardTitle>
              <CardDescription>El pedido solicitado no se pudo encontrar o ha sido eliminado.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/pedido")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Pedidos
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
        {/* Encabezado con botón de retroceso, título y acciones */}
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
              <h1 className="text-3xl font-bold tracking-tight">Detalles del Pedido</h1>
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
              <Edit className="w-4 h-4 mr-2" /> Editar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el pedido y lo removerá de nuestros
                    servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>

        {/* Tarjeta de estado */}
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
                  <span className="text-sm text-muted-foreground">Importe Total</span>
                  <span className="text-3xl font-bold">{formatCurrency(pedido.importePedido)}</span>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <span>{pedido.cantidad} unidades</span>
                    <span className="mx-1">×</span>
                    <span>{formatCurrency(pedido.precioUnidad)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contenido de pestañas */}
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="details">Detalles del Pedido</TabsTrigger>
              <TabsTrigger value="status">Estado y Seguimiento</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <Card className="overflow-hidden border-2 border-muted">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center text-lg">
                      <Info className="w-5 h-5 mr-2 text-primary" />
                      Información Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <dl className="divide-y">
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Referencia</dt>
                        <dd className="font-semibold">{pedido.referencia}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Tipo</dt>
                        <dd className="flex items-center">
                          <Package className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.tipo}
                        </dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Solicitante</dt>
                        <dd className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.solicitante}
                        </dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Año</dt>
                        <dd>{pedido.ano}</dd>
                      </div>
                      <div className="p-4">
                        <dt className="mb-1 font-medium text-muted-foreground">Descripción Interna</dt>
                        <dd className="mt-1 text-sm">{pedido.descripcionInterna || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Estado de Tabla</dt>
                        <dd>{pedido.table_status}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-muted">
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="flex items-center text-lg">
                      <Box className="w-5 h-5 mr-2 text-primary" />
                      Detalles del Producto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <dl className="divide-y">
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Fabricante</dt>
                        <dd>{pedido.fabricante || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Proveedor</dt>
                        <dd>{pedido.proveedor}</dd>
                      </div>
                      <div className="p-4">
                        <dt className="mb-1 font-medium text-muted-foreground">Descripción del Proveedor</dt>
                        <dd className="mt-1 text-sm">{pedido.descripcionProveedor || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between p-4">
                        <dt className="font-medium text-muted-foreground">Dirección de Entrega</dt>
                        <dd className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                          {pedido.direccion || "No especificada"}
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
                      Comentarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-line">{pedido.comentario}</p>
                  </CardContent>
                </Card>
              )}

              {/* Sección de Código QR */}
              <Card className="border-2 border-muted">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center text-lg">
                    <QrCode className="w-5 h-5 mr-2 text-primary" />
                    Código QR
                  </CardTitle>
                  <CardDescription>Escanea este código para acceder a los detalles del pedido</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-6">
                  {isGeneratingQR ? (
                    <div className="flex flex-col items-center p-6">
                      <Loader2 className="w-10 h-10 mb-4 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Generando código QR...</p>
                    </div>
                  ) : qrCode ? (
                    <div className="p-4 mb-4 bg-white border rounded-lg">
                      <img
                        src={qrCode || "/placeholder.svg"}
                        alt="Código QR del Pedido"
                        className="w-48 h-48"
                        id="qrCodeImage"
                      />
                    </div>
                  ) : (
                    <div className="p-4 mb-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-center w-48 h-48 bg-muted/20">
                        <p className="text-center text-muted-foreground">Código QR no disponible</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <p className="mt-4 text-sm text-muted-foreground">
                      Escanea con la cámara de tu teléfono para acceder rápidamente a los detalles de este pedido
                    </p>

                    {qrCode && (
                      <Button
                        variant="outline"
                        className="mt-4 bg-transparent"
                        onClick={() => {
                          // Crear un elemento de enlace temporal
                          const link = document.createElement("a")
                          link.href = qrCode
                          link.download = `pedido-qr-${id}.png`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)

                          toast({
                            title: "Código QR Descargado",
                            description: "El código QR ha sido descargado exitosamente.",
                          })
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Código QR
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
                    Detalles Financieros
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y">
                    <div className="flex justify-between p-4">
                      <dt className="font-medium text-muted-foreground">Cantidad</dt>
                      <dd className="font-semibold">{pedido.cantidad}</dd>
                    </div>
                    <div className="flex justify-between p-4">
                      <dt className="font-medium text-muted-foreground">Precio Unitario</dt>
                      <dd>{formatCurrency(pedido.precioUnidad)}</dd>
                    </div>
                    <div className="flex justify-between p-4 bg-muted/30">
                      <dt className="font-medium text-muted-foreground">Importe Total</dt>
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
                    Estado Actual: {statusDetails.label}
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
                      <h3 className="font-semibold">Fecha de Solicitud</h3>
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
                      <h3 className="font-semibold">Fecha de Entrada SAP</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.introducidaSAP) || "Pendiente"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.aceptado ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <Package
                          className={`w-5 h-5 ${pedido.aceptado ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">Fecha de Aceptación</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.aceptado) || "Pendiente"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 bg-primary flex items-center justify-center`}
                      >
                        <Truck className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold">Días de Entrega</h3>
                      <p className="text-muted-foreground">{pedido.days ? `${pedido.days} días` : "No especificado"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 bg-primary flex items-center justify-center`}
                      >
                        <MapPin className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-semibold">Dirección de Entrega</h3>
                      <p className="text-muted-foreground">{pedido.direccion || "No especificada"}</p>
                    </div>

                    <div className="relative pb-8 pl-12">
                      <div
                        className={`absolute left-0 rounded-full w-10 h-10 ${pedido.date_receiving ? "bg-primary" : "bg-muted"} flex items-center justify-center`}
                      >
                        <Calendar
                          className={`w-5 h-5 ${pedido.date_receiving ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </div>
                      <h3 className="font-semibold">Fecha de Recepción</h3>
                      <p className="text-muted-foreground">{formatDate(pedido.date_receiving) || "Pendiente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {pedido.days
                          ? `Calculada como ${pedido.days} días después de la fecha de aceptación`
                          : "Se calculará cuando se especifiquen los días de entrega"}
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
                      <h3 className="font-semibold">Recibido</h3>
                      <p className="text-muted-foreground">{pedido.recepcionado === "Si" ? "Sí" : "No"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted">
                <CardHeader className="pb-2 bg-muted/30">
                  <CardTitle className="flex items-center text-lg">
                    <Info className="w-5 h-5 mr-2 text-primary" />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Badge className="mr-3 text-sm">{pedido.table_status}</Badge>
                    <span className="text-sm text-muted-foreground">Estado actual en el sistema</span>
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
