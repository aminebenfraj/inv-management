"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getAllFactories } from "@/apis/gestionStockApi/factoryApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowRight, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const FactorySelector = ({ onFactorySelect, showAllOption = true }) => {
  const [factories, setFactories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchFactories()
  }, [])

  const fetchFactories = async () => {
    try {
      setIsLoading(true)
      const data = await getAllFactories()
      const factoriesArray = Array.isArray(data) ? data : data?.data || []
      setFactories(factoriesArray)
    } catch (error) {
      console.error("Error fetching factories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch factories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFactorySelect = (factory) => {
    onFactorySelect(factory)
    toast({
      title: "Factory Selected",
      description: `Now viewing data for ${factory.name}`,
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="w-full h-6 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* All Factories Option */}
      {showAllOption && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="transition-all duration-300 border-2 border-dashed cursor-pointer border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10"
            onClick={() => handleFactorySelect({ _id: "all", name: "All Factories" })}
          >
            <CardHeader className="pb-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">All Factories</CardTitle>
              <CardDescription>View consolidated data from all factories</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                Global Overview
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Individual Factories */}
      {factories.map((factory) => (
        <motion.div key={factory._id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="transition-all duration-300 cursor-pointer hover:shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50"
            onClick={() => handleFactorySelect(factory)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{factory.name}</CardTitle>
                  <CardDescription>{factory.location || "Factory location"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Click to view dashboard</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* No Factories State */}
      {factories.length === 0 && !isLoading && (
        <Card className="py-12 text-center md:col-span-2 lg:col-span-3">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-medium">No Factories Found</h3>
            <p className="mb-6 text-muted-foreground">Create a factory first to access the dashboard</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Factory
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FactorySelector
