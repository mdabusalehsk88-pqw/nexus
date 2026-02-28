
import React, { useState, useEffect } from 'react';
import { generateVideo, checkVideoApiKey, openApiKeySelector } from '../services/geminiService';

interface VideoGeneratorProps {
  onGenerated: (url: string, prompt: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    const ok = await checkVideoApiKey();
    setHasKey(ok);
  };

  const handleSelectKey = async () => {
    await openApiKeySelector();
    setHasKey(true); // Assume success as per guidelines
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setStatus('Initializing generation engine...');
    
    const statusMessages = [
      'Sending prompt to Google Veo...',
      'Synthesizing temporal consistency...',
      'Dreaming in 720p resolution...',
      'Finalizing cinematic frames...',
      'Almost there, hanging tight...'
    ];
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      setStatus(statusMessages[msgIndex]);
      msgIndex = (msgIndex + 1) % statusMessages.length;
    }, 8000);

    try {
      const videoUrl = await generateVideo(prompt, aspectRatio);
      setResult(videoUrl);
      onGenerated(videoUrl, prompt);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("Session expired or API key lost. Please select your key again.");
      } else {
        alert("Video generation can take a few minutes and depends on model availability. Please try again.");
      }
    } finally {
      setLoading(false);
      clearInterval(interval);
      setStatus('');
    }
  };

  if (!hasKey) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 text-center bg-gray-900 border border-gray-800 rounded-3xl space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
          <i className="fas fa-key text-3xl text-amber-500"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold font-outfit mb-2">Billing Account Required</h2>
          <p className="text-gray-400 text-sm">To access Veo's cinematic video generation, you must select an API key from a paid GCP project.</p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-indigo-400 text-xs hover:underline mt-2 inline-block">Learn about billing</a>
        </div>
        <button 
          onClick={handleSelectKey}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all"
        >
          Connect API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Video Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'A slow cinematic tracking shot of a misty forest with fireflies at night, hyperrealistic style'"
              className="w-full h-40 bg-gray-900 border border-gray-800 rounded-2xl p-6 focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-gray-500">Format</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`py-4 rounded-xl border flex items-center justify-center gap-3 font-bold transition-all ${
                  aspectRatio === '16:9' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                }`}
              >
                <i className="fas fa-desktop"></i> Cinematic (16:9)
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`py-4 rounded-xl border flex items-center justify-center gap-3 font-bold transition-all ${
                  aspectRatio === '9:16' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                }`}
              >
                <i className="fas fa-mobile-alt"></i> Vertical (9:16)
              </button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-600/20"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-video"></i>}
            {loading ? 'Generating Movie...' : 'Synthesize Video'}
          </button>
          
          <p className="text-[10px] text-gray-600 italic">Video generation takes 2-5 minutes. Please stay on this tab while it processes.</p>
        </div>

        <div className="aspect-video lg:aspect-auto flex flex-col items-center justify-center bg-gray-900/40 rounded-3xl border border-gray-800 border-dashed relative overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="text-center p-8 space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 border-8 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-purple-400 font-bold mb-1">{status}</p>
                <p className="text-gray-500 text-xs">Our neural networks are weaving your scene...</p>
              </div>
            </div>
          ) : result ? (
            <video 
              src={result} 
              controls 
              autoPlay 
              loop 
              className={`max-w-full max-h-full rounded-2xl ${aspectRatio === '9:16' ? 'h-full' : 'w-full'}`}
            />
          ) : (
            <div className="text-center opacity-40">
              <i className="fas fa-clapperboard text-5xl mb-4 text-purple-400"></i>
              <h3 className="text-lg font-bold">Dream Machine</h3>
              <p className="text-sm px-12">Veo can generate stunning high-definition videos from your imagination.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
