
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, UploadCloud, Trash2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const LOGGED_IN_USER_KEY = 'logged-in-user';
const USER_STORAGE_KEY = 'user-data';
const PLACEHOLDER_AVATAR = 'https://placehold.co/40x40.png';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      avatarUrl: '',
    },
  });
  
  React.useEffect(() => {
    setIsClient(true);
    try {
      const storedUser = window.localStorage.getItem(LOGGED_IN_USER_KEY);
      if (storedUser) {
        const fullUser = JSON.parse(storedUser);
        setUser(fullUser);
        reset({
          name: fullUser.name,
          email: fullUser.email,
          avatarUrl: fullUser.avatarUrl,
        });
      }
    } catch (error) {
      console.error('Failed to retrieve user from storage', error);
    }
  }, [reset]);

  const avatarPreview = watch('avatarUrl');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      setIsUploading(true);
      reader.onloadend = () => {
        setValue('avatarUrl', reader.result as string, { shouldValidate: true, shouldDirty: true });
        setIsUploading(false);
         toast({
            title: 'Image Ready',
            description: 'Your new profile picture is ready to be saved.',
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
            variant: 'destructive',
            title: 'Read Failed',
            description: 'There was an error reading the image file.',
        })
      }
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true });
    toast({
        title: 'Image Removed',
        description: 'Your profile picture has been removed. Click "Save Changes" to confirm.',
    });
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const onSubmit = (data: ProfileFormData) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const updatedUser = { ...user, ...data, avatarUrl: data.avatarUrl || PLACEHOLDER_AVATAR };
      
      // Update the logged-in user session
      window.localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(updatedUser));

      // Update the master user list
      const allUsersRaw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (allUsersRaw) {
        let allUsers: User[] = JSON.parse(allUsersRaw);
        allUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(allUsers));
      }
      
      setUser(updatedUser);
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });

      // Force a re-render in other components listening to this key
      window.dispatchEvent(new Event('storage'));

    } catch (error) {
      console.error("Failed to save profile", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was an error saving your profile.",
      })
    } finally {
      setIsSaving(false);
    }
  };

  if (!isClient || !user) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const showRemoveButton = avatarPreview && avatarPreview !== PLACEHOLDER_AVATAR;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Update your personal information and display picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} alt={user.name} data-ai-hint="person avatar"/>
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                 <label
                    htmlFor="avatar-upload"
                    className={cn(
                        "relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80",
                        "flex items-center justify-center gap-2 border border-dashed border-input p-2 text-center text-sm",
                        isUploading && "cursor-not-allowed opacity-50"
                    )}
                    >
                    {isUploading ? (
                        <>
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="h-5 w-5" />
                            <span>Change Picture</span>
                        </>
                    )}
                    <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" disabled={isUploading}/>
                </label>
                {showRemoveButton && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage} disabled={isUploading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
                <div className='space-y-2'>
                    <Label htmlFor='name'>Full Name</Label>
                    <Input id="name" {...field} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
            )}
           />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
                <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address</Label>
                    <Input id="email" type="email" {...field} disabled />
                     {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
            )}
           />
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {(isSaving || isUploading) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
