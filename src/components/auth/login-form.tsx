
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
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
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
})

const USER_STORAGE_KEY = 'user-data';
const LOGGED_IN_USER_KEY = 'logged-in-user';

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // This runs on the client, after hydration
    try {
      const storedData = window.localStorage.getItem(USER_STORAGE_KEY);
      if (storedData) {
        setUsers(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to read users from localStorage", error);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Could not retrieve user data.",
      })
    }
  }, [toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    // Listen for storage changes to get the latest user list
     const handleStorageChange = () => {
        try {
            const storedData = window.localStorage.getItem(USER_STORAGE_KEY);
            if (storedData) {
                setUsers(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Failed to read users from localStorage", error);
        }
    };
    window.addEventListener('storage', handleStorageChange);


    setTimeout(() => {
      const user = users.find(u => u.email === values.email);

      // In this demo, the password can be the plain-text 'password' (for original users),
      // the password set in the user form (for new users), or the hardcoded one.
      if (user && (user.password === values.password || values.password === 'password' || !user.password)) {
        
        if(user.role === 'New User') {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Your account is pending admin approval. Please check back later.'
            });
            setIsLoading(false);
            return;
        }
        
        try {
            // Create a session object without the password or other large data
            const sessionUser = { ...user };
            delete sessionUser.password;
            
            window.localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(sessionUser));
            
            if (user.role === 'General Member') {
                router.push("/inventory")
            } else {
                router.push("/dashboard")
            }
        } catch (error) {
            console.error("Failed to save user session", error);
            
            let description = "Could not create user session. Please try again."
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                description = "Your browser storage is full. Please clear some space and try again."
            }

            toast({
                variant: "destructive",
                title: "Login Error",
                description: description,
            })
            setIsLoading(false)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
        })
        setIsLoading(false)
      }
      window.removeEventListener('storage', handleStorageChange);
    }, 1000)
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
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
              Sign In
            </Button>
        </form>
      </Form>
  )
}
