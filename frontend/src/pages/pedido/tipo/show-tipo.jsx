"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAllTipos } from "../../../apis/pedido/tipoApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Loader2, Plus, Package } from "lucide-react"
import MainLayout from "@/components/MainLayout"

function ShowTipo() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [tipos, setTipos] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        console.log("Fetching all tipos")
        const data = await getAllTipos()

        if (!data || !Array.isArray(data)) {
          setError("No types found or invalid data format")
        } else {
          console.log("Tipos data:", data)
          setTipos(data)
        }
      } catch (error) {
        console.error("Error fetching types:", error)
        setError(error.message || "Failed to load types data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTipos()
  }, [toast])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-8 mx-auto">
          <div className="flex items-center mb-6 space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Error</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <p>Unable to load types. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="container py-8 mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Types</h1>
              <p className="text-muted-foreground">View and manage all order types</p>
            </div>
          </div>
          <Button onClick={() => navigate("/tipo/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Order Types</CardTitle>
            <CardDescription>List of all available order types in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {tipos.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">No order types found. Create your first one!</p>
                <Button className="mt-4" onClick={() => navigate("/tipo/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order Type
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {tipos.map((tipo) => (
                  <div
                    key={tipo._id}
                    className="flex items-center justify-between p-4 transition-colors border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-medium">{tipo.name}</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/tipo/edit/${tipo._id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default ShowTipo

