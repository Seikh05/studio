
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { Eye, EyeOff, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

const USER_STORAGE_KEY = 'user-data';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    setTimeout(() => {
      try {
        const existingUsersRaw = window.localStorage.getItem(USER_STORAGE_KEY);
        const existingUsers: User[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

        const emailExists = existingUsers.some(user => user.email === values.email);
        if (emailExists) {
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: "An account with this email already exists.",
          });
          setIsLoading(false);
          return;
        }

        const newUser: User = {
          id: `USR-${Date.now()}`,
          name: values.name,
          email: values.email,
          password: values.password,
          role: 'General Member',
          status: 'Active',
          lastLogin: new Date().toISOString(),
          avatarUrl: `https://placehold.co/40x40.png`,
        };
        
        const updatedUsers = [...existingUsers, newUser];
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUsers));
        
        toast({
          title: "Registration Successful",
          description: "You can now sign in with your new account.",
        });
        
        form.reset();
        onSuccess?.();
        // Dispatch a storage event to notify other components (like the login form)
        window.dispatchEvent(new Event('storage'));


      } catch (error) {
        console.error("Failed to register user:", error);
        toast({
            variant: "destructive",
            title: "Registration Error",
            description: "An unexpected error occurred. Please try again."
        })
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  )
}
