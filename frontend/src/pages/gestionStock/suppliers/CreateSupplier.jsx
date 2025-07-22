"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import MainLayout from "@/components/MainLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createSupplier } from "@/apis/gestionStockApi/supplierApi"
import { Sparkles, Building, User, Phone, Mail, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const CreateSupplier = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [supplier, setSupplier] = useState({
    companyName: "",
    name: "",
    businessPhone: "",
    businessEmail: "",
    commercialContact: "",
    companyContact: "",
    technicalContact: "",
    officePhone: "",
    technicalPhone: "",
    companyEmail: "",
    technicalEmail: "",
  })
  const [activeTab, setActiveTab] = useState("company")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setSupplier((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await createSupplier(supplier)
      toast({
        title: "Éxito",
        description: "¡Proveedor creado exitosamente!",
      })
      setTimeout(() => navigate("/suppliers"), 1500)
    } catch (error) {
      console.error("Error al crear proveedor:", error)
      setError("Error al crear proveedor. Por favor, inténtalo de nuevo.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear proveedor. Por favor, inténtalo de nuevo.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <Toaster />
      <div className="container py-8 mx-auto">
        <Card className="overflow-hidden shadow-lg border-zinc-200 dark:border-zinc-700">
          <CardHeader className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
            <CardTitle className="flex items-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              <Building className="w-5 h-5 mr-2 text-zinc-500 dark:text-zinc-400" />
              Nuevo Proveedor
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Completa el formulario a continuación para crear un nuevo proveedor
            </CardDescription>
          </CardHeader>

          {error && (
            <div className="px-6 pt-6">
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 border-b">
                <TabsList className="justify-start w-full h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="company"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 rounded-none px-4 py-3 data-[state=active]:shadow-none"
                  >
                    Información de la Empresa
                  </TabsTrigger>
                  <TabsTrigger
                    value="contacts"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 rounded-none px-4 py-3 data-[state=active]:shadow-none"
                  >
                    Detalles de Contacto
                  </TabsTrigger>
                  <TabsTrigger
                    value="technical"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 rounded-none px-4 py-3 data-[state=active]:shadow-none"
                  >
                    Información Técnica
                  </TabsTrigger>
                </TabsList>
              </div>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="company" className="p-6 m-0">
                  <motion.div variants={formVariants} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={formItemVariants} className="space-y-2">
                      <Label htmlFor="companyName" className="text-zinc-700 dark:text-zinc-300">
                        Nombre de la Empresa <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                        <Input
                          id="companyName"
                          name="companyName"
                          value={supplier.companyName}
                          onChange={handleChange}
                          required
                          className="pl-10"
                          placeholder="Ingresa el nombre de la empresa"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="space-y-2">
                      <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300">
                        Nombre del Contacto Principal
                      </Label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                        <Input
                          id="name"
                          name="name"
                          value={supplier.name}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Ingresa el nombre del contacto principal"
                        />
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="businessPhone" className="text-zinc-700 dark:text-zinc-300">
                          Teléfono Comercial
                        </Label>
                        <div className="relative">
                          <Phone className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="businessPhone"
                            name="businessPhone"
                            value={supplier.businessPhone}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el teléfono comercial"
                          />
                        </div>
                      </motion.div>

                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="businessEmail" className="text-zinc-700 dark:text-zinc-300">
                          Email Comercial
                        </Label>
                        <div className="relative">
                          <Mail className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="businessEmail"
                            name="businessEmail"
                            type="email"
                            value={supplier.businessEmail}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el email comercial"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <motion.div variants={formItemVariants} className="pt-4">
                      <Button
                        type="button"
                        onClick={() => setActiveTab("contacts")}
                        className="w-full md:w-auto bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                      >
                        Siguiente: Detalles de Contacto
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="contacts" className="p-6 m-0">
                  <motion.div variants={formVariants} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={formItemVariants} className="space-y-2">
                      <Label htmlFor="commercialContact" className="text-zinc-700 dark:text-zinc-300">
                        Contacto Comercial
                      </Label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                        <Input
                          id="commercialContact"
                          name="commercialContact"
                          value={supplier.commercialContact}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Ingresa el nombre del contacto comercial"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={formItemVariants} className="space-y-2">
                      <Label htmlFor="companyContact" className="text-zinc-700 dark:text-zinc-300">
                        Contacto de la Empresa
                      </Label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                        <Input
                          id="companyContact"
                          name="companyContact"
                          value={supplier.companyContact}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Ingresa el nombre del contacto de la empresa"
                        />
                      </div>
                    </motion.div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="officePhone" className="text-zinc-700 dark:text-zinc-300">
                          Teléfono de Oficina
                        </Label>
                        <div className="relative">
                          <Phone className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="officePhone"
                            name="officePhone"
                            value={supplier.officePhone}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el teléfono de oficina"
                          />
                        </div>
                      </motion.div>

                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="companyEmail" className="text-zinc-700 dark:text-zinc-300">
                          Email de la Empresa
                        </Label>
                        <div className="relative">
                          <Mail className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="companyEmail"
                            name="companyEmail"
                            type="email"
                            value={supplier.companyEmail}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el email de la empresa"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <motion.div variants={formItemVariants} className="flex justify-between pt-4">
                      <Button
                        type="button"
                        onClick={() => setActiveTab("company")}
                        variant="outline"
                        className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("technical")}
                        className="bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                      >
                        Siguiente: Información Técnica
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="technical" className="p-6 m-0">
                  <motion.div variants={formVariants} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={formItemVariants} className="space-y-2">
                      <Label htmlFor="technicalContact" className="text-zinc-700 dark:text-zinc-300">
                        Contacto Técnico
                      </Label>
                      <div className="relative">
                        <User className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                        <Input
                          id="technicalContact"
                          name="technicalContact"
                          value={supplier.technicalContact}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Ingresa el nombre del contacto técnico"
                        />
                      </div>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="technicalPhone" className="text-zinc-700 dark:text-zinc-300">
                          Teléfono Técnico
                        </Label>
                        <div className="relative">
                          <Phone className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="technicalPhone"
                            name="technicalPhone"
                            value={supplier.technicalPhone}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el teléfono técnico"
                          />
                        </div>
                      </motion.div>

                      <motion.div variants={formItemVariants} className="space-y-2">
                        <Label htmlFor="technicalEmail" className="text-zinc-700 dark:text-zinc-300">
                          Email Técnico
                        </Label>
                        <div className="relative">
                          <Mail className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-zinc-400" />
                          <Input
                            id="technicalEmail"
                            name="technicalEmail"
                            type="email"
                            value={supplier.technicalEmail}
                            onChange={handleChange}
                            className="pl-10"
                            placeholder="Ingresa el email técnico"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <motion.div variants={formItemVariants} className="flex justify-between pt-4">
                      <Button
                        type="button"
                        onClick={() => setActiveTab("contacts")}
                        variant="outline"
                        className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Anterior
                      </Button>
                    </motion.div>
                  </motion.div>
                </TabsContent>
              </motion.div>
            </Tabs>

            <CardFooter className="flex justify-between p-6 bg-zinc-50 dark:bg-zinc-800/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/suppliers")}
                className="border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 dark:from-zinc-200 dark:to-white dark:text-zinc-900 dark:hover:from-zinc-100 dark:hover:to-zinc-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear Proveedor
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  )
}

export default CreateSupplier
