
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation'
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
import Link from "next/link"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

const USER_STORAGE_KEY = 'user-data';

export function SignUpForm() {
  const router = useRouter()
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
    setIsLoading(true)
    
    setTimeout(() => {
        let allUsers: User[] = [];
        try {
            const storedData = window.localStorage.getItem(USER_STORAGE_KEY);
            if (storedData) {
                allUsers = JSON.parse(storedData);
            }
        } catch (error) {
            console.error("Failed to process user data from localStorage", error);
            // Continue with an empty array if parsing fails
        }
        
        // Check if user already exists
        const existingUser = allUsers.find(u => u.email === values.email);
        if (existingUser) {
             toast({
                variant: "destructive",
                title: "Registration Failed",
                description: "An account with this email already exists.",
            })
            setIsLoading(false);
            return;
        }

        const newUser: User = {
            id: `USR-${Date.now()}`,
            name: values.name,
            email: values.email,
            password: values.password,
            role: 'New User',
            status: 'Inactive',
            lastLogin: new Date().toISOString(),
            avatarUrl: `https://placehold.co/40x40.png`,
        };
        
        allUsers.push(newUser);

        try {
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(allUsers));
            toast({
                title: "Registration Successful",
                description: "Your account has been created and is pending admin approval.",
            });
            router.push("/login");
        } catch (error) {
            console.error("Failed to save new user", error);
             toast({
                variant: "destructive",
                title: "Registration Error",
                description: "Could not save your registration. Please try again.",
            });
            setIsLoading(false);
        }

    }, 500);
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="john.doe@example.com" {...field} />
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
             <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign In
                </Link>
            </div>
        </form>
      </Form>
  )
}
