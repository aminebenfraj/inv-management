"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createMaterial } from "../../../apis/gestionStockApi/materialApi"
import { getAllSuppliers } from "../../../apis/gestionStockApi/supplierApi"
import { getAllCategories } from "../../../apis/gestionStockApi/categoryApi"
import { getAllLocations } from "../../../apis/gestionStockApi/locationApi"
import { getAllMachines } from "../../../apis/gestionStockApi/machineApi"
import { ArrowLeft, Package, Tag, MapPin, Truck, Sparkles } from "lucide-react"
import MainLayout from "@/components/MainLayout"

const CreateMaterial = () => {
  const navigate = useNavigate()
  const [material, setMaterial] = useState({
    supplier: "",
    manufacturer: "",
    reference: "",
    description: "",
    minimumStock: 0,
    currentStock: 0,
    orderLot: 0,
    location: "",
    critical: false,
    consumable: false,
    machines: [],
    comment: "",
    photo: "",
    price: 0,
    category: "",
  })
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")
  const [error, setError] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchSuppliers(), fetchCategories(), fetchLocations(), fetchMachines()])
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load form data. Please try again or contact support.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const data = await getAllSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchLocations = async () => {
    try {
      const data = await getAllLocations()
      setLocations(data)
    } catch (error) {
      console.error("Failed to fetch locations:", error)
    }
  }

  const fetchMachines = async () => {
    try {
      const data = await getAllMachines()
      setMachines(data)
    } catch (error) {
      console.error("Failed to fetch machines:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setMaterial((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleMachineChange = (machineId) => {
    setMaterial((prev) => ({
      ...prev,
      machines: prev.machines.includes(machineId)
        ? prev.machines.filter((id) => id !== machineId)
        : [...prev.machines, machineId],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required ObjectId fields
    const requiredObjectIds = [
      { field: "supplier", label: "Supplier" },
      { field: "location", label: "Location" },
      { field: "category", label: "Category" },
    ]

    for (const { field, label } of requiredObjectIds) {
      if (!material[field] || material[field] === "") {
        alert(`${label} is required. Please select a valid ${label.toLowerCase()}.`)
        // Set active tab to the location tab where these fields are
        setActiveTab("location")
        return
      }
    }

    try {
      await createMaterial(material)
      alert("Material created successfully!")
      navigate("/materials")
    } catch (error) {
      console.error("Failed to create material:", error)

      // Provide more specific error messages based on the error response
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to create material: ${error.response.data.message}`)
      } else {
        alert("Failed to create material. Please try again.")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 rounded-full border-t-primary animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
          <div className="container px-4 py-8 mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="outline" size="icon" onClick={() => navigate("/materials")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Material Error</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Error Loading Form</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-500">{error}</p>
                <p className="mt-4">You can try the following:</p>
                <ul className="mt-2 ml-5 list-disc">
                  <li>Refresh the page</li>
                  <li>Return to the materials list</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate("/materials")}>Return to Materials List</Button>
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    setError("")
                    setLoading(true)
                    fetchData()
                  }}
                >
                  Try Again
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate("/materials")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Create New Material</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 mb-6 md:grid-cols-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Navigation</CardTitle>
                  <CardDescription>Fill in material details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-1">
                    <Button
                      type="button"
                      variant={activeTab === "basic" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setActiveTab("basic")}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Basic Information
                    </Button>
                    <Button
                      type="button"
                      variant={activeTab === "stock" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setActiveTab("stock")}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Stock & Price
                    </Button>
                    <Button
                      type="button"
                      variant={activeTab === "location" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setActiveTab("location")}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Location & Category
                    </Button>
                    <Button
                      type="button"
                      variant={activeTab === "machines" ? "default" : "ghost"}
                      className="justify-start"
                      onClick={() => setActiveTab("machines")}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Machines & Details
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => navigate("/materials")}>
                    Cancel
                  </Button>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button type="submit">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>
                    {activeTab === "basic" && "Basic Information"}
                    {activeTab === "stock" && "Stock & Price"}
                    {activeTab === "location" && "Location & Category"}
                    {activeTab === "machines" && "Machines & Details"}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "basic" && "Enter the basic details of this material"}
                    {activeTab === "stock" && "Set stock levels and pricing"}
                    {activeTab === "location" && "Set location and categorization"}
                    {activeTab === "machines" && "Associate with machines and add details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTab === "basic" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="reference">Reference</Label>
                          <Input
                            id="reference"
                            name="reference"
                            value={material.reference}
                            onChange={handleChange}
                            required
                            placeholder="Enter material reference"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="manufacturer">Manufacturer</Label>
                          <Input
                            id="manufacturer"
                            name="manufacturer"
                            value={material.manufacturer}
                            onChange={handleChange}
                            required
                            placeholder="Enter manufacturer name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          value={material.description}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Enter material description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photo">Photo URL</Label>
                        <Input
                          id="photo"
                          name="photo"
                          value={material.photo}
                          onChange={handleChange}
                          placeholder="Enter photo URL"
                        />
                        {material.photo && (
                          <div className="mt-2">
                            <img
                              src={material.photo || "/placeholder.svg"}
                              alt={material.reference}
                              className="object-cover w-full h-auto rounded-md max-h-40"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "stock" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="currentStock">Current Stock</Label>
                          <Input
                            id="currentStock"
                            name="currentStock"
                            type="number"
                            value={material.currentStock}
                            onChange={handleChange}
                            required
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minimumStock">Minimum Stock</Label>
                          <Input
                            id="minimumStock"
                            name="minimumStock"
                            type="number"
                            value={material.minimumStock}
                            onChange={handleChange}
                            required
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="orderLot">Order Lot</Label>
                          <Input
                            id="orderLot"
                            name="orderLot"
                            type="number"
                            value={material.orderLot}
                            onChange={handleChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={material.price}
                          onChange={handleChange}
                          required
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex flex-wrap gap-4 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="critical"
                              name="critical"
                              checked={material.critical}
                              onCheckedChange={(checked) =>
                                handleChange({ target: { name: "critical", type: "checkbox", checked } })
                              }
                            />
                            <Label htmlFor="critical" className="font-normal">
                              Critical Item
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="consumable"
                              name="consumable"
                              checked={material.consumable}
                              onCheckedChange={(checked) =>
                                handleChange({ target: { name: "consumable", type: "checkbox", checked } })
                              }
                            />
                            <Label htmlFor="consumable" className="font-normal">
                              Consumable Item
                            </Label>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "location" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="supplier">
                          Supplier <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          name="supplier"
                          value={material.supplier || ""}
                          onValueChange={(value) => handleChange({ target: { name: "supplier", value } })}
                          required
                        >
                          <SelectTrigger className={!material.supplier ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.length > 0 ? (
                              suppliers.map((supplier) => (
                                <SelectItem key={supplier._id} value={supplier._id}>
                                  {supplier.companyName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No suppliers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!material.supplier && <p className="text-xs text-red-500">Supplier is required</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">
                          Location <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          name="location"
                          value={material.location || ""}
                          onValueChange={(value) => handleChange({ target: { name: "location", value } })}
                          required
                        >
                          <SelectTrigger className={!material.location ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.length > 0 ? (
                              locations.map((location) => (
                                <SelectItem key={location._id} value={location._id}>
                                  {location.location}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No locations available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!material.location && <p className="text-xs text-red-500">Location is required</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          name="category"
                          value={material.category || ""}
                          onValueChange={(value) => handleChange({ target: { name: "category", value } })}
                          required
                        >
                          <SelectTrigger className={!material.category ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem key={category._id} value={category._id}>
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No categories available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {!material.category && <p className="text-xs text-red-500">Category is required</p>}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "machines" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Associated Machines</Label>
                        <ScrollArea className="h-[200px] border rounded-md p-4">
                          <div className="grid grid-cols-2 gap-2">
                            {machines.map((machine) => (
                              <div key={machine._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`machine-${machine._id}`}
                                  checked={material.machines.includes(machine._id)}
                                  onCheckedChange={() => handleMachineChange(machine._id)}
                                />
                                <Label htmlFor={`machine-${machine._id}`} className="font-normal">
                                  {machine.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comment">Additional Comments</Label>
                        <Textarea
                          id="comment"
                          name="comment"
                          value={material.comment}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Enter any additional information about this material"
                        />
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

export default CreateMaterial

