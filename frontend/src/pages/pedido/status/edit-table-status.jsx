"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getTableStatusById, updateTableStatus,deleteTableStatus } from "../../../apis/pedido/tableStatusApi.jsx"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react"
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
import MainLayout from "@/components/MainLayout"

function EditTableStatus() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    color: "#808080",
    order: 0,
  })

  useEffect(() => {
    const fetchTableStatus = async () => {
      try {
        const data = await getTableStatusById(id)
        setFormData({
          name: data.name || "",
          color: data.color || "#808080",
          order: data.order || 0,
        })
      } catch (error) {
        console.error("Error fetching table status:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load table status data",
        })
        navigate("/table-status")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTableStatus()
  }, [id, navigate, toast])
const handleDelete = async () => {
  try {
    setIsSaving(true)
    await deleteTableStatus(id)
    toast({
      title: "Success",
      description: "Table status deleted successfully",
    })
    navigate("/table-status")
  } catch (error) {
    console.error("Error deleting table status:", error)
    toast({
      variant: "destructive",
      title: "Error",
      description: error.response?.data?.error || error.message || "Failed to delete table status",
    })
  } finally {
    setIsSaving(false)
  }
}

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order" ? (value === "" ? 0 : Number.parseInt(value, 10)) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error("Name is required")
      }

      await updateTableStatus(id, formData)
      toast({
        title: "Success",
        description: "Table status updated successfully",
      })
      navigate("/table-status")
    } catch (error) {
      console.error("Error updating table status:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update table status",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
            <Button variant="outline" size="icon" onClick={() => navigate("/table-status")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Table Status</h1>
              <p className="text-muted-foreground">Modify an existing table status</p>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Table Status Details</CardTitle>
              <CardDescription>Update the information for this table status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-4">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-16 h-10"
                  />
                  <Input name="color" value={formData.color} onChange={handleInputChange} className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input id="order" name="order" type="number" value={formData.order} onChange={handleInputChange} />
                <p className="text-sm text-muted-foreground">Lower numbers will appear first in the list</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={() => navigate("/table-status")}>
                  Cancel
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this table status and may affect any
                        orders that are using it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
  onClick={handleDelete}
  disabled={isSaving}
>
  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
  Delete
</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </MainLayout>
  )
}

export default EditTableStatus

