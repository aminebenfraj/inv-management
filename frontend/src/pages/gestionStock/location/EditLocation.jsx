"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getLocationById, updateLocation } from "@/apis/gestionStockApi/locationApi"
import { MapPin, Save, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const EditLocation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [location, setLocation] = useState("")
  const [originalLocation, setOriginalLocation] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState("")

  useEffect(() => {
    fetchLocation()
  }, [id])

  const fetchLocation = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLocationById(id)
      setLocation(data.location)
      setOriginalLocation(data.location)
    } catch (error) {
      console.error("Error al obtener la ubicación:", error)
      setError("Error al obtener los detalles de la ubicación")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al obtener los detalles de la ubicación. Redirigiendo a la lista de ubicaciones.",
      })
      setTimeout(() => navigate("/locations"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!location.trim()) {
      setLocationError("El nombre de la ubicación es obligatorio")
      return false
    }

    if (location.trim().length < 2) {
      setLocationError("El nombre de la ubicación debe tener al menos 2 caracteres")
      return false
    }

    setLocationError("")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await updateLocation(id, { location })
      toast({
        title: "Éxito",
        description: "¡Ubicación actualizada exitosamente!",
      })
      setTimeout(() => navigate("/locations"), 1000)
    } catch (error) {
      console.error("Error al actualizar la ubicación:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message || "Error al actualizar la ubicación. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    return location !== originalLocation
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Editar Ubicación</CardTitle>
              <CardDescription>Actualizar información de la ubicación</CardDescription>
            </CardHeader>

            {loading ? (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-full h-10" />
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
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className={locationError ? "text-red-500" : ""}>
                      Nombre de la Ubicación <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${locationError ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
                      />
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value)
                          if (locationError) setLocationError("")
                        }}
                        className={`w-full pl-10 ${locationError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        placeholder="Ingresa el nombre de la ubicación"
                      />
                    </div>
                    {locationError && <p className="mt-1 text-sm text-red-500">{locationError}</p>}
                  </div>

                  {hasChanges() && (
                    <div className="flex items-center p-3 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">Tienes cambios sin guardar</div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="button" variant="outline" onClick={() => navigate("/locations")}>
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
                          Actualizar Ubicación
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

export default EditLocation
