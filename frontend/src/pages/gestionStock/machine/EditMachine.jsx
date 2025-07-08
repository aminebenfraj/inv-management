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
import { getMachineById, updateMachine } from "@/apis/gestionStockApi/machineApi"
import { Save, ArrowLeft, CheckCircle, PowerOff, Wrench, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const EditMachine = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [machine, setMachine] = useState({
    name: "",
    description: "",
    status: "active",
  })
  const [originalMachine, setOriginalMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({
    name: "",
  })

  useEffect(() => {
    if (id) {
      fetchMachine()
    }
  }, [id])

  const fetchMachine = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getMachineById(id)
      setMachine(data)
      setOriginalMachine(data)
    } catch (error) {
      console.error("Failed to fetch machine:", error)
      setError("Failed to fetch machine details")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch machine details. Redirecting to machines list.",
      })
      // Delay navigation to allow toast to be seen
      setTimeout(() => navigate("/machines"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setMachine((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (name === "name" && errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!machine.name.trim()) {
      newErrors.name = "Machine name is required"
    } else if (machine.name.length < 3) {
      newErrors.name = "Machine name must be at least 3 characters"
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
      await updateMachine(id, machine)
      toast({
        title: "Success",
        description: "Machine updated successfully!",
        variant: "default",
      })
      // Navigate back to machines list after short delay
      setTimeout(() => navigate("/machines"), 1500)
    } catch (error) {
      console.error("Failed to update machine:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update machine. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = () => {
    if (!originalMachine) return false
    return (
      machine.name !== originalMachine.name ||
      machine.description !== originalMachine.description ||
      machine.status !== originalMachine.status
    )
  }

  const resetForm = () => {
    if (originalMachine) {
      setMachine({ ...originalMachine })
      setErrors({})
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-700 border-red-200 bg-red-50">
            <PowerOff className="w-3 h-3" />
            Inactive
          </Badge>
        )
      case "maintenance":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
            <Wrench className="w-3 h-3" />
            Maintenance
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/machines")} className="mr-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Machines
            </Button>
          </div>

          <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Edit Machine</CardTitle>
              <CardDescription>Update machine information</CardDescription>
            </CardHeader>

            {loading ? (
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-5" />
                    <Skeleton className="w-full h-10" />
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                        Machine Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={machine.name}
                        onChange={handleChange}
                        placeholder="Enter machine name"
                        className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={machine.description}
                        onChange={handleChange}
                        placeholder="Enter machine description"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide details about the machine's purpose, location, or other relevant information.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        value={machine.status}
                        onValueChange={(value) => handleChange({ target: { name: "status", value } })}
                      >
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="p-4 border rounded-md bg-muted/30">
                    <h3 className="mb-2 font-medium">Machine Preview</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{machine.name || "Machine Name"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {machine.description || "No description provided"}
                        </p>
                      </div>
                      {getStatusBadge(machine.status)}
                    </div>
                  </div>

                  {hasChanges() && (
                    <div className="flex items-center p-3 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                      <div className="flex-1 text-sm text-blue-700 dark:text-blue-300">You have unsaved changes</div>
                      <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                        Reset
                      </Button>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-between">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="button" variant="outline" onClick={() => navigate("/machines")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancel
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
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Machine
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

export default EditMachine
