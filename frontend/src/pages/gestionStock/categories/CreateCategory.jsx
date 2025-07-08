"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createCategory } from "@/apis/gestionStockApi/categoryApi"
import { Tag, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const CreateCategory = () => {
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const validateForm = () => {
    if (!name.trim()) {
      setNameError("Category name is required")
      return false
    }

    if (name.trim().length < 2) {
      setNameError("Category name must be at least 2 characters")
      return false
    }

    setNameError("")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createCategory({ name })
      toast({
        title: "Success",
        description: "Category created successfully!",
      })
      setTimeout(() => navigate("/categories"), 1000)
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create category. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Create New Category</CardTitle>
              <CardDescription>Add a new category to organize your items</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={nameError ? "text-red-500" : ""}>
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Tag
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${nameError ? "text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
                    />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (nameError) setNameError("")
                      }}
                      className={`w-full pl-10 ${nameError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      placeholder="Enter category name"
                    />
                  </div>
                  {nameError && <p className="mt-1 text-sm text-red-500">{nameError}</p>}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="button" variant="outline" onClick={() => navigate("/categories")}>
                    Cancel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
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
                        Create Category
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

export default CreateCategory
