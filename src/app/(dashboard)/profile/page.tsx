
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
import { ScrollArea } from '@/components/ui/scroll-area';

const LOGGED_IN_USER_KEY = 'logged-in-user';
const USER_STORAGE_KEY = 'user-data';
const HOSTED_IMAGE_STORAGE_KEY = 'hosted-images';
const PLACEHOLDER_AVATAR = 'https://placehold.co/40x40.png';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  phone: z.string().optional(),
  regdNum: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Helper to simulate image hosting
const imageHost = {
  get: (imageId: string): string => {
    if (!imageId || !imageId.startsWith('hosted-img-')) return imageId;
    try {
      const hostedImagesRaw = window.localStorage.getItem(HOSTED_IMAGE_STORAGE_KEY);
      const hostedImages = hostedImagesRaw ? JSON.parse(hostedImagesRaw) : {};
      return hostedImages[imageId] || PLACEHOLDER_AVATAR;
    } catch (error) {
      console.error("Failed to get image from virtual host", error);
      return PLACEHOLDER_AVATAR;
    }
  },
  save: (dataUrl: string): string => {
    try {
      const hostedImagesRaw = window.localStorage.getItem(HOSTED_IMAGE_STORAGE_KEY);
      const hostedImages = hostedImagesRaw ? JSON.parse(hostedImagesRaw) : {};
      const imageId = `hosted-img-${Date.now()}`;
      hostedImages[imageId] = dataUrl;
      window.localStorage.setItem(HOSTED_IMAGE_STORAGE_KEY, JSON.stringify(hostedImages));
      return imageId;
    } catch (error) {
      console.error("Failed to save image to virtual host", error);
      throw error; // Re-throw to be caught by the caller
    }
  },
  remove: (imageId: string | undefined) => {
    if (!imageId || !imageId.startsWith('hosted-img-')) return;
    try {
      const hostedImagesRaw = window.localStorage.getItem(HOSTED_IMAGE_STORAGE_KEY);
      if (!hostedImagesRaw) return;
      const hostedImages = JSON.parse(hostedImagesRaw);
      delete hostedImages[imageId];
      window.localStorage.setItem(HOSTED_IMAGE_STORAGE_KEY, JSON.stringify(hostedImages));
    } catch (error) {
      console.error("Failed to remove image from virtual host", error);
    }
  }
};


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = React.useState<string | undefined>(PLACEHOLDER_AVATAR);
  const [previousAvatarId, setPreviousAvatarId] = React.useState<string | undefined>(undefined);


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
      phone: '',
      regdNum: '',
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
          phone: fullUser.phone || '',
          regdNum: fullUser.regdNum || '',
        });
        setPreviousAvatarId(fullUser.avatarUrl);
      }
    } catch (error) {
      console.error('Failed to retrieve user from storage', error);
    }
  }, [reset]);

  const formAvatarUrl = watch('avatarUrl');

  React.useEffect(() => {
    if (formAvatarUrl) {
      setAvatarDisplayUrl(imageHost.get(formAvatarUrl));
    } else {
      setAvatarDisplayUrl(PLACEHOLDER_AVATAR);
    }
  }, [formAvatarUrl]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
       // Check file size (e.g., limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Image Too Large',
          description: 'Please select an image smaller than 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      setIsUploading(true);
      reader.onloadend = () => {
        try {
          const newImageId = imageHost.save(reader.result as string);
          // Set new value and clean up old image if there was one
          setValue('avatarUrl', newImageId, { shouldValidate: true, shouldDirty: true });
          imageHost.remove(previousAvatarId); // Remove the old image
          setPreviousAvatarId(newImageId); // The new image is now the "previous" one for the next upload
          toast({
              title: 'Image Ready',
              description: 'Your new profile picture is ready to be saved.',
          });
        } catch(e: any) {
            let description = "Could not save the new image.";
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                description = "The browser storage is full. Please remove the current image before uploading a new one.";
            }
            toast({
              variant: 'destructive',
              title: 'Upload Failed',
              description,
            });
        } finally {
            setIsUploading(false);
        }
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
    imageHost.remove(formAvatarUrl); // Remove from our virtual host
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
      // Use placeholder if avatarUrl is empty, otherwise use the value from the form
      const finalAvatarUrl = data.avatarUrl || PLACEHOLDER_AVATAR;
      const updatedUser = { ...user, ...data, avatarUrl: finalAvatarUrl };

      window.localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(updatedUser));

      const allUsersRaw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (allUsersRaw) {
        let allUsers: User[] = JSON.parse(allUsersRaw);
        allUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(allUsers));
      }
      
      setUser(updatedUser);
       // After successful save, the new avatar becomes the one to be replaced next time
      setPreviousAvatarId(finalAvatarUrl);
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });

      window.dispatchEvent(new Event('storage'));

    } catch (error: any) {
      console.error("Failed to save profile", error);
      let description = "There was an error saving your profile.";
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          description = "Could not save changes because the browser storage is full. This can happen if the new avatar is too large."
      }
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: description,
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

  const showRemoveButton = formAvatarUrl && formAvatarUrl !== PLACEHOLDER_AVATAR;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Update your personal information and display picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarDisplayUrl} alt={user.name} data-ai-hint="person avatar"/>
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

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                    <div className='space-y-2'>
                        <Label htmlFor='phone'>Phone Number (Optional)</Label>
                        <Input id="phone" {...field} placeholder="e.g., 9876543210" />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                    </div>
                )}
              />

              <Controller
                name="regdNum"
                control={control}
                render={({ field }) => (
                    <div className='space-y-2'>
                        <Label htmlFor='regdNum'>Registration Number (Optional)</Label>
                        <Input id="regdNum" {...field} placeholder="e.g., 21051234" />
                        {errors.regdNum && <p className="text-sm text-destructive">{errors.regdNum.message}</p>}
                    </div>
                )}
              />
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2 pt-4">
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
