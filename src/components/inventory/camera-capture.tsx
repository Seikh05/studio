
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
import { LoaderCircle, Camera, VideoOff, RefreshCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { cn } from '@/lib/utils';

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
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');
  
  const stopStream = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);
  
  const getStream = React.useCallback(async (mode: 'environment' | 'user') => {
      stopStream(); // Stop any existing stream
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        setStream(newStream);
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions. This feature may require a secure (HTTPS) connection.',
        });
      }
  }, [stopStream, toast]);

  React.useEffect(() => {
    if (isOpen) {
      getStream(facingMode);
    } else {
      stopStream();
      setHasCameraPermission(null);
    }

    return () => {
      stopStream();
    }
  }, [isOpen, facingMode, getStream, stopStream]);

  React.useEffect(() => {
    if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleToggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

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
                <p className="ml-2">Requesting camera...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <Alert variant="destructive">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Not Available</AlertTitle>
                <AlertDescription>
                  Could not access the camera. Please ensure you've granted permission and are on a secure (HTTPS) connection.
                </AlertDescription>
            </Alert>
          )}

          <div className="relative">
              <video 
                ref={videoRef} 
                className={cn("w-full aspect-video rounded-md bg-muted", hasCameraPermission ? 'block' : 'hidden')} 
                autoPlay 
                muted 
                playsInline 
              />
              <canvas ref={canvasRef} className="hidden" />
              {hasCameraPermission && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleToggleCamera}
                    className="absolute bottom-2 right-2 rounded-full h-10 w-10"
                  >
                    <RefreshCcw className="h-5 w-5" />
                    <span className="sr-only">Switch Camera</span>
                  </Button>
              )}
          </div>
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
