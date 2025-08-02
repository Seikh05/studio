
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useTransition, useEffect, useState } from "react"
import { LoaderCircle, Eye, EyeOff } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"
import { ScrollArea } from "../ui/scroll-area"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["Admin", "Super Admin", "General Member"]),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
  phone: z.string().optional(),
  regdNum: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface UserFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  user: User | null,
  onSave: (data: Omit<User, 'id' | 'lastLogin' | 'status' | 'avatarUrl'>) => void
  currentUser: User | null
}

export function UserForm({ isOpen, onOpenChange, user, onSave, currentUser }: UserFormProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "Admin",
      password: "",
      phone: "",
      regdNum: "",
    },
  })
  
  useEffect(() => {
    if (isOpen) {
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                role: user.role,
                password: "", // Don't pre-fill password for existing users
                phone: user.phone || "",
                regdNum: user.regdNum || "",
            })
        } else {
            form.reset({
                name: "",
                email: "",
                role: "General Member",
                password: "",
                phone: "",
                regdNum: "",
            })
        }
    }
  }, [user, form, isOpen])

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user && !values.password) {
        form.setError("password", { type: "manual", message: "Password is required for new users." });
        return;
    }

    startTransition(() => {
      const dataToSave = { ...values };
      if (!dataToSave.password) {
        // @ts-ignore
        delete dataToSave.password;
      }
      onSave(dataToSave)
    })
  }

  const canEditRole = currentUser?.role === 'Super Admin';
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user's details and role. Leave password blank to keep it unchanged." : "Fill in the details for the new user."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Alice Johnson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g. alice@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field}
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute inset-y-0 right-0 h-full w-10 text-muted-foreground hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="regdNum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 21051234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!canEditRole}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                           <SelectItem value="General Member">General Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {user ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
