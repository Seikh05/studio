
'use client';

import * as React from 'react';
import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
           <div className="bg-white rounded-lg p-2 text-primary-foreground">
             <Image
                src="https://res.cloudinary.com/diqgquom2/image/upload/v1754114497/WhatsApp_Image_2024-11-13_at_23.44.12_1060fab9-removebg-preview_hzogwa.png"
                alt="Club Logo"
                width={40}
                height={40}
                className="h-10 w-10"
             />
          </div>
        </div>
        <Card>
           <CardHeader className="text-center">
             <CardTitle className="text-3xl">Robostreaks Inventory</CardTitle>
             <CardDescription>
                Sign in to your account to get started.
             </CardDescription>
           </CardHeader>
           <CardContent>
              <LoginForm />
           </CardContent>
        </Card>
         <p className="mt-8 text-center text-sm text-muted-foreground">
          Sign in as Super Admin to manage the inventory.
        </p>
      </div>
    </div>
  );
}
