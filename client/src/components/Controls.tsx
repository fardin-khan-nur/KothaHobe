import { Mic, MicOff, Video, VideoOff, SkipForward, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onNext: () => void;
  onStart: () => void;
  onStop: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  status: 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function Controls({
  onToggleAudio,
  onToggleVideo,
  onNext,
  onStart,
  onStop,
  isAudioEnabled,
  isVideoEnabled,
  status
}: ControlsProps) {
  const isSearching = status === 'searching' || status === 'connecting';
  const isConnected = status === 'connected';

  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl glass shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-500">
      
      {/* Media Controls Group */}
      <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="icon"
              className={cn("h-12 w-12 rounded-full transition-all duration-300", !isAudioEnabled && "ring-2 ring-destructive/30")}
              onClick={onToggleAudio}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="icon"
              className={cn("h-12 w-12 rounded-full transition-all duration-300", !isVideoEnabled && "ring-2 ring-destructive/30")}
              onClick={onToggleVideo}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main Action Button */}
      {status === 'idle' || status === 'disconnected' || status === 'error' ? (
        <Button
          size="lg"
          onClick={onStart}
          className="h-12 px-8 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 font-bold text-lg transition-all hover:scale-105 active:scale-95"
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Start Matching
        </Button>
      ) : isSearching ? (
        <Button
          size="lg"
          variant="destructive"
          onClick={onStop}
          className="h-12 px-8 rounded-full font-bold text-lg shadow-lg shadow-destructive/20 animate-pulse"
        >
          <Square className="mr-2 h-4 w-4 fill-current" />
          Stop Searching
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onNext}
          className="h-12 px-8 rounded-full bg-white text-black hover:bg-white/90 font-bold text-lg shadow-lg shadow-white/10 transition-all hover:scale-105 active:scale-95"
        >
          <SkipForward className="mr-2 h-5 w-5" />
          Next Partner
        </Button>
      )}
    </div>
  );
}
