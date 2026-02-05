import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_EVENTS, type ChatMessage } from '@shared/schema';

type ConnectionStatus = 'idle' | 'searching' | 'connecting' | 'connected' | 'disconnected' | 'error';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
};

export function useWebRTC() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Media State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Refs for persistent objects across renders
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize Local Stream
  useEffect(() => {
    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (err) {
        console.error("Failed to access media devices:", err);
        setError("Could not access camera or microphone. Please allow permissions.");
      }
    }
    initLocalStream();

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // WebSocket Setup
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to signaling server');
    };

    socket.onmessage = async (event) => {
      const { type, payload } = JSON.parse(event.data);
      handleSignalingMessage(type, payload);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: WS_EVENTS.SIGNAL,
          payload: { type: 'candidate', payload: event.candidate }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('PC State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('disconnected');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const handleSignalingMessage = async (type: string, data: any) => {
    try {
      switch (type) {
        case WS_EVENTS.MATCHED:
          setStatus('connecting');
          setChatMessages([]); // Clear chat for new partner
          const pc = createPeerConnection();
          if (data.initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.send(JSON.stringify({
              type: WS_EVENTS.SIGNAL,
              payload: { type: 'offer', payload: offer }
            }));
          }
          break;

        case WS_EVENTS.SIGNAL:
          const signal = payload; // Fix: The signal data is in payload
          if (!peerConnectionRef.current) return;

          if (signal.type === 'offer') {
            const pc = peerConnectionRef.current; // Already created by MATCHED
            await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current?.send(JSON.stringify({
              type: WS_EVENTS.SIGNAL,
              payload: { type: 'answer', payload: answer }
            }));
          } else if (signal.type === 'answer') {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.payload));
          } else if (signal.type === 'candidate') {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.payload));
          }
          break;

        case WS_EVENTS.PARTNER_DISCONNECTED:
          setStatus('disconnected');
          setRemoteStream(null);
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          break;

        case WS_EVENTS.MESSAGE:
          setChatMessages(prev => [...prev, { text: data.text, timestamp: Date.now(), isSelf: false }]);
          break;
      }
    } catch (err) {
      console.error('Signaling error:', err);
      setError('Connection failed. Please try again.');
    }
  };

  const startSearching = useCallback(() => {
    setStatus('searching');
    setRemoteStream(null);
    setChatMessages([]);
    setError(null);
    socketRef.current?.send(JSON.stringify({ type: WS_EVENTS.JOIN_QUEUE }));
  }, []);

  const nextPartner = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    // Leave current room/queue implicitly by joining again or explicit leave if implemented
    // For this simple protocol, assume re-joining handles the transition
    startSearching();
  }, [startSearching]);

  const stopSearching = useCallback(() => {
    setStatus('idle');
    socketRef.current?.send(JSON.stringify({ type: WS_EVENTS.LEAVE_QUEUE }));
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (status !== 'connected') return;
    
    socketRef.current?.send(JSON.stringify({
      type: WS_EVENTS.MESSAGE,
      payload: { text }
    }));
    setChatMessages(prev => [...prev, { text, timestamp: Date.now(), isSelf: true }]);
  }, [status]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  return {
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
  };
}
