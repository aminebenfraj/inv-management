"use client"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, parseISO } from "date-fns"
import { CalendarIcon, LockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Updated role fields with exact field names from CheckInModel
const roleFields = [
  { id: "Project_Manager", label: "Project Manager" },
  { id: "Business_Manager", label: "Business Manager" },
  { id: "Financial_Leader", label: "Financial Leader" },
  { id: "Manufacturing_Eng_Manager", label: "Manufacturing Eng. Manager" },
  { id: "Manufacturing_Eng_Leader", label: "Manufacturing Eng. Leader" },
  { id: "Methodes_UAP1_3", label: "Methodes UAP1&3" },
  { id: "Methodes_UAP2", label: "Methodes UAP2" },
  { id: "Maintenance_Manager", label: "Maintenance Manager" },
  { id: "Maintenance_Leader_UAP2", label: "Maintenance Leader UAP2" },
  { id: "Prod_Plant_Manager_UAP1", label: "Prod. Plant Manager UAP1" },
  { id: "Prod_Plant_Manager_UAP2", label: "Prod. Plant Manager UAP2" },
  { id: "Quality_Manager", label: "Quality Manager" },
  { id: "Quality_Leader_UAP1", label: "Quality Leader UAP1" },
  { id: "Quality_Leader_UAP2", label: "Quality Leader UAP2" },
  { id: "Quality_Leader_UAP3", label: "Quality Leader UAP3" },
]

const RoleBasedCheckin = ({ checkinData, setCheckinData, readOnly = false, showTitle = true }) => {
  const { user, isAdmin, hasRole } = useAuth()
  const { toast } = useToast()

  // Check if user has a specific role
  const hasRoleForField = (fieldId) => {
    if (!user?.roles) return false

    // Map from field ID to actual role name
    const roleMapping = {
      Project_Manager: "Project Manager",
      Business_Manager: "Business Manager",
      Financial_Leader: "Financial Leader",
      Manufacturing_Eng_Manager: "Manufacturing Eng. Manager",
      Manufacturing_Eng_Leader: "Manufacturing Eng. Leader",
      Methodes_UAP1_3: "Methodes UAP1&3",
      Methodes_UAP2: "Methodes UAP2",
      Maintenance_Manager: "Maintenance Manager",
      Maintenance_Leader_UAP2: "Maintenance Leader UAP2",
      Prod_Plant_Manager_UAP1: "Prod. Plant Manager UAP1",
      Prod_Plant_Manager_UAP2: "Prod. Plant Manager UAP2",
      Quality_Manager: "Quality Manager",
      Quality_Leader_UAP1: "Quality Leader UAP1",
      Quality_Leader_UAP2: "Quality Leader UAP2",
      Quality_Leader_UAP3: "Quality Leader UAP3",
    }

    const roleName = roleMapping[fieldId]
    return hasRole(roleName)
  }

  // Determine if a field is editable by the current user
  const canEditField = (fieldId) => {
    if (readOnly) return false
    return isAdmin() || hasRoleForField(fieldId)
  }

  const handleCheckboxChange = (fieldId) => {
    if (!canEditField(fieldId)) {
      toast({
        title: "Access Denied",
        description: `Only users with the ${fieldId.replace(/_/g, " ")} role can modify this section.`,
        variant: "destructive",
      })
      return
    }

    setCheckinData({
      ...checkinData,
      [fieldId]: {
        ...checkinData[fieldId],
        value: !checkinData[fieldId]?.value,
        date: !checkinData[fieldId]?.value ? new Date().toLocaleString
() : checkinData[fieldId]?.date,
      },
    })
  }

  const handleCommentChange = (fieldId, value) => {
    if (!canEditField(fieldId)) return

    setCheckinData({
      ...checkinData,
      [fieldId]: {
        ...checkinData[fieldId],
        comment: value,
      },
    })
  }

  const handleNameChange = (fieldId, value) => {
    if (!canEditField(fieldId)) return

    setCheckinData({
      ...checkinData,
      [fieldId]: {
        ...checkinData[fieldId],
        name: value,
      },
    })
  }

  const handleDateChange = (fieldId, date) => {
    if (!canEditField(fieldId)) return

    setCheckinData({
      ...checkinData,
      [fieldId]: {
        ...checkinData[fieldId],
        date: date.toLocaleString
(),
      },
    })
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Not submitted"
      const date = parseISO(dateString)
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  return (
    <CardContent>
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {roleFields.map((field, index) => {
          const isEditable = canEditField(field.id)

          return (
            <motion.div
              key={field.id}
              className={cn(
                "p-4 border rounded-lg relative",
                isEditable ? "border-primary/20" : "border-muted",
                isEditable && "hover:border-primary/50",
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              {!isEditable && (
                <div className="absolute top-2 right-2 text-muted-foreground">
                  <LockIcon size={14} />
                </div>
              )}

              <div className="flex items-start mb-3 space-x-3">
                <Checkbox
                  id={`${field.id}-checkbox`}
                  checked={checkinData[field.id]?.value || false}
                  disabled={!isEditable}
                  onCheckedChange={() => handleCheckboxChange(field.id)}
                  className={!isEditable ? "opacity-60" : ""}
                />
                <label
                  htmlFor={`${field.id}-checkbox`}
                  className={cn(
                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed",
                    !isEditable ? "text-muted-foreground" : "",
                  )}
                >
                  {field.label}
                </label>
              </div>

              <div className="mb-3">
                <Label
                  htmlFor={`${field.id}-name`}
                  className={cn("block mb-1 text-xs", !isEditable ? "text-muted-foreground" : "text-gray-500")}
                >
                  Name
                </Label>
                <Input
                  id={`${field.id}-name`}
                  placeholder={isEditable ? "Enter name" : "Not editable"}
                  value={checkinData[field.id]?.name || ""}
                  onChange={(e) => handleNameChange(field.id, e.target.value)}
                  disabled={!isEditable}
                  className={cn("h-8 text-sm", !isEditable ? "opacity-60" : "")}
                />
              </div>

              <div className="mb-3">
                <Label className={cn("block mb-1 text-xs", !isEditable ? "text-muted-foreground" : "text-gray-500")}>
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!isEditable}
                      className={cn(
                        "justify-start w-full h-8 text-sm font-normal text-left",
                        !isEditable ? "opacity-60" : "",
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {checkinData[field.id]?.date ? (
                        format(new Date(checkinData[field.id].date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkinData[field.id]?.date ? new Date(checkinData[field.id].date) : undefined}
                      onSelect={(date) => date && handleDateChange(field.id, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Label
                htmlFor={`${field.id}-comment`}
                className={cn("block mb-1 text-xs", !isEditable ? "text-muted-foreground" : "text-gray-500")}
              >
                Comments
              </Label>
              <Textarea
                id={`${field.id}-comment`}
                placeholder={isEditable ? "Add comments here..." : "Not editable"}
                value={checkinData[field.id]?.comment || ""}
                onChange={(e) => handleCommentChange(field.id, e.target.value)}
                disabled={!isEditable}
                className={cn("h-20 text-sm", !isEditable ? "opacity-60" : "")}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </CardContent>
  )
}

export default RoleBasedCheckin
