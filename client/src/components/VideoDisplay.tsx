import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { User, VideoOff } from "lucide-react";
import { motion } from "framer-motion";

interface VideoDisplayProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  className?: string;
  isMuted?: boolean;
  label?: string;
}

export function VideoDisplay({ stream, isLocal, className, isMuted = false, label }: VideoDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideoTrack = stream?.getVideoTracks().some(track => track.enabled) ?? false;

  return (
    <div className={cn("relative overflow-hidden bg-zinc-900 rounded-2xl shadow-xl isolate", className)}>
      {/* Background/Loading State */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
        <div className="flex flex-col items-center gap-4 text-zinc-600">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <User className="w-16 h-16 relative z-10" />
          </div>
          <p className="font-medium text-sm tracking-wide">{isLocal ? "Your Camera" : "Waiting for partner..."}</p>
        </div>
      </div>

      {/* Video Element */}
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className={cn(
            "absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300",
            // Mirror local video for natural feel
            isLocal && "scale-x-[-1]",
            !hasVideoTrack && "opacity-0"
          )}
        />
      )}

      {/* Video Off Placeholder (Visible when stream exists but video track is disabled) */}
      {stream && !hasVideoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 z-20">
          <div className="flex flex-col items-center gap-3 text-zinc-500">
            <VideoOff className="w-12 h-12" />
            <p className="text-sm font-medium">Camera is off</p>
          </div>
        </div>
      )}

      {/* Label Overlay */}
      {label && (
        <div className="absolute bottom-4 left-4 z-30 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90">
          {label}
        </div>
      )}

      {/* Audio Indicator (Optional Polish) */}
      {stream && !isMuted && (
        <div className="absolute top-4 right-4 z-30">
           {/* Could add an audio visualizer here later */}
        </div>
      )}
    </div>
  );
}
