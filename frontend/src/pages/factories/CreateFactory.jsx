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
import { createFactory } from "../../apis/gestionStockApi/factoryApi"
import { getAllUsers } from "../../apis/admin"
import { Sparkles, ArrowLeft, CheckCircle, PowerOff, Wrench, Loader2, Users, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const CreateFactory = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [factory, setFactory] = useState({
    name: "",
    description: "",
    status: "active",
    manager: "",
    authorizedUsers: [],
  })
  const [errors, setErrors] = useState({
    name: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const userData = await getAllUsers()
      // Handle different possible response structures
      const usersArray = Array.isArray(userData) ? userData : userData.data || userData.users || []
      setUsers(usersArray)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([]) // Ensure users is always an array
      toast({
        title: "Warning",
        description: "Failed to load users for manager selection",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFactory((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
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
      newErrors.name = "Factory name is required"
    } else if (factory.name.length < 3) {
      newErrors.name = "Factory name must be at least 3 characters"
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

      await createFactory(factoryData)
      toast({
        title: "Success",
        description: "Factory created successfully!",
        variant: "default",
      })
      // Reset form
      setFactory({
        name: "",
        description: "",
        status: "active",
        manager: "",
        authorizedUsers: [],
      })
      // Navigate back to factories list after short delay
      setTimeout(() => navigate("/factories"), 1500)
    } catch (error) {
      console.error("Failed to create factory:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create factory. Please try again.",
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

  const getSelectedManager = () => {
    return users.find((user) => user._id === factory.manager)
  }

  const getSelectedUsers = () => {
    return users.filter((user) => factory.authorizedUsers.includes(user._id))
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/factories")} className="mr-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Factories
            </Button>
          </div>

          <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create New Factory</CardTitle>
              <CardDescription>Add a new factory to your system</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
                        Factory Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={factory.name}
                        onChange={handleChange}
                        placeholder="Enter factory name"
                        className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={factory.description}
                        onChange={handleChange}
                        placeholder="Enter factory description"
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Provide details about the factory's purpose, location, or other relevant information.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        name="status"
                        value={factory.status}
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

                  {/* Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Management</h3>

                    <div className="space-y-2">
                      <Label htmlFor="manager">Factory Manager</Label>
                      <Select
                        name="manager"
                        value={factory.manager}
                        onValueChange={(value) => handleChange({ target: { name: "manager", value } })}
                        disabled={loadingUsers}
                      >
                        <SelectTrigger id="manager" className="w-full">
                          <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select manager"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.username} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Authorized Users</Label>
                      <div className="p-3 overflow-y-auto border rounded-md max-h-48">
                        {loadingUsers ? (
                          <p className="text-sm text-muted-foreground">Loading users...</p>
                        ) : users.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No users available</p>
                        ) : Array.isArray(users) && users.length > 0 ? (
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
                                <Label htmlFor={`user-${user._id}`} className="text-sm font-normal cursor-pointer">
                                  {user.username} ({user.email})
                                </Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No users available</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select users who will have access to this factory.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="p-4 border rounded-md bg-muted/30">
                  <h3 className="mb-3 font-medium">Factory Preview</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{factory.name || "Factory Name"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {factory.description || "Factory description will appear here"}
                        </p>
                      </div>
                      {getStatusBadge(factory.status)}
                    </div>

                    {(factory.manager || factory.authorizedUsers.length > 0) && (
                      <div className="pt-2 border-t">
                        {factory.manager && (
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Manager: {getSelectedManager()?.username || "Loading..."}</span>
                          </div>
                        )}
                        {factory.authorizedUsers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="text-sm">
                              {factory.authorizedUsers.length} authorized user
                              {factory.authorizedUsers.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
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
                        Create Factory
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

export default CreateFactory
