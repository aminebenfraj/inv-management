"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getFactoryById, updateFactory } from "../../apis/gestionStockApi/factoryApi"
import { getAllUsers } from "../../apis/admin"
import { Save, ArrowLeft, CheckCircle, PowerOff, Wrench, Loader2, AlertCircle, Users, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const EditFactory = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [factory, setFactory] = useState({
    name: "",
    description: "",
    status: "active",
    manager: "",
    authorizedUsers: [],
  })
  const [originalFactory, setOriginalFactory] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({
    name: "",
  })

  useEffect(() => {
    if (id) {
      fetchFactory()
      fetchUsers()
    }
  }, [id])

  const fetchFactory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFactoryById(id)
      const factoryData = {
        name: data.name,
        description: data.description || "",
        status: data.status,
        manager: data.manager?._id || "",
        authorizedUsers: data.authorizedUsers?.map((user) => user._id) || [],
      }
      setFactory(factoryData)
      setOriginalFactory(factoryData)
    } catch (error) {
      console.error("Error al obtener fábrica:", error)
      setError("Error al obtener los detalles de la fábrica")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al obtener los detalles de la fábrica. Redirigiendo a la lista de fábricas.",
      })
      setTimeout(() => navigate("/factories"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const userData = await getAllUsers()
      const usersArray = Array.isArray(userData) ? userData : userData.data || userData.users || []
      setUsers(usersArray)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      setUsers([])
      toast({
        title: "Advertencia",
        description: "Error al cargar usuarios para la selección de gerente",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFactory((prev) => ({ ...prev, [name]: value }))

    if (name === "name" && errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  const handleAuthorizedUsersChange = (userId) => {
    setFactory((prev) => ({
      ...prev,
      authorizedUsers: prev.authorizedUsers.includes(userId)
        ? prev.authorizedUsers.filter((id) => id !== userId)
        : [...prev.authorizedUsers, userId],
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!factory.name.trim()) {
      newErrors.name = "El nombre de la fábrica es requerido"
    } else if (factory.name.length < 3) {
      newErrors.name = "El nombre de la fábrica debe tener al menos 3 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const factoryData = {
        ...factory,
        manager: factory.manager || undefined,
        authorizedUsers: factory.authorizedUsers.length > 0 ? factory.authorizedUsers : undefined,
      }

      await updateFactory(id, factoryData)
      toast({
        title: "Éxito",
        description: "¡Fábrica actualizada exitosamente!",
        variant: "default",
      })
      setTimeout(() => navigate("/factories"), 1500)
    } catch (error) {
      console.error("Error al actualizar fábrica:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar fábrica. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    if (!originalFactory) return false
    return (
      factory.name !== originalFactory.name ||
      factory.description !== originalFactory.description ||
      factory.status !== originalFactory.status ||
      factory.manager !== originalFactory.manager ||
      JSON.stringify(factory.authorizedUsers.sort()) !== JSON.stringify(originalFactory.authorizedUsers.sort())
    )
  }

  const resetForm = () => {
    if (originalFactory) {
      setFactory({ ...originalFactory })
      setErrors({})
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3" />
            Activa
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-200 bg-red-50">
            <PowerOff className="w-3 h-3" />
            Inactiva
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Wrench className="w-3 h-3" />
            Mantenimiento
          </Badge>
        )
      default:
        return null
    }
  }

  const getSelectedManager = () => {
    return users.find((user) => user._id === factory.manager)
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/factories")} className="mr-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Fábricas
            </Button>
          </div>

          <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Editar Fábrica</CardTitle>
              <CardDescription>Actualizar información de la fábrica</CardDescription>
            </CardHeader>

            {loading ? (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-24" />
                    <Skeleton className="w-full h-10" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-10" />
                    <Skeleton className="w-full h-32" />
                  </div>
                </div>
              </CardContent>
            ) : error ? (
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Información Básica</h3>

                      <div className="space-y-2">
                        <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                          Nombre de la Fábrica <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={factory.name}
                          onChange={handleChange}
                          placeholder="Ingresa el nombre de la fábrica"
                          className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={factory.description}
                          onChange={handleChange}
                          placeholder="Ingresa la descripción de la fábrica"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                          name="status"
                          value={factory.status}
                          onValueChange={(value) => handleChange({ target: { name: "status", value } })}
                        >
                          <SelectTrigger id="status" className="w-full">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="inactive">Inactiva</SelectItem>
                            <SelectItem value="maintenance">Mantenimiento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Gestión</h3>

                      <div className="space-y-2">
                        <Label htmlFor="manager">Gerente de Fábrica</Label>
                        <Select
                          name="manager"
                          value={factory.manager}
                          onValueChange={(value) => handleChange({ target: { name: "manager", value } })}
                          disabled={loadingUsers}
                        >
                          <SelectTrigger id="manager" className="w-full">
                            <SelectValue placeholder={loadingUsers ? "Cargando usuarios..." : "Seleccionar gerente"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin Gerente</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user._id} value={user._id}>
                                {user.username} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Usuarios Autorizados</Label>
                        <div className="p-3 overflow-y-auto border rounded-md max-h-48">
                          {loadingUsers ? (
                            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
                          ) : users.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay usuarios disponibles</p>
                          ) : (
                            <div className="space-y-2">
                              {Array.isArray(users) && users.length > 0 ? (
                                <div className="space-y-2">
                                  {users.map((user) => (
                                    <div key={user._id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`user-${user._id}`}
                                        checked={factory.authorizedUsers.includes(user._id)}
                                        onChange={() => handleAuthorizedUsersChange(user._id)}
                                        className="rounded"
                                      />
                                      <Label
                                        htmlFor={`user-${user._id}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {user.username} ({user.email})
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No hay usuarios disponibles</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 border rounded-md bg-muted/30">
                    <h3 className="mb-3 font-medium">Vista Previa de la Fábrica</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{factory.name || "Nombre de la Fábrica"}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {factory.description || "La descripción de la fábrica aparecerá aquí"}
                          </p>
                        </div>
                        {getStatusBadge(factory.status)}
                      </div>

                      {(factory.manager || factory.authorizedUsers.length > 0) && (
                        <div className="pt-2 border-t">
                          {factory.manager && (
                            <div className="flex items-center gap-2 mb-2">
                              <UserCheck className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">
                                Gerente: {getSelectedManager()?.username || "Cargando..."}
                              </span>
                            </div>
                          )}
                          {factory.authorizedUsers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-green-500" />
                              <span className="text-sm">
                                {factory.authorizedUsers.length} usuario
                                {factory.authorizedUsers.length !== 1 ? "s" : ""} autorizado
                                {factory.authorizedUsers.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasChanges() && (
                    <div className="flex items-center p-3 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">Tienes cambios sin guardar</div>
                      <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                        Restablecer
                      </Button>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="button" variant="outline" onClick={() => navigate("/factories")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                      disabled={isSubmitting || !hasChanges()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Actualizar Fábrica
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

export default EditFactory
