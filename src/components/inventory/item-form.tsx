'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useTransition, useEffect } from "react"
import { CheckCircle, AlertTriangle, LoaderCircle, UploadCloud, X, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { validateDescriptionConsistency } from "@/ai/flows/validate-description-consistency"
import type { InventoryItem, ValidateDescriptionConsistencyOutput } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters."),
  category: z.string().min(1, "Category is required."),
  stock: z.coerce.number().min(0, "Stock can't be negative."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
})

type FormData = z.infer<typeof formSchema>

interface ItemFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  item: InventoryItem | null,
  onSave: (data: FormData) => void
}

export function ItemForm({ isOpen, onOpenChange, item, onSave }: ItemFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [isAiValidating, setIsAiValidating] = useState(false)
  const [aiValidationResult, setAiValidationResult] = useState<ValidateDescriptionConsistencyOutput | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.imageUrl ?? null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      stock: 0,
      description: "",
    },
  })
  
  useEffect(() => {
    if (isOpen) {
        if (item) {
        form.reset({
            name: item.name,
            category: item.category,
            stock: item.stock,
            description: item.description,
        })
        setImagePreview(item.imageUrl)
        } else {
        form.reset({
            name: "",
            category: "",
            stock: 0,
            description: "",
        })
        setImagePreview(null)
        }
        setAiValidationResult(null)
    }
  }, [item, form, isOpen])

  const handleValidateDescription = async () => {
    const { description, category, name } = form.getValues()
    if (!description || !category || !name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out Name, Category, and Description to validate.",
      })
      return
    }

    setIsAiValidating(true)
    setAiValidationResult(null)
    try {
      const result = await validateDescriptionConsistency({
        itemDescription: description,
        category: category,
        itemDetails: `Item name: ${name}`,
      })
      setAiValidationResult(result)
    } catch (error) {
      console.error("AI Validation Error:", error)
      toast({
        variant: "destructive",
        title: "AI Validation Failed",
        description: "Could not connect to the validation service.",
      })
    } finally {
      setIsAiValidating(false)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: FormData) => {
    startTransition(() => {
      onSave(values)
    })
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the details of the item." : "Fill in the details for the new item."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-1 space-y-4">
              <div>
                <FormLabel>Item Image</FormLabel>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input p-6 relative bg-muted/20">
                  {imagePreview ? (
                     <>
                        <img src={imagePreview} alt="Preview" className="h-40 w-40 object-cover rounded-md" data-ai-hint="product image" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full"
                          onClick={() => setImagePreview(null)}
                        >
                           <X className="h-4 w-4" />
                        </Button>
                     </>
                  ) : (
                    <div className="text-center w-full py-4">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4 flex text-sm justify-center leading-6 text-muted-foreground">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                        </label>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground/80">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Quantum Flux-o-Matic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select one" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gadgets">Gadgets</SelectItem>
                          <SelectItem value="Robotics">Robotics</SelectItem>
                          <SelectItem value="Apparel">Apparel</SelectItem>
                          <SelectItem value="Power Sources">Power Sources</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the item, its features, and condition."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={handleValidateDescription} disabled={isAiValidating}>
                  {isAiValidating ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Validate with AI
                </Button>
                 {aiValidationResult && (
                  <Alert variant={aiValidationResult.isConsistent ? "default" : "destructive"} className={aiValidationResult.isConsistent ? 'border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-800' : ''}>
                     {aiValidationResult.isConsistent ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle className={aiValidationResult.isConsistent ? 'text-green-800 dark:text-green-300' : ''}>{aiValidationResult.isConsistent ? "Consistent" : "Inconsistent"}</AlertTitle>
                    <AlertDescription className={aiValidationResult.isConsistent ? 'text-green-700 dark:text-green-300' : ''}>{aiValidationResult.reason}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            <DialogFooter className="md:col-span-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {item ? "Save Changes" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
