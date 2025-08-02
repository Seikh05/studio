'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Camera, Video, VideoOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface CameraCaptureProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraCapture({ isOpen, onOpenChange, onCapture }: CameraCaptureProps) {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!isOpen) {
        // Stop camera stream when dialog is closed
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        setStream(cameraStream);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isOpen, toast, stream]);


  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Capture Image</DialogTitle>
          <DialogDescription>Position the item in front of your camera and click capture.</DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          {hasCameraPermission === null && (
            <div className="flex items-center justify-center h-60 bg-muted rounded-md">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Requesting camera access...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <Alert variant="destructive">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Camera access was denied. Please enable it in your browser settings and try again.
                </AlertDescription>
            </Alert>
          )}

          {hasCameraPermission === true && (
             <div className="relative">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
             </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission}>
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
