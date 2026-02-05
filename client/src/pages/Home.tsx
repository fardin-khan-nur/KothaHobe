import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Video as VideoIcon, Sparkles } from 'lucide-react';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useStats } from '@/hooks/use-stats';
import { VideoDisplay } from '@/components/VideoDisplay';
import { ChatBox } from '@/components/ChatBox';
import { Controls } from '@/components/Controls';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';

export default function Home() {
  const {
    localStream,
    remoteStream,
    status,
    chatMessages,
    error,
    isAudioEnabled,
    isVideoEnabled,
    startSearching,
    stopSearching,
    nextPartner,
    sendChatMessage,
    toggleAudio,
    toggleVideo
  } = useWebRTC();

  const { data: stats } = useStats();
  const [showMobileChat, setShowMobileChat] = useState(false);

  return (
    <div className="fixed inset-0 bg-background text-foreground overflow-hidden flex flex-col md:flex-row">
      
      {/* --- Main Video Area --- */}
      <div className="relative flex-1 h-full flex flex-col">
        
        {/* Header Overlay */}
        <header className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <VideoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OmniConnect</h1>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-black/30 px-2 py-0.5 rounded-full w-fit backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {stats?.activeUsers ?? 0} online
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="pointer-events-auto">
            <AnimatePresence mode="wait">
              {status === 'searching' && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold text-sm">Searching for partner...</span>
                </motion.div>
              )}
              {status === 'connected' && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-sm">Connected</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Video Grid */}
        <div className="flex-1 p-4 md:p-6 pt-24 pb-32 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
            
            {/* Local Video - Always visible but changes size/position ideally, keeping simple grid for now */}
            <motion.div 
              layout 
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900"
            >
              <VideoDisplay 
                stream={localStream} 
                isLocal 
                label="You"
                className="w-full h-full"
              />
            </motion.div>

            {/* Remote Video or Placeholder */}
            <motion.div 
              layout
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900"
            >
              {status === 'connected' && remoteStream ? (
                <VideoDisplay 
                  stream={remoteStream} 
                  label="Partner"
                  className="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-display font-bold mb-3">
                      {status === 'searching' ? "Finding someone..." : "Ready to Connect?"}
                    </h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                      {status === 'searching' 
                        ? "We're looking for a random partner for you. Hang tight!" 
                        : "Meet strangers from around the world instantly."}
                    </p>
                    {status === 'idle' && (
                      <Button 
                        size="lg" 
                        onClick={startSearching}
                        className="rounded-full h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200"
                      >
                        Start Matching
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <Controls
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onNext={nextPartner}
            onStart={startSearching}
            onStop={stopSearching}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            status={status}
          />
        </div>

        {/* Mobile Chat Toggle */}
        <div className="absolute bottom-8 right-4 md:hidden z-50">
          <Sheet open={showMobileChat} onOpenChange={setShowMobileChat}>
            <SheetTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-xl">
                <MessageSquare className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0 border-t border-white/10 bg-zinc-950">
              <ChatBox
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                disabled={status !== 'connected'}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-6 py-3 rounded-full shadow-lg font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- Desktop Sidebar Chat --- */}
      <div className="hidden md:block w-80 lg:w-96 border-l border-white/5 bg-black/20 backdrop-blur-xl relative z-40">
        <ChatBox
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          disabled={status !== 'connected'}
        />
      </div>
    </div>
  );
}
