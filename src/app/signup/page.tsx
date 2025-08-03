
'use client';

import { SignUpForm } from '@/components/auth/signup-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <div className="bg-primary rounded-lg p-2 text-primary-foreground inline-flex">
                    <Image
                    src="https://res.cloudinary.com/diqgquom2/image/upload/v1754114497/WhatsApp_Image_2024-11-13_at_23.44.12_1060fab9-removebg-preview_hzogwa.png"
                    alt="Club Icon"
                    width={40}
                    height={40}
                    />
                </div>
            </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Enter your details to register. Your account will need admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}

