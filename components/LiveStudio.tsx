
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { LiveTranscription } from '../types';

// Manual Base64 encoding/decoding as per requirements
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveStudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<LiveTranscription[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input?: AudioContext, output?: AudioContext }>({});
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptBufferRef = useRef({ user: '', model: '' });
  const frameIntervalRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const stopSession = useCallback(() => {
    setIsActive(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    // Clear video frame interval
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    
    if (audioContextsRef.current.input) audioContextsRef.current.input.close();
    if (audioContextsRef.current.output) audioContextsRef.current.output.close();
    audioContextsRef.current = {};
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      // The supported audio MIME type is 'audio/pcm'.
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      // Create fresh instance before connection
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            // Stream audio from the microphone to the model.
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves to send data.
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            // Stream Video Frames
            // NOTE: Using window.setInterval with sessionPromise.then to avoid stale closures.
            const interval = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  canvasRef.current.width = 320; // Lower resolution for real-time performance
                  canvasRef.current.height = 240;
                  ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
                  const base64Data = dataUrl.split(',')[1];
                  sessionPromise.then(s => s.sendRealtimeInput({ 
                    media: { data: base64Data, mimeType: 'image/jpeg' } 
                  }));
                }
              }
            }, 1000); // Send 1 frame per second
            
            frameIntervalRef.current = interval;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Handling
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const outCtx = audioContextsRef.current.output!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.add(source);
            }

            // Interrupt Handling
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }

            // Transcriptions Handling
            if (message.serverContent?.inputTranscription) {
              transcriptBufferRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptBufferRef.current.model += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              // Copy buffer values to local variables to avoid sync issues during state updates
              const uText = transcriptBufferRef.current.user;
              const mText = transcriptBufferRef.current.model;
              
              // FIX: Explicitly type the new entries array to satisfy SetStateAction<LiveTranscription[]>
              setTranscriptions(prev => {
                const newEntries: LiveTranscription[] = [
                  { id: Date.now() + '-u', role: 'user', text: uText },
                  { id: Date.now() + '-m', role: 'model', text: mText },
                ];
                return [...prev, ...newEntries].slice(-10);
              });
              transcriptBufferRef.current = { user: '', model: '' };
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are Nexus Live, a real-time multimodal AI. You can see through the user's camera and hear them. Be friendly, observant, and concise."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start Live session:', err);
      alert('Camera and Microphone access are required for the Live Studio.');
    }
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Left: Transcription Feed */}
        <div className="lg:col-span-1 bg-gray-900/50 border border-gray-800 rounded-3xl p-6 flex flex-col space-y-4 overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Neural Log</h3>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`}></div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {transcriptions.length === 0 && (
              <p className="text-sm text-gray-600 italic">Conversations will materialize here...</p>
            )}
            {transcriptions.map((t) => (
              <div key={t.id} className={`space-y-1 ${t.role === 'user' ? 'opacity-70' : ''}`}>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-indigo-400">
                  {t.role === 'user' ? 'Human' : 'Nexus'}
                </span>
                <p className="text-sm leading-relaxed text-gray-300">{t.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center: The Core Interaction */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          <div className="flex-1 bg-gray-900/30 border border-gray-800 rounded-[3rem] relative flex items-center justify-center overflow-hidden">
            
            {/* Pulsing AI Visualizer */}
            <div className="relative">
               <div className={`absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full transition-transform duration-1000 ${isActive ? 'scale-150' : 'scale-0'}`}></div>
               <div className={`w-48 h-48 rounded-full border-2 border-indigo-500/30 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110 border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.3)]' : ''}`}>
                 <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center relative overflow-hidden transition-all ${isActive ? 'animate-pulse' : 'grayscale opacity-20'}`}>
                    <i className="fas fa-bolt text-4xl text-white"></i>
                    {isSpeaking && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-white/30 animate-ping"></div>
                      </div>
                    )}
                 </div>
               </div>
            </div>

            {/* Camera Preview PIP */}
            <div className="absolute bottom-8 right-8 w-40 h-52 bg-black border-2 border-gray-700 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-105">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover mirror"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              </div>
            </div>

            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
               <p className={`text-xs font-bold uppercase tracking-[0.3em] transition-all duration-700 ${isActive ? 'text-indigo-400 opacity-100' : 'text-gray-600 opacity-50'}`}>
                 {isActive ? (isSpeaking ? 'Nexus is speaking' : 'Listening to you') : 'System Standby'}
               </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center">
            {isActive ? (
              <button 
                onClick={stopSession}
                className="group flex items-center gap-4 px-10 py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full group-hover:bg-white animate-pulse"></div>
                Terminate Connection
              </button>
            ) : (
              <button 
                onClick={startSession}
                className="flex items-center gap-4 px-12 py-6 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl shadow-indigo-600/30"
              >
                <i className="fas fa-plug text-xl"></i>
                Initiate Nexus Live
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-8 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
        <span className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Low Latency</span>
        <span className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Multimodal Vision</span>
        <span className="flex items-center gap-2"><i className="fas fa-check-circle text-green-500"></i> Full-Duplex Audio</span>
      </div>
    </div>
  );
};

export default LiveStudio;
