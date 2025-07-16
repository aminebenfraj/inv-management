"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { createMachine } from "@/apis/gestionStockApi/machineApi"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { Sparkles, ArrowLeft, CheckCircle, PowerOff, Wrench, Loader2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const CreateMachine = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [factories, setFactories] = useState([])
  const [loadingFactories, setLoadingFactories] = useState(true)
  const [machine, setMachine] = useState({
    name: "",
    description: "",
    status: "active",
    factory: "",
  })
  const [errors, setErrors] = useState({
    name: "",
  })

  useEffect(() => {
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    try {
      setLoadingFactories(true)
      const data = await getAllFactories(1, 1000) // Get all factories
      const factoriesArray = Array.isArray(data) ? data : data?.data ? data.data : []
      setFactories(factoriesArray)
    } catch (error) {
      console.error("Failed to fetch factories:", error)
      setFactories([])
      toast({
        title: "Warning",
        description: "Failed to load factories. You can still create a machine without assigning it to a factory.",
        variant: "destructive",
      })
    } finally {
      setLoadingFactories(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setMachine((prev) => ({ ...prev, [name]: value }))

    if (name === "name" && errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }))
    }
  }

  const handleSelectChange = (name, value) => {
    setMachine((prev) => ({ ...prev, [name]: value }))
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
      const machineData = {
        name: machine.name,
        description: machine.description,
        status: machine.status,
      }

      if (machine.factory && machine.factory !== "none") {
        machineData.factory = machine.factory
      }

      await createMachine(machineData)
      toast({
        title: "Success",
        description: "Machine created successfully!",
        variant: "default",
      })

      setMachine({ name: "", description: "", status: "active", factory: "" })
      setTimeout(() => navigate("/machines"), 1500)
    } catch (error) {
      console.error("Failed to create machine:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create machine. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  const getSelectedFactory = () => {
    return Array.isArray(factories) ? factories.find((f) => f._id === machine.factory) : null
  }

  return (
    <MainLayout>
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
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create New Machine</CardTitle>
              <CardDescription>Add a new machine to your inventory</CardDescription>
            </CardHeader>

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
                    <Label htmlFor="factory">Factory (Optional)</Label>
                    <Select
                      value={machine.factory}
                      onValueChange={(value) => handleSelectChange("factory", value)}
                      disabled={loadingFactories}
                    >
                      <SelectTrigger id="factory" className="w-full">
                        <SelectValue
                          placeholder={loadingFactories ? "Loading factories..." : "Select a factory (optional)"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Factory</SelectItem>
                        {Array.isArray(factories) &&
                          factories.map((factory) => (
                            <SelectItem key={factory._id} value={factory._id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {factory.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Assign this machine to a factory for better organization.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={machine.status} onValueChange={(value) => handleSelectChange("status", value)}>
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{machine.name || "Machine Name"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {machine.description || "Machine description will appear here"}
                        </p>
                      </div>
                      {getStatusBadge(machine.status)}
                    </div>
                    {machine.factory && machine.factory !== "none" && getSelectedFactory() && (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Factory: {getSelectedFactory().name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                  <Button
                    type="submit"
                    className="w-full text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Machine
                      </>
                    )}
                  </Button>
                </motion.div>
                <p className="pt-2 text-xs text-center text-muted-foreground">
                  Fields marked with <span className="text-red-500">*</span> are required
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

export default CreateMachine
